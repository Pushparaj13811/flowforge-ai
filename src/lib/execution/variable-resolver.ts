/**
 * @file variable-resolver.ts
 * @description Resolve variables and data references in workflow execution
 *
 * Supports syntax like:
 * - {{$trigger.data.userId}} - Trigger data
 * - {{$node.slack-1.output.messageId}} - Previous node output (by ID)
 * - {{$steps.send_email.output.data}} - Previous node output (by label slug)
 * - {{$var.apiKey}} - Global variable
 * - {{$env.API_URL}} - Environment variable
 * - {{$workflow.id}} - Workflow metadata
 */

import type { ExecutionContext } from './types';
import { workflowLogger } from '../monitoring/logger';

/**
 * Convert a node label to a slug for variable resolution
 */
export function labelToSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 20);
}

export class VariableResolver {
  /**
   * Resolve a template string with variables
   *
   * Supports both double and triple brace syntax:
   * - {{$trigger.name}} - Standard syntax
   * - {{{$trigger.name}}} - Mustache unescaped syntax (used by some UI components)
   *
   * @example
   * resolveString("Hello {{$trigger.name}}", context)
   * // Returns: "Hello John"
   */
  resolveString(template: string, context: ExecutionContext): string {
    if (!template || typeof template !== 'string') {
      return template;
    }

    // First handle triple braces {{{...}}} (Mustache unescaped syntax)
    // Match exactly 3 opening braces, content without braces, and 3 closing braces
    let result = template.replace(/\{\{\{([^{}]+)\}\}\}/g, (match, path) => {
      try {
        const value = this.resolveVariable(path.trim(), context);
        return value !== undefined ? String(value) : match;
      } catch (error) {
        workflowLogger.warn(
          { path, error: error instanceof Error ? error.message : error },
          'Failed to resolve variable (triple brace), using original'
        );
        return match;
      }
    });

    // Then handle double braces {{...}}
    // Match exactly 2 opening braces, content without braces, and 2 closing braces
    result = result.replace(/\{\{([^{}]+)\}\}/g, (match, path) => {
      try {
        const value = this.resolveVariable(path.trim(), context);
        return value !== undefined ? String(value) : match;
      } catch (error) {
        workflowLogger.warn(
          { path, error },
          'Failed to resolve variable, using original'
        );
        return match;
      }
    });

    return result;
  }

  /**
   * Resolve any value (string, object, array) with variables
   */
  resolveValue(value: any, context: ExecutionContext): any {
    if (typeof value === 'string') {
      return this.resolveString(value, context);
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.resolveValue(item, context));
    }

    if (value && typeof value === 'object') {
      const resolved: any = {};
      for (const [key, val] of Object.entries(value)) {
        resolved[key] = this.resolveValue(val, context);
      }
      workflowLogger.debug({ original: value, resolved }, 'resolveValue: object resolved');
      return resolved;
    }

