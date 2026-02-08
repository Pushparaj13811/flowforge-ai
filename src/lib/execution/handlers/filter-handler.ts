/**
 * @file filter-handler.ts
 * @description Handler for filter nodes - filters array items based on conditions
 */

import { BaseNodeHandler } from './base-handler';
import type { ExecutionContext, NodeExecutionResult } from '../types';
import type { WorkflowNodeData } from '@/components/flow-editor/types';

/**
 * Filter handler - filters array items based on a condition
 */
export class FilterHandler extends BaseNodeHandler {
  protected nodeType = 'filter';

  async execute(
    node: WorkflowNodeData,
    context: ExecutionContext,
    config?: Record<string, unknown>
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const nodeConfig = config || this.getNodeConfig(node);
      const resolvedConfig = this.resolveConfig(nodeConfig, context);

      // Get the array to filter
      let arrayData = resolvedConfig.array;

      // If array is a string (variable reference or JSON), try to parse it
      if (typeof arrayData === 'string') {
        try {
          arrayData = JSON.parse(arrayData);
        } catch {
          return this.failure('Invalid array data - could not parse', startTime);
        }
      }

      if (!Array.isArray(arrayData)) {
        return this.failure('Input is not an array', startTime);
      }

      const field = resolvedConfig.field as string;
      const operator = (resolvedConfig.operator as string) || 'eq';
      const filterValue = resolvedConfig.filterValue;

      this.log('info', 'Executing filter', {
        nodeId: node.id,
        inputCount: arrayData.length,
        field,
        operator,
        filterValue,
      });

      // Filter the array
      const filteredItems = arrayData.filter((item) => {
        // Get the field value from the item
        const itemValue = this.getNestedValue(item, field);

        // Apply the comparison
        return this.compare(itemValue, operator, filterValue);
      });

      this.log('info', 'Filter complete', {
        inputCount: arrayData.length,
        outputCount: filteredItems.length,
      });

      return this.success(
        {
          items: filteredItems,
          count: filteredItems.length,
          originalCount: arrayData.length,
          filtered: arrayData.length - filteredItems.length,
        },
        startTime
      );
    } catch (error) {
      this.log('error', 'Filter failed', { error });
      return this.failure(error as Error, startTime);
    }
  }

  /**
   * Get a nested value from an object using dot notation
   */
  private getNestedValue(obj: unknown, path: string): unknown {
    if (!path || typeof obj !== 'object' || obj === null) {
      return obj;
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

  /**
   * Compare two values using the specified operator
   */
  private compare(value: unknown, operator: string, compareValue: unknown): boolean {
    switch (operator) {
      case 'eq':
        return value === compareValue || String(value) === String(compareValue);

      case 'ne':
        return value !== compareValue && String(value) !== String(compareValue);

      case 'gt':
        return Number(value) > Number(compareValue);

      case 'gte':
        return Number(value) >= Number(compareValue);

      case 'lt':
        return Number(value) < Number(compareValue);

      case 'lte':
        return Number(value) <= Number(compareValue);

      case 'contains':
        return String(value).toLowerCase().includes(String(compareValue).toLowerCase());

      case 'exists':
        return value !== null && value !== undefined;

      case 'notExists':
        return value === null || value === undefined;

      case 'startsWith':
        return String(value).toLowerCase().startsWith(String(compareValue).toLowerCase());

      case 'endsWith':
        return String(value).toLowerCase().endsWith(String(compareValue).toLowerCase());

      case 'regex':
        try {
          const regex = new RegExp(String(compareValue));
          return regex.test(String(value));
        } catch {
          return false;
        }

      default:
        return value === compareValue;
    }
  }
}
