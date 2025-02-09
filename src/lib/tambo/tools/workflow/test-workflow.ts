/**
 * @file test-workflow.ts
 * @description Tool for testing workflows with sample data
 */

import { z } from "zod";
import type { TamboTool } from "@tambo-ai/react";
import { getApiUrl } from "../../utils";
import { generateSampleDataFromSchema } from "./define-trigger-schema";

/**
 * Generate sample data for testing based on trigger schema
 */
function generateDefaultSampleData(triggerType: string): Record<string, unknown> {
  const samples: Record<string, Record<string, unknown>> = {
    webhook: {
      event: "test",
      data: {
        name: "Test User",
        email: "test@example.com",
        amount: 100,
        message: "This is a test",
      },
      timestamp: new Date().toISOString(),
    },
    form: {
      name: "Test Submission",
      email: "form@example.com",
      phone: "+1234567890",
      message: "Test form submission",
      submittedAt: new Date().toISOString(),
    },
    schedule: {
      scheduledTime: new Date().toISOString(),
      runCount: 1,
    },
    manual: {
      triggeredBy: "test",
      triggeredAt: new Date().toISOString(),
    },
  };

  return samples[triggerType] || samples.webhook;
}

/**
 * Test Workflow Tool
 */
export const testWorkflowTool: TamboTool = {
  name: "testWorkflow",
  description: `Test a workflow with sample data before going live.

Use this to:
- Verify a workflow works correctly
- See step-by-step execution results
- Identify configuration issues
- Debug workflows

Returns detailed results for each step including input/output data.`,

  tool: async (input: {
    workflowId: string;
    sampleDataJson?: string;
    triggerSchema?: Array<{ name: string; type: string; exampleJson?: string }>;
    dryRun?: boolean;
  }) => {
    const { workflowId, sampleDataJson, triggerSchema, dryRun = false } = input;

    try {
      // Generate sample data if not provided
      let testData: Record<string, unknown> | undefined = sampleDataJson ? JSON.parse(sampleDataJson) : undefined;
      if (!testData && triggerSchema) {
        testData = {};
        for (const field of triggerSchema) {
          const example = field.exampleJson ? JSON.parse(field.exampleJson) : undefined;
          testData[field.name] = example ?? getDefaultForType(field.type);
        }
      }
      if (!testData) {
        testData = generateDefaultSampleData("webhook");
      }

      // Execute the workflow
      const response = await fetch(getApiUrl(`/api/workflows/${workflowId}/execute`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          triggerData: testData,
          testMode: true,
          dryRun,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || "Failed to execute workflow",
          workflowId,
          testDataJson: testData ? JSON.stringify(testData) : undefined,
          steps: [],
        };
      }

      // Format the results
      const steps = (result.steps || []).map((step: any, index: number) => ({
        stepNumber: index + 1,
        nodeId: step.nodeId,
        nodeName: step.name || step.nodeId,
        nodeType: step.type,
        status: step.status,
        duration: step.duration,
        input: step.inputSummary || summarizeData(step.input),
        output: step.outputSummary || summarizeData(step.output),
        error: step.error,
        skipped: step.status === "skipped",
        branch: step.branch,
      }));

      const successCount = steps.filter((s: any) => s.status === "completed").length;
      const failedCount = steps.filter((s: any) => s.status === "failed").length;
      const skippedCount = steps.filter((s: any) => s.status === "skipped").length;

      return {
        success: failedCount === 0,
        workflowId,
        executionId: result.executionId,
        testDataJson: JSON.stringify(testData),
        dryRun,
        summary: {
          totalSteps: steps.length,
          completed: successCount,
          failed: failedCount,
          skipped: skippedCount,
          duration: result.duration || steps.reduce((sum: number, s: any) => sum + (s.duration || 0), 0),
        },
        steps,
        overallStatus: failedCount > 0 ? "failed" : "completed",
        message: failedCount > 0
          ? `Test failed: ${failedCount} step(s) had errors`
          : `Test passed! All ${successCount} steps completed successfully`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Test execution failed",
        workflowId,
        testDataJson: sampleDataJson,
        steps: [],
      };
    }
  },

  inputSchema: z.object({
    workflowId: z.string().describe("ID of the workflow to test"),
    sampleDataJson: z.string().optional().describe("Sample trigger data for testing as JSON string"),
    triggerSchema: z.array(z.object({
      name: z.string(),
      type: z.string(),
      exampleJson: z.string().optional().describe("Example value as JSON string"),
    })).optional().describe("Trigger schema to generate sample data from"),
    dryRun: z.boolean().optional().describe("If true, simulate execution without actually calling external services"),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    workflowId: z.string(),
    executionId: z.string().optional(),
    testDataJson: z.string().optional().describe("Test data as JSON string"),
    dryRun: z.boolean().optional(),
    summary: z.object({
      totalSteps: z.number(),
      completed: z.number(),
      failed: z.number(),
      skipped: z.number(),
      duration: z.number(),
    }).optional(),
    steps: z.array(z.object({
      stepNumber: z.number(),
      nodeId: z.string(),
      nodeName: z.string(),
      nodeType: z.string(),
      status: z.string(),
      duration: z.number().optional(),
      input: z.string().optional(),
      output: z.string().optional(),
      error: z.string().optional(),
      skipped: z.boolean(),
      branch: z.string().optional(),
    })),
    overallStatus: z.string().optional(),
    message: z.string().optional(),
    error: z.string().optional(),
  }),
};

