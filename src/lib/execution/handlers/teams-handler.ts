/**
 * @file teams-handler.ts
 * @description Microsoft Teams integration handler
 */

import { BaseNodeHandler } from './base-handler';
import type { NodeExecutionResult, ExecutionContext } from '../types';
import type { WorkflowNodeData } from '@/components/flow-editor/types';
import { logIntegrationUsage } from '@/lib/monitoring/logger';
import { withRetry } from '../error-handler';

/**
 * Microsoft Teams Webhook Handler
 */
export class TeamsWebhookHandler extends BaseNodeHandler {
  protected nodeType = 'teams:webhook';

  async execute(
    node: WorkflowNodeData,
    context: ExecutionContext,
    config?: any
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const resolvedConfig = this.resolveConfig(config || ((node as any).data).config, context);

      const {
        webhookUrl,
        title,
        text,
        summary,
        themeColor,
        sections,
        potentialAction,
      } = resolvedConfig;

      if (!webhookUrl) {
        throw new Error('Webhook URL is required');
      }

      if (!title && !text) {
        throw new Error('Title or text is required');
      }

      // Build MessageCard payload
      const payload: any = {
        '@type': 'MessageCard',
        '@context': 'https://schema.org/extensions',
        summary: summary || title || text,
        themeColor: themeColor || '0078D4', // Microsoft blue
      };

      if (title) {
        payload.title = title;
      }

      if (text) {
        payload.text = text;
      }

      if (sections && sections.length > 0) {
        payload.sections = sections;
      }

      if (potentialAction && potentialAction.length > 0) {
        payload.potentialAction = potentialAction;
      }

      // Send with retry
      const result = await withRetry(
        async () => {
          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Teams API error (${response.status}): ${errorText}`);
          }

          const data = await response.text();
          return {
            statusCode: response.status,
            body: data,
          };
        },
        { maxAttempts: 3, initialDelay: 1000 },
        { nodeId: ((node as any).id as string), nodeType: this.nodeType }
      );

      logIntegrationUsage({
        integrationId: 'teams-webhook',
        integrationType: 'teams',
        action: 'send-message',
        success: true,
        duration: Date.now() - startTime,
      });

      return this.success(
        {
          statusCode: result.statusCode,
          title: title || 'Message sent',
          text,
        },
        startTime
      );
    } catch (error) {
      this.log('error', 'Teams webhook send failed', { error });

      logIntegrationUsage({
        integrationId: 'teams-webhook',
        integrationType: 'teams',
        action: 'send-message',
        success: false,
        duration: Date.now() - startTime,
      });

      return this.failure(error as Error, startTime);
    }
  }
}
