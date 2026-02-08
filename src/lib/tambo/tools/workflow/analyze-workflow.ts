import { z } from "zod";
import type { TamboTool } from "@tambo-ai/react";
import { getApiUrl } from "../../utils";

export const analyzeWorkflowTool: TamboTool = {
  name: "analyzeWorkflow",
  description: `Analyze a workflow and provide suggestions for improvements.
Use this when the user wants to:
- Get suggestions for improving a workflow
- Identify potential issues
- Optimize workflow performance
- Add error handling or retry logic`,
  tool: async (input: { workflowId: string }) => {
    try {
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

      const workflow = data.workflow;
      const suggestions: string[] = [];

      // Analyze nodes
      const nodes = workflow.nodes || [];
      const edges = workflow.edges || [];

      // Check for missing error handling
      const actionNodes = nodes.filter((n: any) => n.type === "action");
      if (actionNodes.length > 0 && !nodes.some((n: any) => n.label?.toLowerCase().includes("error"))) {
        suggestions.push("Add error handling nodes after action steps to handle failures gracefully");
      }

      // Check for missing notifications
      if (!nodes.some((n: any) => n.type === "action" && (n.label?.toLowerCase().includes("notify") || n.label?.toLowerCase().includes("notification")))) {
        suggestions.push("Consider adding notification actions to alert users of workflow completion or failures");
      }

      // Check for long chains without conditions
      if (nodes.length > 5 && !nodes.some((n: any) => n.type === "condition")) {
        suggestions.push("Add condition nodes to create branching logic for different scenarios");
      }

      // Check for missing delays between actions
      const consecutiveActions = actionNodes.length > 2 && !nodes.some((n: any) => n.type === "delay");
      if (consecutiveActions) {
        suggestions.push("Consider adding delay nodes between actions to prevent rate limiting");
      }

      return {
        success: true,
        workflowId: workflow.id,
        name: workflow.name,
        nodeCount: nodes.length,
        edgeCount: edges.length,
        suggestions,
        analysis: {
          hasTrigger: nodes.some((n: any) => n.type === "trigger"),
          hasConditions: nodes.some((n: any) => n.type === "condition"),
          hasLoops: nodes.some((n: any) => n.type === "loop"),
          hasDelays: nodes.some((n: any) => n.type === "delay"),
          actionCount: actionNodes.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to analyze workflow",
      };
    }
  },
  inputSchema: z.object({
    workflowId: z.string().describe("ID of the workflow to analyze"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    workflowId: z.string().optional(),
    name: z.string().optional(),
    nodeCount: z.number().optional(),
    edgeCount: z.number().optional(),
    suggestions: z.array(z.string()).optional(),
    analysis: z.object({
      hasTrigger: z.boolean(),
      hasConditions: z.boolean(),
      hasLoops: z.boolean(),
      hasDelays: z.boolean(),
      actionCount: z.number(),
    }).optional(),
    error: z.string().optional(),
  }),
};