/**
 * Get default value for a type
 */
function getDefaultForType(type: string): unknown {
  switch (type) {
    case "string":
      return "test_value";
    case "number":
      return 100;
    case "boolean":
      return true;
    case "email":
      return "test@example.com";
    case "url":
      return "https://example.com";
    case "phone":
      return "+1234567890";
    case "date":
      return new Date().toISOString();
    case "object":
      return {};
    case "array":
      return [];
    default:
      return "test";
  }
}

/**
 * Summarize data for display
 */
function summarizeData(data: unknown): string {
  if (data === undefined || data === null) return "—";
  if (typeof data === "string") return data.length > 100 ? data.substring(0, 100) + "..." : data;
  if (typeof data === "number" || typeof data === "boolean") return String(data);
  if (Array.isArray(data)) return `[Array of ${data.length} items]`;
  if (typeof data === "object") {
    const keys = Object.keys(data);
    return `{${keys.slice(0, 3).join(", ")}${keys.length > 3 ? ", ..." : ""}}`;
  }
  return String(data);
}

/**
 * Generate test data preview
 */
export const generateTestDataTool: TamboTool = {
  name: "generateTestData",
  description: `Generate sample test data for a workflow based on its trigger schema.

Use this to:
- Create realistic test data
- Preview what data will be available in the workflow
- Help users understand the data flow`,

  tool: async (input: {
    triggerType: string;
    schema?: Array<{ name: string; type: string; exampleJson?: string }>;
    customFieldsJson?: string;
  }) => {
    const { triggerType, schema, customFieldsJson } = input;

    let sampleData: Record<string, unknown>;

    if (schema && schema.length > 0) {
      sampleData = {};
      for (const field of schema) {
        const example = field.exampleJson ? JSON.parse(field.exampleJson) : undefined;
        sampleData[field.name] = example ?? getDefaultForType(field.type);
      }
    } else {
      sampleData = generateDefaultSampleData(triggerType);
    }

    // Merge custom fields
    if (customFieldsJson) {
      const customFields = JSON.parse(customFieldsJson) as Record<string, unknown>;
      sampleData = { ...sampleData, ...customFields };
    }

    // Generate variable paths
    const variablePaths = Object.entries(sampleData).map(([key, value]) => ({
      path: `$trigger.data.${key}`,
      valueJson: JSON.stringify(value),
      type: Array.isArray(value) ? "array" : typeof value,
    }));

    return {
      success: true,
      triggerType,
      sampleDataJson: JSON.stringify(sampleData),
      variablePaths,
      jsonPreview: JSON.stringify(sampleData, null, 2),
    };
  },

  inputSchema: z.object({
    triggerType: z.string().describe("Type of trigger (webhook, form, schedule, manual)"),
    schema: z.array(z.object({
      name: z.string(),
      type: z.string(),
      exampleJson: z.string().optional().describe("Example value as JSON string"),
    })).optional(),
    customFieldsJson: z.string().optional().describe("Custom fields as JSON string"),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    triggerType: z.string(),
    sampleDataJson: z.string().describe("Sample data as JSON string"),
    variablePaths: z.array(z.object({
      path: z.string(),
      valueJson: z.string().describe("Value as JSON string"),
      type: z.string(),
    })),
    jsonPreview: z.string(),
  }),
};
