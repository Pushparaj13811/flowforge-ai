/**
 * @file openai-handler.ts
 * @description OpenAI integration handlers
 */

import { BaseNodeHandler } from './base-handler';
import type { NodeExecutionResult, ExecutionContext } from '../types';
import type { WorkflowNodeData } from '@/components/flow-editor/types';
import { getIntegrationCredentials } from '@/lib/security/integration-credentials';
import { logIntegrationUsage } from '@/lib/monitoring/logger';
import { withRetry, WorkflowExecutionError, ErrorType } from '../error-handler';
import OpenAI from 'openai';

interface OpenAIConfig {
  apiKey: string;
  organization?: string;
}

/**
 * OpenAI Chat Completion Handler
 */
export class OpenAIChatHandler extends BaseNodeHandler {
  protected nodeType = 'openai:chat';

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
        model = 'gpt-4-turbo-preview',
        messages,
        prompt, // Simple prompt (converted to messages)
        systemPrompt,
        temperature = 0.7,
        maxTokens = 1000,
        topP = 1,
        frequencyPenalty = 0,
        presencePenalty = 0,
        stop,
        responseFormat,
      } = resolvedConfig;

      if (!integrationId) {
        throw new Error('Integration ID is required');
      }

      // Get OpenAI credentials
      const credentials = await getIntegrationCredentials<OpenAIConfig>(integrationId);
      if (!credentials) {
        throw new Error('OpenAI credentials not found');
      }

      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: credentials.apiKey,
        organization: credentials.organization,
      });

      // Build messages array
      let messagesArray: Array<{ role: string; content: string }> = [];

      if (messages && Array.isArray(messages)) {
        messagesArray = messages;
      } else if (prompt) {
        if (systemPrompt) {
          messagesArray.push({ role: 'system', content: systemPrompt });
        }
        messagesArray.push({ role: 'user', content: prompt });
      } else {
        throw new Error('Either messages array or prompt is required');
      }

      // Call OpenAI with retry
      const result = await withRetry(
        async () => {
          const completion = await openai.chat.completions.create({
            model,
            messages: messagesArray as any,
            temperature,
            max_tokens: maxTokens,
            top_p: topP,
            frequency_penalty: frequencyPenalty,
            presence_penalty: presencePenalty,
            stop: stop || undefined,
            response_format: responseFormat || undefined,
          });

          return completion;
        },
        { maxAttempts: 3, initialDelay: 2000 },
        { nodeId: ((node as any).id as string), nodeType: this.nodeType }
      );

      logIntegrationUsage({
        integrationId,
        integrationType: 'openai',
        action: 'chat-completion',
        success: true,
        duration: Date.now() - startTime,
      });

      return this.success(
        {
          content: result.choices[0]?.message?.content || '',
          role: result.choices[0]?.message?.role || 'assistant',
          finishReason: result.choices[0]?.finish_reason,
          model: result.model,
          usage: result.usage,
          id: result.id,
        },
        startTime
      );
    } catch (error) {
      this.log('error', 'OpenAI chat completion failed', { error });

      logIntegrationUsage({
        integrationId: config?.integrationId,
        integrationType: 'openai',
        action: 'chat-completion',
        success: false,
        duration: Date.now() - startTime,
      });

      // Handle specific OpenAI errors
      if (error && typeof error === 'object' && 'status' in error) {
        const err = error as any;
        if (err.status === 401) {
          return this.failure(
            new WorkflowExecutionError(
              'OpenAI authentication failed',
              ErrorType.AUTHENTICATION_ERROR,
              false
            ),
            startTime
          );
        }
        if (err.status === 429) {
          return this.failure(
            new WorkflowExecutionError(
              'OpenAI rate limit exceeded',
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

/**
 * OpenAI Embeddings Handler
 */
export class OpenAIEmbeddingsHandler extends BaseNodeHandler {
  protected nodeType = 'openai:embeddings';

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
        input,
        model = 'text-embedding-3-small',
      } = resolvedConfig;

      if (!integrationId) {
        throw new Error('Integration ID is required');
      }

      if (!input) {
        throw new Error('Input text is required');
      }

      const credentials = await getIntegrationCredentials<OpenAIConfig>(integrationId);
      if (!credentials) {
        throw new Error('OpenAI credentials not found');
      }

      const openai = new OpenAI({
        apiKey: credentials.apiKey,
        organization: credentials.organization,
      });

      const result = await withRetry(
        async () => {
          const embedding = await openai.embeddings.create({
            model,
            input,
          });
          return embedding;
        },
        { maxAttempts: 3, initialDelay: 2000 },
        { nodeId: ((node as any).id as string), nodeType: this.nodeType }
      );

      logIntegrationUsage({
        integrationId,
        integrationType: 'openai',
        action: 'create-embeddings',
        success: true,
        duration: Date.now() - startTime,
      });

      return this.success(
        {
          embeddings: result.data.map((d) => d.embedding),
          model: result.model,
          usage: result.usage,
        },
        startTime
      );
    } catch (error) {
      this.log('error', 'OpenAI embeddings failed', { error });

      logIntegrationUsage({
        integrationId: config?.integrationId,
        integrationType: 'openai',
        action: 'create-embeddings',
        success: false,
        duration: Date.now() - startTime,
      });

      return this.failure(error as Error, startTime);
    }
  }
}
