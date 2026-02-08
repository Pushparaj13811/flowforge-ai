/**
 * @file condition-handler.ts
 * @description Condition/branching node handler
 */

import { BaseNodeHandler } from './base-handler';
import type { NodeExecutionResult, ExecutionContext } from '../types';
import type { WorkflowNodeData } from '@/components/flow-editor/types';

/**
 * Condition Handler
 * Evaluates conditions and returns branch to take
 */
export class ConditionHandler extends BaseNodeHandler {
  protected nodeType = 'condition';

  async execute(
    node: WorkflowNodeData,
    context: ExecutionContext,
    config?: any
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const resolvedConfig = this.resolveConfig(config || ((node as any).data).config, context);

      // Support both naming conventions:
      // - left/operator/right (programmatic)
      // - field/operator/value (UI form)
      const left = resolvedConfig.left ?? resolvedConfig.field;
      const operator = resolvedConfig.operator;
      const right = resolvedConfig.right ?? resolvedConfig.value;

      this.log('info', 'Evaluating condition', {
        left,
        operator,
        right,
        originalField: resolvedConfig.field,
        originalValue: resolvedConfig.value,
      });

      if (left === undefined) {
        throw new Error('Left value is required');
      }

      if (!operator) {
        throw new Error('Operator is required');
      }

      // Evaluate condition
      const result = this.evaluateCondition(left, operator, right);

      return this.success(
        {
          result,
          branch: result ? 'yes' : 'no',
          left,
          operator,
          right,
        },
        startTime
      );
    } catch (error) {
      this.log('error', 'Condition evaluation failed', { error });
      return this.failure(error as Error, startTime);
    }
  }

  /**
   * Evaluate a condition
   */
  private evaluateCondition(left: any, operator: string, right: any): boolean {
    switch (operator) {
      case 'equals':
      case '==':
      case '===':
        return left === right;

      case 'not_equals':
      case '!=':
      case '!==':
        return left !== right;

      case 'greater_than':
      case '>':
        return left > right;

      case 'less_than':
      case '<':
        return left < right;

      case 'greater_than_or_equal':
      case '>=':
        return left >= right;

      case 'less_than_or_equal':
      case '<=':
        return left <= right;

      case 'contains':
        return String(left).includes(String(right));

      case 'not_contains':
        return !String(left).includes(String(right));

      case 'starts_with':
        return String(left).startsWith(String(right));

      case 'ends_with':
        return String(left).endsWith(String(right));

      case 'is_empty':
        return !left || (Array.isArray(left) && left.length === 0) || (typeof left === 'object' && Object.keys(left).length === 0);

      case 'is_not_empty':
        return !!left && (!Array.isArray(left) || left.length > 0) && (typeof left !== 'object' || Object.keys(left).length > 0);

      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  }
}
