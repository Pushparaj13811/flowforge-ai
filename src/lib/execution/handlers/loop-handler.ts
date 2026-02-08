/**
 * @file loop-handler.ts
 * @description Handlers for loop nodes (For Each, Repeat)
 */

import { BaseNodeHandler } from './base-handler';
import type { ExecutionContext, NodeExecutionResult } from '../types';
import type { WorkflowNodeData } from '@/components/flow-editor/types';

/**
 * For Each loop handler - iterates over an array
 */
export class ForEachLoopHandler extends BaseNodeHandler {
  protected nodeType = 'loop:foreach';

  async execute(
    node: WorkflowNodeData,
    context: ExecutionContext,
    config?: Record<string, unknown>
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const nodeConfig = config || this.getNodeConfig(node);
      const resolvedConfig = this.resolveConfig(nodeConfig, context);

      // Get the array to iterate
      let arrayData = resolvedConfig.array;

      // If array is a string (variable reference), try to parse it
      if (typeof arrayData === 'string') {
        try {
          arrayData = JSON.parse(arrayData);
        } catch {
          // If it's not JSON, maybe it's a single item - wrap in array
          arrayData = [arrayData];
        }
      }

      if (!Array.isArray(arrayData)) {
        return this.failure('Array to iterate is not an array', startTime);
      }

      this.log('info', 'Executing for-each loop', {
        nodeId: node.id,
        itemCount: arrayData.length,
      });

      // For now, we return the array with loop context info
      // The actual iteration would be handled by the workflow runtime
      // which would execute child nodes for each item
      const results = arrayData.map((item, index) => ({
        item,
        index,
      }));

      return this.success(
        {
          items: arrayData,
          count: arrayData.length,
          results,
          // Provide current item/index for the first iteration
          // In real execution, the runtime would update these per iteration
          currentItem: arrayData[0],
          currentIndex: 0,
        },
        startTime
      );
    } catch (error) {
      this.log('error', 'For-each loop failed', { error });
      return this.failure(error as Error, startTime);
    }
  }
}

/**
 * Repeat loop handler - repeats N times
 */
export class RepeatLoopHandler extends BaseNodeHandler {
  protected nodeType = 'loop:repeat';

  async execute(
    node: WorkflowNodeData,
    context: ExecutionContext,
    config?: Record<string, unknown>
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const nodeConfig = config || this.getNodeConfig(node);
      const resolvedConfig = this.resolveConfig(nodeConfig, context);

      // Get repeat count
      let count = resolvedConfig.count;
      if (typeof count === 'string') {
        count = parseInt(count, 10);
      }

      if (isNaN(count) || count < 1) {
        count = 1;
      }

      // Cap at a reasonable maximum to prevent infinite loops
      const maxIterations = 1000;
      if (count > maxIterations) {
        this.log('warn', 'Repeat count capped at maximum', {
          requested: count,
          max: maxIterations,
        });
        count = maxIterations;
      }

      this.log('info', 'Executing repeat loop', {
        nodeId: node.id,
        count,
      });

      // Generate iteration indices
      const iterations = Array.from({ length: count }, (_, i) => i);

      return this.success(
        {
          count,
          iterations,
          // For the runtime to know how many times to execute child nodes
          currentIndex: 0,
        },
        startTime
      );
    } catch (error) {
      this.log('error', 'Repeat loop failed', { error });
      return this.failure(error as Error, startTime);
    }
  }
}
