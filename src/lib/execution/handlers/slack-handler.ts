/**
 * @file slack-handler.ts
 * @description Slack integration node handler
 */

import { BaseNodeHandler } from './base-handler';
import type { NodeExecutionResult, ExecutionContext } from '../types';
import type { WorkflowNodeData } from '@/components/flow-editor/types';
import { getIntegrationCredentials } from '@/lib/security/integration-credentials';
import type { SlackIntegrationConfig } from '@/types/workflow';
import { logIntegrationUsage } from '@/lib/monitoring/logger';
import { withRetry, WorkflowExecutionError, ErrorType } from '../error-handler';

/**
 * Slack Send Message Handler
 */
export class SlackSendMessageHandler extends BaseNodeHandler {
  protected nodeType = 'slack:send-message';

  async execute(
    node: WorkflowNodeData,
    context: ExecutionContext,
    config?: any
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      // Resolve configuration with variables
      const resolvedConfig = this.resolveConfig(config || ((node as any).data).config, context);

      const {
        integrationId,
        channel,
        message,
        blocks,
      } = resolvedConfig;

      if (!integrationId) {
        throw new Error('Integration ID is required');
      }

      if (!channel) {
        throw new Error('Channel is required');
      }

      if (!message && !blocks) {
        throw new Error('Message or blocks are required');
      }

      // Get credentials
      const credentials = await getIntegrationCredentials<SlackIntegrationConfig>(integrationId);
      if (!credentials) {
        throw new Error('Integration credentials not found');
      }

      // Send message to Slack with retry logic
      const result = await withRetry(
        async () => {
          const response = await fetch('https://slack.com/api/chat.postMessage', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.botToken}`,
            },
            body: JSON.stringify({
              channel,
              text: message,
              blocks,
            }),
          });

          const data = await response.json();

          if (!data.ok) {
            // Check for rate limiting
            if (data.error === 'rate_limited') {
              throw new WorkflowExecutionError(
                'Slack rate limit exceeded',
                ErrorType.RATE_LIMIT_ERROR,
                true
              );
            }

            // Authentication errors should not be retried
            if (data.error === 'invalid_auth' || data.error === 'account_inactive') {
              throw new WorkflowExecutionError(
                `Slack authentication error: ${data.error}`,
                ErrorType.AUTHENTICATION_ERROR,
                false
              );
            }

            throw new Error(`Slack API error: ${data.error}`);
          }

          return data;
        },
        { maxAttempts: 3, initialDelay: 1000 },
        { nodeId: ((node as any).id as string), nodeType: this.nodeType }
      );

      // Log integration usage
      logIntegrationUsage({
        integrationId,
        integrationType: 'slack',
        action: 'send-message',
        success: true,
        duration: Date.now() - startTime,
      });

      return this.success(
        {
          messageId: result.ts,
          channel: result.channel,
          message,
        },
        startTime
      );
    } catch (error) {
      this.log('error', 'Slack send message failed', { error });

      logIntegrationUsage({
        integrationId: config?.integrationId,
        integrationType: 'slack',
        action: 'send-message',
        success: false,
        duration: Date.now() - startTime,
      });

      return this.failure(error as Error, startTime);
    }
  }
}
