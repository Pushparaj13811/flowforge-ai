import { z } from "zod";
import type { TamboTool } from "@tambo-ai/react";
import { getApiUrl } from "../../utils";
import { executionStepSchema } from "../../schemas";

export const executeWorkflowTool: TamboTool = {
  name: "executeWorkflow",
  description: `Execute a workflow and return execution results.
Use this when the user wants to:
- Run a workflow
- Test a workflow
- Execute an automation

Returns an execution timeline showing step-by-step progress.`,
  tool: async (input: { workflowId: string; testDataJson?: string }) => {
    try {
      const response = await fetch(getApiUrl("/api/executions"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          workflowId: input.workflowId,
          testDataJson: input.testDataJson,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || "Failed to execute workflow",
        };
      }

      return {
        success: true,
        executionId: data.execution.id,
        workflowName: data.execution.workflowName,
        status: data.execution.status,
        startedAt: data.execution.startedAt,
        completedAt: data.execution.completedAt,
        totalDuration: data.execution.duration,
        steps: data.execution.steps?.map((step: any) => ({
          id: step.id,
          nodeId: step.nodeId,
          name: step.name,
          type: step.type,
          status: step.status,
          duration: step.duration,
          startedAt: step.startedAt,
          completedAt: step.completedAt,
          inputSummary: step.inputSummary,
          outputSummary: step.outputSummary,
          error: step.error,
        })) || [],
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to connect to server",
      };
    }
  },
  inputSchema: z.object({
    workflowId: z.string().describe("ID of the workflow to execute"),
    testDataJson: z.string().optional().describe("JSON string of test data for the execution"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    executionId: z.string().optional(),
    workflowName: z.string().optional(),
    status: z.enum(["pending", "running", "completed", "failed"]).optional(),
    startedAt: z.string().optional(),
    completedAt: z.string().optional(),
    totalDuration: z.number().optional(),
    steps: z.array(executionStepSchema).optional(),
    error: z.string().optional(),
  }),
};
