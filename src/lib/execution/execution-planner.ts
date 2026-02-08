/**
 * @file execution-planner.ts
 * @description Build execution plan from workflow graph using topological sort
 */

import type { WorkflowNodeData, WorkflowEdge, WorkflowNode } from '@/components/flow-editor/types';
import type { ExecutionPlan, ExecutionStep } from './types';
import { workflowLogger } from '../monitoring/logger';

/**
 * Helper to get nodeType from workflow node
 *
 * Database nodes are stored as: { id, type, label, icon, config, position, ... }
 * Where 'type' is the nodeType (trigger, action, condition, etc.)
 *
 * React Flow nodes in the editor have: { id, type, data: { nodeType, label, ... } }
 */
function getNodeType(node: WorkflowNodeData | WorkflowNode | any): string {
  // Most common: flat structure from database (type = nodeType)
  if (node.type && typeof node.type === 'string') {
    return node.type;
  }
  // React Flow format with data object
  if (node.data && typeof node.data === 'object' && node.data.nodeType) {
    return node.data.nodeType;
  }
  // Direct nodeType property (WorkflowNodeData)
  if (node.nodeType) {
    return node.nodeType;
  }
  // Fallback to 'action'
  return 'action';
}

/**
 * Helper to get node ID
 */
function getNodeId(node: WorkflowNodeData | WorkflowNode | any): string {
  return (node.id as string) || '';
}

/**
 * Helper to get node label
 */
function getNodeLabel(node: WorkflowNodeData | WorkflowNode | any): string {
  // Direct label property (flat structure from database)
  if (node.label && typeof node.label === 'string') {
    return node.label;
  }
  // React Flow format with data object
  if (node.data && typeof node.data === 'object' && node.data.label) {
    return node.data.label;
  }
  return 'Unknown';
}

/**
 * Normalize a node to WorkflowNodeData format for execution
 *
 * Database format: { id, type, label, icon, config, position, ... }
 * Target format: { id, nodeType, label, icon, config, ... }
 */
function normalizeNode(node: WorkflowNodeData | WorkflowNode | any): WorkflowNodeData {
  // If it's already WorkflowNodeData format (has nodeType directly)
  if (node.nodeType && typeof node.nodeType === 'string') {
    return node as WorkflowNodeData;
  }

  // If it's a React Flow node with data object
  if (node.data && typeof node.data === 'object') {
    return {
      id: node.id,
      ...node.data,
    } as WorkflowNodeData;
  }

  // Flat database format: convert 'type' to 'nodeType'
  if (node.type && typeof node.type === 'string') {
    return {
      id: node.id,
      nodeType: node.type as any,
      label: node.label || 'Unknown',
      description: node.description,
      icon: node.icon,
      status: node.status,
      config: node.config,
      outputs: node.outputs,
    } as WorkflowNodeData;
  }

  return node as WorkflowNodeData;
}

/**
 * Build an execution plan from workflow nodes and edges
 * Uses topological sort to determine execution order
 */
export class ExecutionPlanner {
  /**
   * Create execution plan from workflow
   * Handles both React Flow nodes (from database) and WorkflowNodeData
   */
  static createPlan(
    nodes: (WorkflowNodeData | WorkflowNode | any)[],
    edges: WorkflowEdge[]
  ): ExecutionPlan {
    workflowLogger.debug({ nodeCount: nodes.length, edgeCount: edges.length }, 'Creating execution plan');

    // Build adjacency list (node -> dependencies)
    const dependencies = this.buildDependencyGraph(nodes, edges);

    // Topological sort to determine execution order
    const sortedNodeIds = this.topologicalSort(nodes, dependencies);

    // Build execution steps with normalized nodes
    const steps: ExecutionStep[] = sortedNodeIds.map((nodeId, index) => {
      const rawNode = nodes.find((n) => getNodeId(n) === nodeId);
      if (!rawNode) {
        throw new Error(`Node not found: ${nodeId}`);
      }

      // Normalize the node to WorkflowNodeData format
      const node = normalizeNode(rawNode);

      const outgoingEdges = edges.filter((e) => e.source === nodeId);
      const deps = dependencies.get(nodeId) || [];

      return {
        stepOrder: index,
        nodeId,
        node,
        dependencies: deps,
        edges: outgoingEdges,
      };
    });

    workflowLogger.info({ totalSteps: steps.length }, 'Execution plan created');

    return {
      steps,
      totalSteps: steps.length,
    };
  }

