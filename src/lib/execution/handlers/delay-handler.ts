/**
 * @file delay-handler.ts
 * @description Delay/wait node handler
 */

import { BaseNodeHandler } from './base-handler';
import type { NodeExecutionResult, ExecutionContext } from '../types';
import type { WorkflowNodeData } from '@/components/flow-editor/types';

/**
 * Delay Handler
 * Waits for a specified duration before continuing
 */
export class DelayHandler extends BaseNodeHandler {
  protected nodeType = 'delay';

  async execute(
    node: WorkflowNodeData,
    context: ExecutionContext,
    config?: any
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const resolvedConfig = this.resolveConfig(config || ((node as any).data).config, context);

      const {
        duration = 1000,
        unit = 'milliseconds',
      } = resolvedConfig;

      // Convert to milliseconds
      let delayMs = duration;
      switch (unit) {
        case 'seconds':
          delayMs = duration * 1000;
          break;
        case 'minutes':
          delayMs = duration * 60 * 1000;
          break;
        case 'hours':
          delayMs = duration * 60 * 60 * 1000;
          break;
      }

      // Maximum delay: 1 hour
      if (delayMs > 3600000) {
        throw new Error('Maximum delay is 1 hour');
      }

      this.log('info', `Delaying for ${delayMs}ms`);

      // Wait
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      return this.success(
        {
          delayMs,
          unit,
          duration,
        },
        startTime
      );
    } catch (error) {
      this.log('error', 'Delay failed', { error });
      return this.failure(error as Error, startTime);
    }
  }
}
