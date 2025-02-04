/**
 * @file http-handler.ts
 * @description HTTP/Webhook node handler
 */

import { BaseNodeHandler } from './base-handler';
import type { NodeExecutionResult, ExecutionContext } from '../types';
import type { WorkflowNodeData } from '@/components/flow-editor/types';

/**
 * HTTP Request Handler
 */
export class HttpRequestHandler extends BaseNodeHandler {
  protected nodeType = 'http:request';

  async execute(
    node: WorkflowNodeData,
    context: ExecutionContext,
    config?: any
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const resolvedConfig = this.resolveConfig(config || ((node as any).data).config, context);

      const {
        url,
        method = 'GET',
        headers = {},
        body,
        timeout = 30000,
      } = resolvedConfig;

      if (!url) {
        throw new Error('URL is required');
      }

      // Make HTTP request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const contentType = response.headers.get('content-type');
        let responseData;

        if (contentType?.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }

        return this.success(
          {
            statusCode: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            body: responseData,
            success: response.ok,
          },
          startTime
        );
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error(`Request timeout after ${timeout}ms`);
        }

        throw error;
      }
    } catch (error) {
      this.log('error', 'HTTP request failed', { error });
      return this.failure(error as Error, startTime);
    }
  }
}