    return value;
  }

  /**
   * Resolve a variable path to its value
   *
   * @example
   * resolveVariable("$trigger.data.userId", context)
   * resolveVariable("$node.slack-1.output.messageId", context)
   * resolveVariable("$steps.send_email.output.data", context)
   * resolveVariable("$var.apiKey", context)
   */
  resolveVariable(path: string, context: ExecutionContext): any {
    const parts = path.split('.');
    const scope = parts[0];

    switch (scope) {
      case '$trigger':
        return this.getNestedValue(context.triggerData, parts.slice(1));

      case '$node': {
        const nodeId = parts[1];
        if (!nodeId) {
          throw new Error('Node ID required for $node reference');
        }

        const nodeResult = context.results[nodeId];
        if (!nodeResult) {
          throw new Error(`Node result not found: ${nodeId}`);
        }

        // $node.id → entire result
        // $node.id.output → just the output
        // $node.id.output.field → nested field in output
        if (parts.length === 2) {
          return nodeResult;
        }

        if (parts[2] === 'output') {
          return this.getNestedValue(nodeResult.output, parts.slice(3));
        }

        // Direct property access
        return this.getNestedValue(nodeResult, parts.slice(2));
      }

      // $steps uses node label slugs for user-friendly access
      case '$steps': {
        const labelSlug = parts[1];
        if (!labelSlug) {
          throw new Error('Node label required for $steps reference');
        }

        // Look up node result by label slug
        const nodeResult = context.stepsByLabel?.[labelSlug];
        if (!nodeResult) {
          // Fall back to trying to match by iterating results
          const matchingResult = Object.entries(context.results).find(([, result]) => {
            const resultLabel = (result as any)?.nodeLabel;
            return resultLabel && labelToSlug(resultLabel) === labelSlug;
          });

          if (matchingResult) {
            const result = matchingResult[1];
            if (parts.length === 2) return result;
            if (parts[2] === 'output') {
              return this.getNestedValue(result.output, parts.slice(3));
            }
            if (parts[2] === 'success') {
              return result.success;
            }
            return this.getNestedValue(result, parts.slice(2));
          }

          throw new Error(`Step not found: ${labelSlug}`);
        }

        // $steps.label → entire result
        // $steps.label.output → just the output
        // $steps.label.output.field → nested field in output
        // $steps.label.success → whether it succeeded
        if (parts.length === 2) {
          return nodeResult;
        }

        if (parts[2] === 'output') {
          return this.getNestedValue(nodeResult.output, parts.slice(3));
        }

        if (parts[2] === 'success') {
          return nodeResult.success;
        }

        // Direct property access
        return this.getNestedValue(nodeResult, parts.slice(2));
      }

      case '$var':
        return this.getNestedValue(context.variables, parts.slice(1));

      case '$env':
        return this.getNestedValue(process.env, parts.slice(1));

      case '$workflow':
        return this.getWorkflowMetadata(parts.slice(1), context);

      default:
        throw new Error(`Unknown variable scope: ${scope}`);
    }
  }

  /**
   * Get a nested value from an object using a path array
   *
   * @example
   * getNestedValue({ user: { name: "John" } }, ["user", "name"])
   * // Returns: "John"
   */
  private getNestedValue(obj: any, path: string[]): any {
    if (!obj) return undefined;

    let current = obj;
    for (const key of path) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[key];
    }
    return current;
  }

  /**
   * Get workflow metadata
   */
  private getWorkflowMetadata(path: string[], context: ExecutionContext): any {
    const field = path[0];

    switch (field) {
      case 'id':
        return context.workflowId;
      case 'executionId':
        return context.executionId;
      case 'userId':
        return context.userId;
      case 'currentStep':
        return context.currentStep;
      default:
        return undefined;
    }
  }

  /**
   * Validate if a string contains variables (supports both {{...}} and {{{...}}})
   */
  hasVariables(template: string): boolean {
    return /\{\{\{?[^}]+\}\}\}?/.test(template);
  }

  /**
   * Extract all variable paths from a template
   * Supports both {{...}} and {{{...}}} syntax
   *
   * @example
   * extractVariables("Hello {{$trigger.name}}, your order is {{{$node.order.output.id}}}")
   * // Returns: ["$trigger.name", "$node.order.output.id"]
   */
  extractVariables(template: string): string[] {
    // Match both triple and double brace syntax
    const tripleMatches = template.matchAll(/\{\{\{([^}]+)\}\}\}/g);
    const doubleMatches = template.matchAll(/\{\{([^}]+)\}\}/g);

    const variables = new Set<string>();
    for (const match of tripleMatches) {
      variables.add(match[1].trim());
    }
    for (const match of doubleMatches) {
      variables.add(match[1].trim());
    }

    return Array.from(variables);
  }

  /**
   * Validate if all required variables are available
   */
  validateVariables(template: string, context: ExecutionContext): {
    valid: boolean;
    missing: string[];
  } {
    const variables = this.extractVariables(template);
    const missing: string[] = [];

    for (const variable of variables) {
      try {
        const value = this.resolveVariable(variable, context);
        if (value === undefined) {
          missing.push(variable);
        }
      } catch (error) {
        missing.push(variable);
      }
    }

    return {
      valid: missing.length === 0,
      missing,
    };
  }
}

/**
 * Singleton resolver instance
 */
let resolverInstance: VariableResolver | null = null;

export function getResolver(): VariableResolver {
  if (!resolverInstance) {
    resolverInstance = new VariableResolver();
  }
  return resolverInstance;
}

/**
 * Convenience function for resolving strings
 */
export function resolveString(template: string, context: ExecutionContext): string {
  return getResolver().resolveString(template, context);
}

/**
 * Convenience function for resolving values
 */
export function resolveValue(value: any, context: ExecutionContext): any {
  return getResolver().resolveValue(value, context);
}
