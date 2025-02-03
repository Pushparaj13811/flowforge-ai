/**
 * @file discord-handler.ts
 * @description Discord integration handler
 */

import { BaseNodeHandler } from './base-handler';
import type { NodeExecutionResult, ExecutionContext } from '../types';
import type { WorkflowNodeData } from '@/components/flow-editor/types';
import { logIntegrationUsage } from '@/lib/monitoring/logger';
import { withRetry } from '../error-handler';

/**
 * Discord Webhook Handler
 */
export class DiscordWebhookHandler extends BaseNodeHandler {
  protected nodeType = 'discord:webhook';

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
        content,
        username,
        avatarUrl,
        embeds,
        tts = false,
      } = resolvedConfig;

      if (!webhookUrl) {
        throw new Error('Webhook URL is required');
      }

      if (!content && (!embeds || embeds.length === 0)) {
        throw new Error('Content or embeds are required');
      }

      // Build payload
      const payload: any = {
        content,
        username,
        avatar_url: avatarUrl,
        tts,
      };

      if (embeds && embeds.length > 0) {
        payload.embeds = embeds;
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
            throw new Error(`Discord API error (${response.status}): ${errorText}`);
          }

          // Discord returns 204 No Content on success
          return {
            statusCode: response.status,
            success: true,
          };
        },
        { maxAttempts: 3, initialDelay: 1000 },
        { nodeId: ((node as any).id as string), nodeType: this.nodeType }
      );

      logIntegrationUsage({
        integrationId: 'discord-webhook',
        integrationType: 'discord',
        action: 'send-message',
        success: true,
        duration: Date.now() - startTime,
      });

      return this.success(
        {
          statusCode: result.statusCode,
          content: content || 'Embed sent',
          username,
        },
        startTime
      );
    } catch (error) {
      this.log('error', 'Discord webhook send failed', { error });

      logIntegrationUsage({
        integrationId: 'discord-webhook',
        integrationType: 'discord',
        action: 'send-message',
        success: false,
        duration: Date.now() - startTime,
      });

      return this.failure(error as Error, startTime);
    }
  }
}
