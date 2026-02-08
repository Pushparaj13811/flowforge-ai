import { z } from "zod";
import type { TamboTool } from "@tambo-ai/react";

/**
 * Data Transform Tool
 */
export const transformDataTool: TamboTool = {
  name: "transformData",
  description: `Transform data between different formats.
Use this when a workflow needs to:
- Parse JSON data
- Extract specific fields from a path (e.g., "user.email")
- Map data structures (rename keys)
- Filter arrays by condition
- Format strings with templates

Operations:
- extract: Use 'path' field (e.g., "user.profile.name")
- map: Use 'mappingJson' field (e.g., '{"newName": "oldName"}')
- filter: Use 'filterField', 'filterOperator', 'filterValue' fields
- format: Use 'template' field (e.g., "Hello {{name}}!")`,
  tool: async (input: {
    dataJson: string;
    operation: "extract" | "map" | "filter" | "format";
    path?: string;
    mappingJson?: string;
    filterField?: string;
    filterOperator?: string;
    filterValue?: string;
    template?: string;
  }) => {
    try {
      const data = JSON.parse(input.dataJson);

      switch (input.operation) {
        case "extract": {
          if (!input.path) return { success: false, error: "Path is required for extract operation" };
          const parts = input.path.split(".");
          let result: unknown = data;
          for (const part of parts) {
            if (result && typeof result === "object" && part in result) {
              result = (result as Record<string, unknown>)[part];
            } else {
              return { success: true, resultJson: "null" };
            }
          }
          return { success: true, resultJson: JSON.stringify(result) };
        }

        case "map": {
          if (!input.mappingJson) return { success: false, error: "Mapping JSON is required" };
          const mapping = JSON.parse(input.mappingJson);
          if (!Array.isArray(data)) return { success: false, error: "Data must be an array for map operation" };
          const result = data.map((item: Record<string, unknown>) => {
            const mapped: Record<string, unknown> = {};
            for (const [newKey, oldKey] of Object.entries(mapping)) {
              mapped[newKey] = item[oldKey as string];
            }
            return mapped;
          });
          return { success: true, resultJson: JSON.stringify(result) };
        }

        case "filter": {
          if (!input.filterField || !input.filterOperator) {
            return { success: false, error: "Filter field and operator are required" };
          }
          if (!Array.isArray(data)) return { success: false, error: "Data must be an array for filter operation" };
          const result = data.filter((item: Record<string, unknown>) => {
            const fieldValue = item[input.filterField!];
            const compareValue = input.filterValue;
            switch (input.filterOperator) {
              case "eq": return String(fieldValue) === compareValue;
              case "ne": return String(fieldValue) !== compareValue;
              case "gt": return Number(fieldValue) > Number(compareValue);
              case "lt": return Number(fieldValue) < Number(compareValue);
              case "contains": return String(fieldValue).includes(compareValue || "");
              default: return true;
            }
          });
          return { success: true, resultJson: JSON.stringify(result) };
        }

        case "format": {
          if (!input.template) return { success: false, error: "Template is required" };
          let result = input.template;
          if (data && typeof data === "object") {
            for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
              result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), String(value));
            }
          }
          return { success: true, resultJson: JSON.stringify(result) };
        }

        default:
          return { success: false, error: `Unknown operation: ${input.operation}` };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Transform failed",
      };
    }
  },
  inputSchema: z.object({
    dataJson: z.string().describe("JSON string of the data to transform"),
    operation: z.enum(["extract", "map", "filter", "format"]).describe("The transformation operation"),
    path: z.string().optional().describe("For extract: dot-separated path (e.g., 'user.email')"),
    mappingJson: z.string().optional().describe("For map: JSON object mapping new keys to old keys"),
    filterField: z.string().optional().describe("For filter: field name to filter on"),
    filterOperator: z.enum(["eq", "ne", "gt", "lt", "contains"]).optional().describe("For filter: comparison operator"),
    filterValue: z.string().optional().describe("For filter: value to compare against"),
    template: z.string().optional().describe("For format: template string with {{key}} placeholders"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    resultJson: z.string().optional(),
    error: z.string().optional(),
  }),
};

/**
 * Delay/Wait Tool
 */
export const delayTool: TamboTool = {
  name: "delay",
  description: `Wait for a specified duration before continuing.
Use this when a workflow needs to:
- Add pauses between actions
- Rate limit API calls
- Wait for external processes
- Schedule delayed actions`,
  tool: async (input: { seconds: number; reason?: string }) => {
    const validated = z.object({
      seconds: z.number().min(0).max(300).describe("Seconds to wait (max 300)"),
      reason: z.string().optional().describe("Reason for the delay"),
    }).parse(input);

    await new Promise((resolve) => setTimeout(resolve, validated.seconds * 1000));

    return {
      success: true,
      waitedSeconds: validated.seconds,
      reason: validated.reason,
    };
  },
  inputSchema: z.object({
    seconds: z.number().min(0).max(300).describe("Seconds to wait (max 300)"),
    reason: z.string().optional().describe("Reason for the delay"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    waitedSeconds: z.number(),
    reason: z.string().optional(),
  }),
};

/**
 * Condition Evaluation Tool
 */
export const evaluateConditionTool: TamboTool = {
  name: "evaluateCondition",
  description: `Evaluate a condition and return the result.
Use this when a workflow needs to:
- Check if data meets criteria
- Make branching decisions
- Validate input data
- Compare values`,
  tool: async (input: {
    leftValue: unknown;
    operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "contains" | "startsWith" | "endsWith" | "matches";
    rightValue: unknown;
  }) => {
    try {
      const { leftValue, operator, rightValue } = input;
      let result: boolean;

      switch (operator) {
        case "eq": result = leftValue === rightValue; break;
        case "ne": result = leftValue !== rightValue; break;
        case "gt": result = (leftValue as number) > (rightValue as number); break;
        case "gte": result = (leftValue as number) >= (rightValue as number); break;
        case "lt": result = (leftValue as number) < (rightValue as number); break;
        case "lte": result = (leftValue as number) <= (rightValue as number); break;
        case "contains": result = String(leftValue).includes(String(rightValue)); break;
        case "startsWith": result = String(leftValue).startsWith(String(rightValue)); break;
        case "endsWith": result = String(leftValue).endsWith(String(rightValue)); break;
        case "matches": result = new RegExp(String(rightValue)).test(String(leftValue)); break;
        default: result = false;
      }

      return { success: true, result, operator };
    } catch (error) {
      return {
        success: false,
        result: false,
        error: error instanceof Error ? error.message : "Condition evaluation failed",
      };
    }
  },
  inputSchema: z.object({
    leftValue: z.any().describe("The left side of the comparison"),
    operator: z.enum(["eq", "ne", "gt", "gte", "lt", "lte", "contains", "startsWith", "endsWith", "matches"])
      .describe("The comparison operator"),
    rightValue: z.any().describe("The right side of the comparison"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    result: z.boolean(),
    operator: z.string().optional(),
    error: z.string().optional(),
  }),
};
