/**
 * @file workflow-runtime.ts
 * @description Main workflow execution engine
 */

import { db } from '@/db';
import { workflows, executions, executionSteps } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ExecutionPlanner } from './execution-planner';
import type { ExecutionContext, NodeExecutionResult, ExecutionPlan, ExecutionStep } from './types';
import type { WorkflowNodeData, WorkflowEdge } from '@/components/flow-editor/types';
import { workflowLogger } from '../monitoring/logger';
import { recordWorkflowExecution, recordNodeExecution } from '../monitoring/metrics';

/**
 * Workflow Runtime Engine
 * Orchestrates the execution of workflow nodes in the correct order
 */
export class WorkflowRuntime {
  /**
   * Execute a workflow
   */
  async executeWorkflow(
    workflowId: string,
    executionId: string,
    triggerData: any,
    userId?: string
  ): Promise<ExecutionContext> {
    const startTime = Date.now();

    workflowLogger.info(
      { workflowId, executionId, userId },
      'Starting workflow execution'
    );

    try {
      // Load workflow from database
      const workflow = await db.query.workflows.findFirst({
        where: eq(workflows.id, workflowId),
      });

      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      // Validate workflow structure
      // Note: workflow.nodes are React Flow nodes, not WorkflowNodeData directly
      // The ExecutionPlanner now handles both formats
      const validation = ExecutionPlanner.validate(
        workflow.nodes as any[],
        workflow.edges as any[]
      );

      if (!validation.valid) {
        throw new Error(`Invalid workflow: ${validation.errors.join(', ')}`);
      }

      // Create execution plan
      const plan = ExecutionPlanner.createPlan(
        workflow.nodes as any[],
        workflow.edges as any[]
      );

      // Initialize execution context
      const context: ExecutionContext = {
        workflowId,
        executionId,
        userId,
        triggerData,
        variables: {},
        results: {},
        stepsByLabel: {}, // For $steps.label_slug access
      };

      // Update execution status to running
      await db
        .update(executions)
        .set({
          status: 'running',
          startedAt: new Date(),
        })
        .where(eq(executions.id, executionId));

      // Execute the plan
      await this.executePlan(plan, context);

      // Mark execution as completed
      const duration = Date.now() - startTime;
      await db
        .update(executions)
        .set({
          status: 'completed',
          completedAt: new Date(),
          duration,
        })
        .where(eq(executions.id, executionId));

      // Update workflow stats
      await db
        .update(workflows)
        .set({
          executionCount: workflow.executionCount + 1,
          lastRunAt: new Date(),
        })
        .where(eq(workflows.id, workflowId));

      // Record metrics
      await recordWorkflowExecution(workflowId, 'success', duration);

      workflowLogger.info(
        { workflowId, executionId, duration },
        'Workflow execution completed'
      );

      return context;
    } catch (error) {
      const duration = Date.now() - startTime;

      workflowLogger.error(
        { workflowId, executionId, error, duration },
        'Workflow execution failed'
      );

      // Mark execution as failed
      await db
        .update(executions)
        .set({
          status: 'failed',
          completedAt: new Date(),
          duration,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        .where(eq(executions.id, executionId));

      // Record metrics
      await recordWorkflowExecution(workflowId, 'failed', duration);

      throw error;
    }
  }

  /**
   * Execute an execution plan
   * Handles conditional branching by tracking which nodes should be skipped
   */
  private async executePlan(plan: ExecutionPlan, context: ExecutionContext): Promise<void> {
    workflowLogger.debug(
      { totalSteps: plan.totalSteps },
      'Executing plan'
    );

    // Track nodes that should be skipped due to conditional branching
    const skippedNodes = new Set<string>();

    // Build a map of edges for quick lookup (source -> edges)
    const edgesBySource = new Map<string, WorkflowEdge[]>();
    for (const step of plan.steps) {
      if (step.edges && step.edges.length > 0) {
        edgesBySource.set(step.nodeId, step.edges);
      }
    }

    for (const step of plan.steps) {
      context.currentStep = step.stepOrder;

      // Check if this node should be skipped due to conditional branching
      if (skippedNodes.has(step.nodeId)) {
        workflowLogger.debug(
          { stepOrder: step.stepOrder, nodeId: step.nodeId, nodeType: step.node.nodeType },
          'Skipping step due to conditional branch'
        );

        // Record skipped step
        context.results[step.nodeId] = {
          success: true,
          output: { skipped: true, reason: 'Conditional branch not taken' },
          duration: 0,
          startedAt: new Date(),
          completedAt: new Date(),
          nodeLabel: step.node.label,
        };

        continue;
      }

      workflowLogger.debug(
        { stepOrder: step.stepOrder, nodeId: step.nodeId, nodeType: step.node.nodeType },
        'Executing step'
      );

      // Execute the step
      const result = await this.executeStep(step.node, context);

      // Add node label to result for label-based lookups
      result.nodeLabel = step.node.label;

      // Store result in context by node ID
      context.results[step.nodeId] = result;

      // Also store by label slug for $steps.label_slug access
      if (step.node.label && context.stepsByLabel) {
        const { labelToSlug } = await import('./variable-resolver');
        const labelSlug = labelToSlug(step.node.label);
        context.stepsByLabel[labelSlug] = result;
      }

      // Handle conditional branching: mark nodes on the non-taken branch as skipped
      if (step.node.nodeType === 'condition' && result.success && result.output?.branch) {
        const takenBranch = result.output.branch; // 'yes' or 'no'
        const outgoingEdges = edgesBySource.get(step.nodeId) || [];

        workflowLogger.debug(
          { nodeId: step.nodeId, takenBranch, edgeCount: outgoingEdges.length },
          'Processing conditional branch'
        );

        // Find nodes connected to the non-taken branch and mark them for skipping
        for (const edge of outgoingEdges) {
          const edgeBranch = edge.sourceHandle; // 'yes', 'no', or undefined

          if (edgeBranch && edgeBranch !== takenBranch) {
            // This edge leads to the non-taken branch - mark target and its descendants for skipping
            this.markBranchForSkipping(edge.target, plan, edgesBySource, skippedNodes, step.nodeId);
          }
        }
      }

      // Log step completion
      workflowLogger.debug(
        { stepOrder: step.stepOrder, nodeId: step.nodeId, success: result.success },
        'Step completed'
      );

      // If step failed, stop execution
      if (!result.success) {
        throw new Error(`Step failed: ${step.node.label} - ${result.error}`);
      }
    }
  }

  /**
   * Recursively mark a node and its descendants for skipping
   * Only marks nodes that are exclusively reachable from the skipped branch
   */
  private markBranchForSkipping(
    nodeId: string,
    plan: ExecutionPlan,
    edgesBySource: Map<string, WorkflowEdge[]>,
    skippedNodes: Set<string>,
    conditionNodeId: string
  ): void {
    // Don't re-process already marked nodes
    if (skippedNodes.has(nodeId)) {
      return;
    }

    // Find the step for this node to check its dependencies
    const step = plan.steps.find(s => s.nodeId === nodeId);
    if (!step) {
      return;
    }

    // Check if this node has any dependencies from the taken branch
    // If all dependencies lead back to the condition node through the skipped branch,
    // then this node should be skipped
    const hasActiveDependency = step.dependencies.some(depId => {
      // If the dependency is the condition node itself, we know this path comes from the condition
      if (depId === conditionNodeId) {
        return false; // Don't count the condition node as an active dependency
      }
      // If the dependency is already skipped, it's not active
      if (skippedNodes.has(depId)) {
        return false;
      }
      // Otherwise, there's an active path to this node
      return true;
    });

    // If there's an active dependency from another path, don't skip this node
    if (hasActiveDependency) {
      workflowLogger.debug(
        { nodeId, conditionNodeId },
        'Node has active dependency from another path, not skipping'
      );
      return;
    }

    // Mark this node for skipping
    skippedNodes.add(nodeId);
    workflowLogger.debug(
      { nodeId, conditionNodeId },
      'Marking node for skipping due to conditional branch'
    );

    // Recursively mark downstream nodes
    const outgoingEdges = edgesBySource.get(nodeId) || [];
    for (const edge of outgoingEdges) {
      this.markBranchForSkipping(edge.target, plan, edgesBySource, skippedNodes, conditionNodeId);
    }
  }

  /**
   * Execute a single node
   */
  private async executeStep(
    node: WorkflowNodeData,
    context: ExecutionContext
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    // Create execution step record
    const [stepRecord] = await db
      .insert(executionSteps)
      .values({
        executionId: context.executionId,
        nodeId: node.id || '',
        name: node.label,
        type: node.nodeType,
        status: 'running' as const,
        startedAt: new Date(),
        stepOrder: context.currentStep || 0,
      } as any) // TODO: Fix executionSteps schema types
      .returning({ id: executionSteps.id });

    try {
      // Import handler registry dynamically
      const { getHandlerForNode, determineHandlerType } = await import('./handlers');

      // Determine the specific handler type from node metadata (label, icon, config)
      const handlerType = determineHandlerType({
        nodeType: node.nodeType,
        label: node.label,
        icon: node.icon as string | undefined,
        config: node.config as Record<string, unknown> | undefined,
      });

      // Get handler for this node
      const handler = getHandlerForNode({
        nodeType: node.nodeType,
        label: node.label,
        icon: node.icon as string | undefined,
        config: node.config as Record<string, unknown> | undefined,
      });

      if (!handler) {
        workflowLogger.warn(
          { nodeType: node.nodeType, handlerType, label: node.label },
          'No handler found for node type, skipping'
        );

        // Skip nodes without handlers
        const result: NodeExecutionResult = {
          success: true,
          output: { skipped: true, reason: 'No handler available' },
          duration: Date.now() - startTime,
          startedAt: new Date(startTime),
          completedAt: new Date(),
        };

        await db
          .update(executionSteps)
          .set({
            status: 'skipped',
            completedAt: new Date(),
            duration: result.duration,
            outputSummary: JSON.stringify(result.output),
          })
          .where(eq(executionSteps.id, stepRecord.id));

        return result;
      }

      workflowLogger.info(
        { nodeId: node.id, nodeType: node.nodeType, handlerType, label: node.label },
        'Executing node'
      );

      // Execute the node using its handler
      const result = await handler.execute(node, context, node.config);

      // Update step record
      await db
        .update(executionSteps)
        .set({
          status: result.success ? 'completed' : 'failed',
          completedAt: new Date(),
          duration: result.duration,
          outputSummary: result.output ? JSON.stringify(result.output) : null,
          error: result.error,
        })
        .where(eq(executionSteps.id, stepRecord.id));

      // Record metrics
      await recordNodeExecution(
        node.nodeType,
        result.success ? 'success' : 'failed',
        result.duration
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update step record
      await db
        .update(executionSteps)
        .set({
          status: 'failed',
          completedAt: new Date(),
          duration,
          error: errorMessage,
        })
        .where(eq(executionSteps.id, stepRecord.id));

      // Record metrics
      await recordNodeExecution(node.nodeType, 'failed', duration);

      return {
        success: false,
        output: null,
        error: errorMessage,
        duration,
        startedAt: new Date(startTime),
        completedAt: new Date(),
      };
    }
  }
}
