import { z } from "zod";
import type { TamboTool } from "@tambo-ai/react";
import { workflowNodeSchema, workflowEdgeSchema, workflowCanvasSchema } from "../../schemas";
import { getApiUrl } from "../../utils";

/**
 * Determine the handler type based on node type and icon
 */
function determineHandlerType(nodeType: string, icon?: string): string {
  if (nodeType === "trigger") return "trigger";
  if (nodeType === "condition") return "condition";
  if (nodeType === "delay") return "delay";
  if (nodeType === "loop") return "loop:foreach";
  if (nodeType === "filter") return "filter";
  if (nodeType === "transform") return "transform";
  if (nodeType === "switch") return "switch";

  // Action nodes - determine by icon
  switch (icon) {
    case "mail": return "email:resend";
    case "slack":
    case "message-square": return "slack:send-message";
    case "brain": return "openai:chat";
    case "globe": return "http:request";
    case "credit-card": return "stripe:create-payment-intent";
    case "table": return "google-sheets:append";
    case "phone": return "twilio:send-sms";
    case "users": return "teams:webhook";
    default: return "email:resend";
  }
}

export const createWorkflowTool: TamboTool = {
  name: "createWorkflow",
  description: `Create automation workflow with fully configured nodes.

BEFORE CALLING: Ask clarifying questions to collect required configuration (email addresses, channel names, trigger data fields, message content preferences).

CONFIGURATION APPROACH:
- Use STATIC values for user-provided specifics: to: "john@company.com", channel: "#sales"
- Use TEMPLATE VARIABLES for dynamic trigger data: "Name: {{$trigger.data.name}}"
- Mixed example: subject: "New Lead: {{$trigger.data.name}}" (static text + dynamic data)

NODE REQUIREMENTS:
- Every node needs: id, type, label (descriptive!), icon, configJson
- Labels must be descriptive: "Email sales@acme.com" NOT "Action 1"

NODE TYPES & ICONS:
- trigger (webhook) → expectedDataFields array defining incoming data
- action (mail) → to, subject, body
- action (slack/message-square) → integrationId, channel, message
- action (brain) → integrationId, prompt
- action (globe) → url, method, body
- action (table) → integrationId, spreadsheetId, range, values
- action (credit-card) → integrationId, amount, currency
- action (phone) → integrationId, to, body
- condition (git-branch) → field, operator, value
- delay (clock) → duration, unit

HANDLER CONFIGS:
- email:resend → {to, subject, body} - body can include {{$trigger.data.X}}
- slack:send-message → {integrationId, channel, message}
- google-sheets:append → {integrationId, spreadsheetId, range, values: [["{{$trigger.data.name}}", "{{$trigger.data.email}}"]]}
- condition → {field: "{{$trigger.data.amount}}", operator: "greater_than", value: "500"}
- trigger:webhook → {expectedDataFields: [{name, type, description}]}

OPERATORS: equals, not_equals, greater_than, less_than, greater_than_or_equal, less_than_or_equal, contains, starts_with, ends_with, is_empty, is_not_empty

After creation, render WorkflowCanvas with returned workflow data.`,

  tool: async (input: {
    name: string;
    description?: string;
    nodes: z.infer<typeof workflowNodeSchema>[];
    edges: z.infer<typeof workflowEdgeSchema>[];
  }) => {
    try {
      // Process nodes into React Flow format with nested data structure
      const nodesWithConfig = input.nodes.map((node, index) => {
        // Parse configJson to config object
        let config: Record<string, unknown> = {};
        if (node.configJson) {
          try {
            config = JSON.parse(node.configJson);
          } catch (e) {
            console.warn(`Failed to parse configJson for node ${node.id}:`, e);
          }
        }

        // Handle legacy triggerSchemaJson - convert to expectedDataFields
        if (node.triggerSchemaJson && node.type === "trigger") {
          try {
            const triggerSchema = JSON.parse(node.triggerSchemaJson);
            if (!config.expectedDataFields && Array.isArray(triggerSchema)) {
              config.expectedDataFields = triggerSchema;
            }
          } catch (e) {
            console.warn(`Failed to parse triggerSchemaJson for node ${node.id}:`, e);
          }
        }

        // Get node type with fallback
        const nodeType = node.type || "action";
        const icon = node.icon || (nodeType === "trigger" ? "webhook" : nodeType === "condition" ? "git-branch" : "mail");

        // Determine handler type for execution
        const handlerType = determineHandlerType(nodeType, icon);

        // Calculate position - spread nodes diagonally
        const defaultPosition = {
          x: 150 + (index * 350),
          y: 100 + (index * 200)
        };

        // Build outputs based on node type
        let outputs: Array<{ id: string; label: string; type: string }> | undefined;
        if (nodeType === "condition") {
          outputs = [
            { id: "yes", label: "Yes", type: "success" },
            { id: "no", label: "No", type: "default" }
          ];
        } else if (nodeType === "switch" && config.cases && Array.isArray(config.cases)) {
          outputs = [
            ...config.cases.map((c: { label: string }) => ({
              id: c.label,
              label: c.label,
              type: "default"
            })),
            { id: "default", label: "Default", type: "default" }
          ];
        }

        // Build the React Flow node structure with nested data
        const nodeData: Record<string, unknown> = {
          label: node.label || `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} ${index + 1}`,
          description: node.description || "",
          icon: icon,
          nodeType: nodeType,  // FlowForge node type
          handlerType: handlerType,
          config: config,  // The actual configuration
        };

        if (outputs) {
          nodeData.outputs = outputs;
        }

        return {
          id: node.id || `n${index + 1}`,
          type: "default",  // React Flow node type - always "default"
          data: nodeData,
          position: node.position || defaultPosition,
        };
      });

      // Process edges - handle condition branches
      let edgesToUse = input.edges || [];
      if (edgesToUse.length === 0 && nodesWithConfig.length > 1) {
        // Auto-generate sequential edges
        edgesToUse = nodesWithConfig.slice(0, -1).map((node, index) => ({
          id: `e${index + 1}`,
          source: node.id,
          target: nodesWithConfig[index + 1].id,
        }));
      }

      // Save to database via HTTP request
      const response = await fetch(getApiUrl("/api/workflows"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: input.name,
          description: input.description,
          nodes: nodesWithConfig,
          edges: edgesToUse,
          status: "draft",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || "Failed to create workflow",
        };
      }

      // Count configured nodes
      const configuredNodes = nodesWithConfig.filter(n =>
        n.data.config && Object.keys(n.data.config).length > 0
      );
      const configStatus = configuredNodes.length === nodesWithConfig.length
        ? "All nodes fully configured"
        : `${configuredNodes.length}/${nodesWithConfig.length} nodes configured`;

      return {
        success: true,
        workflowId: data.workflow.id,
        message: `Workflow "${input.name}" created with ${nodesWithConfig.length} nodes. ${configStatus}.`,
        workflow: {
          workflowId: data.workflow.id,
          name: data.workflow.name,
          description: data.workflow.description,
          nodes: nodesWithConfig,
          edges: edgesToUse,
          status: data.workflow.status,
        },
      };
    } catch (error) {
      console.error("createWorkflow error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create workflow",
      };
    }
  },

  inputSchema: z.object({
    name: z.string().describe("Name of the workflow"),
    description: z.string().optional().describe("Description of what the workflow does"),
    nodes: z.array(workflowNodeSchema).describe("Workflow nodes with configJson containing actual configuration values"),
    edges: z.array(workflowEdgeSchema).describe("Connections between nodes"),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    workflowId: z.string().optional(),
    message: z.string().optional(),
    workflow: workflowCanvasSchema.optional(),
    error: z.string().optional(),
  }),
};
