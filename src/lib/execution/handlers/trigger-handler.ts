/**
 * @file trigger-handler.ts
 * @description Handler for trigger nodes (webhook, form submit, schedule, etc.)
 *
 * Trigger nodes don't execute actions - they simply pass through the trigger data
 * that was received when the workflow was triggered (via webhook, form, etc.)
 */

import { BaseNodeHandler } from './base-handler';
import type { NodeExecutionResult, ExecutionContext } from '../types';
import type { WorkflowNodeData } from '@/components/flow-editor/types';

/**
 * Trigger Handler
 *
 * This handler is used for trigger nodes (webhook, form submit, schedule, etc.)
 * It doesn't execute any external action - it simply passes through the trigger data
 * that was provided when the workflow was started.
 */
export class TriggerHandler extends BaseNodeHandler {
  protected nodeType = 'trigger';

  async execute(
    node: WorkflowNodeData,
    context: ExecutionContext,
    config?: any
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      this.log('info', 'Processing trigger node', {
        nodeId: node.id,
        label: node.label,
        triggerDataKeys: Object.keys(context.triggerData || {}),
      });

      // The trigger node simply passes through the trigger data
      // This data was set when the workflow was triggered (via webhook, form, etc.)
      const triggerData = context.triggerData || {};

      // Store trigger data in context for downstream nodes to access via $trigger
      context.variables['$trigger'] = triggerData;

      this.log('info', 'Trigger node processed successfully', {
        nodeId: node.id,
        dataFields: Object.keys(triggerData),
      });

      return this.success(
        {
          data: triggerData,
          message: 'Trigger data passed through successfully',
        },
        startTime
      );
    } catch (error) {
      this.log('error', 'Trigger node failed', { error });
      return this.failure(error as Error, startTime);
    }
  }
}
