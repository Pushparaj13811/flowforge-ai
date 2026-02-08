/**
 * @file base-handler.ts
 * @description Base class for all node handlers
 */

import type { NodeHandler, ExecutionContext, NodeExecutionResult } from '../types';
import type { WorkflowNodeData } from '@/components/flow-editor/types';
import { workflowLogger } from '@/lib/monitoring/logger';
import { resolveValue } from '../variable-resolver';

/**
 * Base node handler with common functionality
 */
export abstract class BaseNodeHandler implements NodeHandler {
  protected abstract nodeType: string;

  /**
   * Execute the node (must be implemented by subclasses)
   */
  abstract execute(
    node: WorkflowNodeData,
    context: ExecutionContext,
    config?: any
  ): Promise<NodeExecutionResult>;

  /**
   * Validate node configuration
   */
  validate(node: WorkflowNodeData): boolean {
    return true; // Override in subclasses if needed
  }

  /**
   * Get node config safely with type casting
   */
  protected getNodeConfig(node: WorkflowNodeData): any {
    return (node as any).data?.config || (node as any).config || {};
  }

  /**
   * Resolve node configuration with variables
   */
  protected resolveConfig(config: any, context: ExecutionContext): any {
    return resolveValue(config, context);
  }

  /**
   * Create a success result
   */
  protected success(output: any, startTime: number): NodeExecutionResult {
    return {
      success: true,
      output,
      duration: Date.now() - startTime,
      startedAt: new Date(startTime),
      completedAt: new Date(),
    };
  }

  /**
   * Create a failure result
   */
  protected failure(error: string | Error, startTime: number): NodeExecutionResult {
    const errorMessage = error instanceof Error ? error.message : error;

    return {
      success: false,
      output: null,
      error: errorMessage,
      duration: Date.now() - startTime,
      startedAt: new Date(startTime),
      completedAt: new Date(),
    };
  }

  /**
   * Log handler execution
   */
  protected log(level: 'info' | 'error' | 'warn', message: string, data?: any) {
    workflowLogger[level]({ ...data, handler: this.nodeType }, message);
  }
}
