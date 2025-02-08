import { z } from "zod";
import type { TamboTool } from "@tambo-ai/react";
import { getApiUrl } from "../../utils";
import { workflowNodeSchema, workflowEdgeSchema, workflowCanvasSchema } from "../../schemas";

export const updateWorkflowTool: TamboTool = {
  name: "updateWorkflow",
  description: `Update an existing workflow by adding, modifying, or removing nodes and edges.
Use this when the user wants to:
- Add new nodes to an existing workflow
- Modify existing nodes (change label, type, or properties)
- Add or remove connections between nodes
- Improve or optimize a workflow

CRITICAL INSTRUCTIONS FOR UPDATES:
1. Call this tool with updated nodes and edges (can be partial - tool will fetch current state and merge)
2. After the tool returns success, YOU MUST IMMEDIATELY render a WorkflowCanvas component
3. Pass the workflow data from tool response directly to the WorkflowCanvas component
4. DO NOT just describe what changed - ALWAYS render the component visually

REQUIRED WORKFLOW AFTER CALLING THIS TOOL:
Step 1: Call updateWorkflow with the changes
Step 2: Get the workflow object from the response
Step 3: Render: <WorkflowCanvas {...workflow} />
Step 4: Optionally explain what you did in text

WRONG: Calling the tool and just saying "I've added a node" without rendering
RIGHT: Call tool -> Render WorkflowCanvas component -> Brief explanation`,
  tool: async (input: {
    workflowId: string;
    updates: {
      nodes?: z.infer<typeof workflowNodeSchema>[];
      edges?: z.infer<typeof workflowEdgeSchema>[];
      name?: string;
      description?: string;
    };
  }) => {
    try {
      // First, fetch the current workflow to get existing nodes
      const response = await fetch(getApiUrl(`/api/workflows/${input.workflowId}`), {
        credentials: "include",
      });

      let currentWorkflow = null;
      if (response.ok) {
        const data = await response.json();
        currentWorkflow = data.workflow;
      }

      // If no current workflow, treat updates as complete state
      if (!currentWorkflow) {
        const nodesWithPositions = (input.updates.nodes || []).map((node, index) => ({
          ...node,
          id: node.id || `node_${Date.now()}_${index}`,
          label: node.label || `${node.type.charAt(0).toUpperCase() + node.type.slice(1)} ${index + 1}`,
          position: node.position || { x: 100, y: 50 + index * 130 },
          status: node.status || "idle",
        }));

        const edgesToUse = (input.updates.edges || []).map((edge, index) => ({
          ...edge,
          id: edge.id || `edge_${Date.now()}_${index}`,
        }));

        return {
          success: true,
          message: `Workflow updated with ${nodesWithPositions.length} nodes and ${edgesToUse.length} connections`,
          workflow: {
            workflowId: input.workflowId,
            name: input.updates.name || "Updated Workflow",
            description: input.updates.description,
            nodes: nodesWithPositions,
            edges: edgesToUse,
            status: "draft" as const,
          },
        };
      }

      // Merge: use update nodes/edges if provided, otherwise keep current
      const finalNodes = input.updates.nodes || currentWorkflow.nodes || [];
      const finalEdges = input.updates.edges || currentWorkflow.edges || [];

      const nodesWithPositions = finalNodes.map((node: any, index: number) => ({
        ...node,
        id: node.id || `node_${Date.now()}_${index}`,
        label: node.label || `${node.type.charAt(0).toUpperCase() + node.type.slice(1)} ${index + 1}`,
        position: node.position || { x: 100, y: 50 + index * 130 },
        status: node.status || "idle",
      }));

      const edgesToUse = finalEdges.map((edge: any, index: number) => ({
        ...edge,
        id: edge.id || `edge_${Date.now()}_${index}`,
      }));

      return {
        success: true,
        message: `Workflow updated with ${nodesWithPositions.length} nodes and ${edgesToUse.length} connections`,
        workflow: {
          workflowId: input.workflowId,
          name: input.updates.name || currentWorkflow.name || "Updated Workflow",
          description: input.updates.description || currentWorkflow.description,
          nodes: nodesWithPositions,
          edges: edgesToUse,
          status: (currentWorkflow.status as "draft" | "active" | "paused") || "draft",
        },
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to update workflow",
      };
    }
  },
  inputSchema: z.object({
    workflowId: z.string().describe("ID of the workflow to update"),
    updates: z.object({
      nodes: z.array(workflowNodeSchema).optional().describe("Updated array of workflow nodes"),
      edges: z.array(workflowEdgeSchema).optional().describe("Updated array of connections"),
      name: z.string().optional().describe("Updated workflow name"),
      description: z.string().optional().describe("Updated workflow description"),
    }),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string().optional(),
    workflow: workflowCanvasSchema.optional(),
    error: z.string().optional(),
  }),
};
