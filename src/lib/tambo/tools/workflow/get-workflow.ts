import { z } from "zod";
import type { TamboTool } from "@tambo-ai/react";
import { getApiUrl } from "../../utils";
import { workflowCanvasSchema } from "../../schemas";

export const getCurrentWorkflowTool: TamboTool = {
  name: "getCurrentWorkflow",
  description: `Get the current workflow state from the canvas.
Use this when you need to:
- See the current workflow before making updates
- Check what nodes already exist
- Read the current workflow structure before adding/modifying

This returns the workflow currently displayed in the canvas.`,
  tool: async (input: { workflowId?: string }) => {
    try {
      // If workflowId provided, fetch from API
      if (input.workflowId) {
        const response = await fetch(getApiUrl(`/api/workflows/${input.workflowId}`), {
          credentials: "include",
        });
        const data = await response.json();

        if (!response.ok) {
          return {
            success: false,
            error: data.error || "Failed to fetch workflow",
          };
        }

        return {
          success: true,
          workflow: {
            workflowId: data.workflow.id,
            name: data.workflow.name,
            description: data.workflow.description,
            nodes: data.workflow.nodes,
            edges: data.workflow.edges,
            status: data.workflow.status,
          },
        };
      }

      // Otherwise return empty - the context holds the current state
      return {
        success: false,
        error: "No workflowId provided and no way to access canvas context from tool",
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to fetch workflow",
      };
    }
  },
  inputSchema: z.object({
    workflowId: z.string().optional().describe("ID of the workflow to fetch"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    workflow: workflowCanvasSchema.optional(),
    error: z.string().optional(),
  }),
};
