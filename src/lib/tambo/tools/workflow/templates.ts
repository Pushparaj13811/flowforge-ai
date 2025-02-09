import { z } from "zod";
import type { TamboTool } from "@tambo-ai/react";
import { workflowNodeSchema, workflowEdgeSchema } from "../../schemas";

export const getWorkflowTemplates: TamboTool = {
  name: "getWorkflowTemplates",
  description: `Get pre-built workflow templates.
Use this when the user wants to:
- See available templates
- Browse workflow examples
- Start from a template`,
  tool: async (input: { category?: string }) => {
    // Templates are still hardcoded for now - could be moved to database
    const templates = [
      {
        id: "tmpl_lead_alert",
        name: "Lead Alert",
        description: "Notify sales team when a high-value lead arrives",
        category: "sales",
        nodes: [
          { id: "n1", type: "trigger" as const, label: "Webhook Received", position: { x: 100, y: 50 } },
          { id: "n2", type: "condition" as const, label: "Check Lead Score", position: { x: 100, y: 180 } },
          { id: "n3", type: "action" as const, label: "Send Slack Message", position: { x: 100, y: 310 } },
        ],
        edges: [
          { id: "e1", source: "n1", target: "n2" },
          { id: "e2", source: "n2", target: "n3", sourceHandle: "yes" },
        ],
      },
      {
        id: "tmpl_welcome_email",
        name: "Welcome Email Sequence",
        description: "Send onboarding emails to new users",
        category: "marketing",
        nodes: [
          { id: "n1", type: "trigger" as const, label: "New User Signup", position: { x: 100, y: 50 } },
          { id: "n2", type: "action" as const, label: "Send Welcome Email", position: { x: 100, y: 180 } },
          { id: "n3", type: "delay" as const, label: "Wait 1 Day", position: { x: 100, y: 310 } },
          { id: "n4", type: "action" as const, label: "Send Tips Email", position: { x: 100, y: 440 } },
        ],
        edges: [
          { id: "e1", source: "n1", target: "n2" },
          { id: "e2", source: "n2", target: "n3" },
          { id: "e3", source: "n3", target: "n4" },
        ],
      },
      {
        id: "tmpl_form_notify",
        name: "Form Submission Alert",
        description: "Get notified when someone submits a form",
        category: "general",
        nodes: [
          { id: "n1", type: "trigger" as const, label: "Form Submitted", icon: "webhook", position: { x: 100, y: 50 } },
          { id: "n2", type: "action" as const, label: "Send Email", icon: "mail", position: { x: 100, y: 180 } },
          { id: "n3", type: "action" as const, label: "Slack Notification", icon: "message-square", position: { x: 100, y: 310 } },
        ],
        edges: [
          { id: "e1", source: "n1", target: "n2" },
          { id: "e2", source: "n2", target: "n3" },
        ],
      },
    ];

    return {
      templates: input.category
        ? templates.filter((t) => t.category === input.category)
        : templates,
    };
  },
  inputSchema: z.object({
    category: z.string().optional().describe("Filter by category (sales, marketing, general)"),
  }),
  outputSchema: z.object({
    templates: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      category: z.string(),
      nodes: z.array(workflowNodeSchema),
      edges: z.array(workflowEdgeSchema),
    })),
  }),
};