  /**
   * Build dependency graph
   * Returns: Map<nodeId, dependencies[]>
   */
  private static buildDependencyGraph(
    nodes: (WorkflowNodeData | WorkflowNode | any)[],
    edges: WorkflowEdge[]
  ): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    // Initialize all nodes
    nodes.forEach((node) => {
      const nodeId = getNodeId(node);
      graph.set(nodeId, []);
    });

    // Add dependencies based on edges
    edges.forEach((edge) => {
      const deps = graph.get(edge.target) || [];
      deps.push(edge.source);
      graph.set(edge.target, deps);
    });

    return graph;
  }

  /**
   * Topological sort using Kahn's algorithm
   * Returns: Array of node IDs in execution order
   */
  private static topologicalSort(
    nodes: (WorkflowNodeData | WorkflowNode | any)[],
    dependencies: Map<string, string[]>
  ): string[] {
    const sorted: string[] = [];
    const inDegree = new Map<string, number>();
    const queue: string[] = [];

    // Calculate in-degree for each node
    nodes.forEach((node) => {
      const nodeId = getNodeId(node);
      inDegree.set(nodeId, dependencies.get(nodeId)?.length || 0);
    });

    // Find nodes with no dependencies (triggers)
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId);
      }
    });

    // Process queue
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      sorted.push(nodeId);

      // Find all nodes that depend on this node
      dependencies.forEach((deps, dependentId) => {
        if (deps.includes(nodeId)) {
          const newDegree = (inDegree.get(dependentId) || 0) - 1;
          inDegree.set(dependentId, newDegree);

          if (newDegree === 0) {
            queue.push(dependentId);
          }
        }
      });
    }

    // Check for cycles
    if (sorted.length !== nodes.length) {
      const missing = nodes.filter((n) => !sorted.includes(getNodeId(n))).map((n) => getNodeId(n));
      throw new Error(`Workflow contains cycles or disconnected nodes: ${missing.join(', ')}`);
    }

    return sorted;
  }

  /**
   * Validate workflow structure
   * Handles both React Flow nodes (from database) and WorkflowNodeData
   */
  static validate(nodes: (WorkflowNodeData | WorkflowNode | any)[], edges: WorkflowEdge[]): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Log node structure for debugging
    workflowLogger.debug({
      nodeCount: nodes.length,
      firstNodeStructure: nodes[0] ? {
        hasData: 'data' in nodes[0],
        nodeType: getNodeType(nodes[0]),
        id: getNodeId(nodes[0]),
      } : null
    }, 'Validating workflow structure');

    // Check for at least one trigger node (handle both formats)
    const triggers = nodes.filter((n) => getNodeType(n) === 'trigger');
    if (triggers.length === 0) {
      errors.push('Workflow must have at least one trigger node');
    }

    // Check for at least one node
    if (nodes.length === 0) {
      errors.push('Workflow must have at least one node');
    }

    // Check for orphaned nodes (except triggers)
    const connectedNodes = new Set<string>();
    edges.forEach((edge) => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    const orphaned = nodes.filter(
      (n) => getNodeType(n) !== 'trigger' && !connectedNodes.has(getNodeId(n))
    );
    if (orphaned.length > 0) {
      errors.push(`Orphaned nodes detected: ${orphaned.map((n) => getNodeLabel(n)).join(', ')}`);
    }

    // Check for invalid edge references
    const nodeIds = new Set(nodes.map((n) => getNodeId(n)));
    const invalidEdges = edges.filter(
      (e) => !nodeIds.has(e.source) || !nodeIds.has(e.target)
    );
    if (invalidEdges.length > 0) {
      errors.push(`Invalid edge references detected: ${invalidEdges.length} edge(s)`);
    }

    // Try to detect cycles by attempting topological sort
    try {
      const dependencies = this.buildDependencyGraph(nodes, edges);
      this.topologicalSort(nodes, dependencies);
    } catch (error) {
      if (error instanceof Error) {
        errors.push(error.message);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
