/**
 * @file anthropic-handler.ts
 * @description Anthropic Claude integration handler
 */

import { BaseNodeHandler } from './base-handler';
import type { NodeExecutionResult, ExecutionContext } from '../types';
import type { WorkflowNodeData } from '@/components/flow-editor/types';
import { getIntegrationCredentials } from '@/lib/security/integration-credentials';
import { logIntegrationUsage } from '@/lib/monitoring/logger';
import { withRetry, WorkflowExecutionError, ErrorType } from '../error-handler';
import Anthropic from '@anthropic-ai/sdk';
import type { AnthropicIntegrationConfig } from '@/types/workflow';

/**
 * Anthropic Claude Handler
 */
export class AnthropicClaudeHandler extends BaseNodeHandler {
  protected nodeType = 'anthropic:claude';

  async execute(
    node: WorkflowNodeData,
    context: ExecutionContext,
    config?: any
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const resolvedConfig = this.resolveConfig(config || ((node as any).data).config, context);

      const {
        integrationId,
        model = 'claude-3-5-sonnet-20241022',
        messages,
        prompt, // Simple prompt (converted to messages)
        system,
        maxTokens = 1024,
        temperature = 1,
        topP,
        topK,
        stopSequences,
      } = resolvedConfig;

      if (!integrationId) {
        throw new Error('Integration ID is required');
      }

      // Get Anthropic credentials
      const credentials = await getIntegrationCredentials<AnthropicIntegrationConfig>(integrationId);
      if (!credentials) {
        throw new Error('Anthropic credentials not found');
      }

      // Initialize Anthropic client
      const anthropic = new Anthropic({
        apiKey: credentials.apiKey,
      });

      // Build messages array
      let messagesArray: Array<{ role: 'user' | 'assistant'; content: string }> = [];

      if (messages && Array.isArray(messages)) {
        messagesArray = messages;
      } else if (prompt) {
        messagesArray.push({ role: 'user', content: prompt });
      } else {
        throw new Error('Either messages array or prompt is required');
      }

      // Call Anthropic with retry
      const result = await withRetry(
        async () => {
          const message = await anthropic.messages.create({
            model,
            max_tokens: maxTokens,
            messages: messagesArray,
            system: system || undefined,
            temperature: temperature,
            top_p: topP || undefined,
            top_k: topK || undefined,
            stop_sequences: stopSequences || undefined,
          });

          return message;
        },
        { maxAttempts: 3, initialDelay: 2000 },
        { nodeId: ((node as any).id as string), nodeType: this.nodeType }
      );

      // Extract text content
      const textContent = result.content
        .filter((block) => block.type === 'text')
        .map((block) => (block as any).text)
        .join('\n');

      logIntegrationUsage({
        integrationId,
        integrationType: 'anthropic',
        action: 'create-message',
        success: true,
        duration: Date.now() - startTime,
      });

      return this.success(
        {
          content: textContent,
          role: result.role,
          model: result.model,
          stopReason: result.stop_reason,
          usage: result.usage,
          id: result.id,
        },
        startTime
      );
    } catch (error) {
      this.log('error', 'Anthropic Claude message failed', { error });

      logIntegrationUsage({
        integrationId: config?.integrationId,
        integrationType: 'anthropic',
        action: 'create-message',
        success: false,
        duration: Date.now() - startTime,
      });

      // Handle specific Anthropic errors
      if (error && typeof error === 'object' && 'status' in error) {
        const err = error as any;
        if (err.status === 401) {
          return this.failure(
            new WorkflowExecutionError(
              'Anthropic authentication failed',
              ErrorType.AUTHENTICATION_ERROR,
              false
            ),
            startTime
          );
        }
        if (err.status === 429) {
          return this.failure(
            new WorkflowExecutionError(
              'Anthropic rate limit exceeded',
              ErrorType.RATE_LIMIT_ERROR,
              true
            ),
            startTime
          );
        }
      }

      return this.failure(error as Error, startTime);
    }
  }
}
