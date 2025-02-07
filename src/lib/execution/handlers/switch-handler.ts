/**
 * @file switch-handler.ts
 * @description Handler for switch/case nodes - routes to different branches based on value
 */

import { BaseNodeHandler } from './base-handler';
import type { ExecutionContext, NodeExecutionResult } from '../types';
import type { WorkflowNodeData } from '@/components/flow-editor/types';

/**
 * Switch handler - routes execution based on a value matching cases
 */
export class SwitchHandler extends BaseNodeHandler {
  protected nodeType = 'switch';

  async execute(
    node: WorkflowNodeData,
    context: ExecutionContext,
    config?: Record<string, unknown>
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const nodeConfig = config || this.getNodeConfig(node);
      const resolvedConfig = this.resolveConfig(nodeConfig, context);

      // Get the value to switch on
      const switchValue = resolvedConfig.switchValue;
      const cases = (resolvedConfig.cases as Array<{ value: string; label: string }>) || [];
      const defaultLabel = (resolvedConfig.defaultLabel as string) || 'default';

      this.log('info', 'Executing switch', {
        nodeId: node.id,
        switchValue,
        caseCount: cases.length,
      });

      // Find matching case
      let matchedCase: { value: string; label: string } | null = null;
      let matchedIndex = -1;

      for (let i = 0; i < cases.length; i++) {
        const caseItem = cases[i];
        if (this.matchesCase(switchValue, caseItem.value)) {
          matchedCase = caseItem;
          matchedIndex = i;
          break;
        }
      }

      const output = matchedCase
        ? {
            matched: true,
            matchedValue: matchedCase.value,
            matchedLabel: matchedCase.label,
            matchedIndex,
            outputBranch: matchedCase.label,
            switchValue,
          }
        : {
            matched: false,
            matchedValue: null,
            matchedLabel: defaultLabel,
            matchedIndex: -1,
            outputBranch: defaultLabel,
            switchValue,
          };

      this.log('info', 'Switch complete', {
        matched: output.matched,
        branch: output.outputBranch,
      });

      return this.success(output, startTime);
    } catch (error) {
      this.log('error', 'Switch failed', { error });
      return this.failure(error as Error, startTime);
    }
  }

  /**
   * Check if a value matches a case
   * Supports exact match, numeric match, and basic wildcards
   */
  private matchesCase(value: unknown, caseValue: string): boolean {
    const valueStr = String(value);
    const caseStr = String(caseValue);

    // Exact string match
    if (valueStr === caseStr) {
      return true;
    }

    // Numeric match (handles "1" === 1)
    if (!isNaN(Number(value)) && !isNaN(Number(caseValue))) {
      if (Number(value) === Number(caseValue)) {
        return true;
      }
    }

    // Case-insensitive match
    if (valueStr.toLowerCase() === caseStr.toLowerCase()) {
      return true;
    }

    // Wildcard match (basic glob-style)
    if (caseStr.includes('*')) {
      const regexPattern = caseStr
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*');
      const regex = new RegExp(`^${regexPattern}$`, 'i');
      return regex.test(valueStr);
    }

    // Range match (e.g., "1-10")
    if (caseStr.includes('-') && !isNaN(Number(value))) {
      const [min, max] = caseStr.split('-').map(Number);
      const numValue = Number(value);
      if (!isNaN(min) && !isNaN(max) && numValue >= min && numValue <= max) {
        return true;
      }
    }

    return false;
  }
}
