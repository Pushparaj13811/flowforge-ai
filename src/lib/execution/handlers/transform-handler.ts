/**
 * @file transform-handler.ts
 * @description Handler for transform/data manipulation nodes
 */

import { BaseNodeHandler } from './base-handler';
import type { ExecutionContext, NodeExecutionResult } from '../types';
import type { WorkflowNodeData } from '@/components/flow-editor/types';

/**
 * Transform handler - transforms data using various operations
 */
export class TransformHandler extends BaseNodeHandler {
  protected nodeType = 'transform';

  async execute(
    node: WorkflowNodeData,
    context: ExecutionContext,
    config?: Record<string, unknown>
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const nodeConfig = config || this.getNodeConfig(node);
      const resolvedConfig = this.resolveConfig(nodeConfig, context);

      const transformType = (resolvedConfig.transformType as string) || 'extract';
      let inputData = resolvedConfig.input;

      // Parse input if it's a string
      if (typeof inputData === 'string') {
        try {
          inputData = JSON.parse(inputData);
        } catch {
          // Keep as string if not valid JSON
        }
      }

      this.log('info', 'Executing transform', {
        nodeId: node.id,
        transformType,
      });

      let result: unknown;

      switch (transformType) {
        case 'extract':
          result = this.extractFields(inputData, resolvedConfig.fields as string);
          break;

        case 'map':
          result = this.mapFields(inputData, resolvedConfig.mapping as string);
          break;

        case 'merge':
          result = this.mergeObjects(inputData, resolvedConfig.mergeWith);
          break;

        case 'template':
          result = this.applyTemplate(resolvedConfig.template as string, context);
          break;

        case 'json':
          result = this.handleJson(inputData, resolvedConfig.jsonOperation as string);
          break;

        default:
          result = inputData;
      }

      return this.success(
        {
          data: result,
          transformType,
        },
        startTime
      );
    } catch (error) {
      this.log('error', 'Transform failed', { error });
      return this.failure(error as Error, startTime);
    }
  }

  /**
   * Extract specific fields from an object
   */
  private extractFields(data: unknown, fieldsStr: string): unknown {
    if (!fieldsStr || typeof data !== 'object' || data === null) {
      return data;
    }

    const fields = fieldsStr.split(',').map((f) => f.trim());
    const result: Record<string, unknown> = {};

    for (const field of fields) {
      if (field) {
        result[field] = this.getNestedValue(data, field);
      }
    }

    return result;
  }

  /**
   * Map/rename fields in an object
   */
  private mapFields(data: unknown, mappingStr: string): unknown {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    let mapping: Record<string, string>;
    try {
      mapping = typeof mappingStr === 'string' ? JSON.parse(mappingStr) : mappingStr;
    } catch {
      return data;
    }

    const result: Record<string, unknown> = {};
    const dataObj = data as Record<string, unknown>;

    // Copy all existing fields
    for (const key of Object.keys(dataObj)) {
      result[key] = dataObj[key];
    }

    // Apply mapping (rename fields)
    for (const [oldKey, newKey] of Object.entries(mapping)) {
      if (oldKey in dataObj) {
        result[newKey] = dataObj[oldKey];
        if (oldKey !== newKey) {
          delete result[oldKey];
        }
      }
    }

    return result;
  }

  /**
   * Merge multiple objects
   */
  private mergeObjects(data: unknown, mergeWith: unknown): unknown {
    if (typeof data !== 'object' || data === null) {
      return mergeWith || data;
    }

    let mergeData = mergeWith;
    if (typeof mergeData === 'string') {
      try {
        mergeData = JSON.parse(mergeData);
      } catch {
        mergeData = {};
      }
    }

    if (typeof mergeData !== 'object' || mergeData === null) {
      return data;
    }

    return { ...data, ...mergeData };
  }

  /**
   * Apply a string template with variable substitution
   */
  private applyTemplate(template: string, context: ExecutionContext): string {
    if (!template) {
      return '';
    }

    // The template should already be resolved by the resolveConfig call
    // This is just for any additional processing
    return template;
  }

  /**
   * Handle JSON parse/stringify operations
   */
  private handleJson(data: unknown, operation: string): unknown {
    switch (operation) {
      case 'parse':
        if (typeof data === 'string') {
          try {
            return JSON.parse(data);
          } catch {
            throw new Error('Invalid JSON string');
          }
        }
        return data;

      case 'stringify':
        return JSON.stringify(data);

      case 'pretty':
        return JSON.stringify(data, null, 2);

      default:
        return data;
    }
  }

  /**
   * Get a nested value from an object using dot notation
   */
  private getNestedValue(obj: unknown, path: string): unknown {
    if (!path || typeof obj !== 'object' || obj === null) {
      return undefined;
    }

    const keys = path.split('.');
    let current: unknown = obj;

    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      if (typeof current === 'object') {
        current = (current as Record<string, unknown>)[key];
      } else {
        return undefined;
      }
    }

    return current;
  }
}
