import { z } from "zod";

/**
 * Workflow Node Schema
 * Note: position is optional for input (AI may not provide it) but will be auto-generated
 *
 * IMPORTANT: The 'handlerType' determines which integration handler executes this node.
 * The 'configJson' contains all configuration needed to execute the node (as JSON string).
 */
export const workflowNodeSchema = z.object({
  id: z.string().describe("Unique node ID (n1, n2, etc.)"),

  type: z.enum(["trigger", "action", "condition", "delay", "loop", "filter", "transform", "switch"]).describe(
    "Node category: trigger (entry), action (do something), condition (branch), delay (wait), loop (iterate), filter, transform, switch"
  ),

  label: z.string().describe("Short action description (e.g., 'Send Welcome Email', 'Check Amount > $100')"),

  description: z.string().optional().describe("Detailed explanation of node purpose"),

  icon: z.string().optional().describe(
    "Icon: webhook (triggers), mail (email), slack, brain (AI), globe (HTTP), table (sheets), credit-card (stripe), phone (SMS), git-branch (condition), clock (delay), repeat (loop), filter, shuffle (transform)"
  ),

  status: z.enum(["idle", "running", "success", "error", "pending"]).optional().describe("Execution status"),

  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional().describe("Canvas position (auto-generated)"),

  handlerType: z.string().optional().describe(
    "Handler: email:resend, slack:send-message, discord:webhook, teams:webhook, http:request, openai:chat, anthropic:claude, google-sheets:read/append/update, stripe:create-payment-intent/create-customer, twilio:send-sms, condition, delay, loop:foreach/repeat, filter, switch, transform, trigger:webhook/schedule/form/manual"
  ),

  configJson: z.string().optional().describe(
    `JSON config. Required fields by handler:

    trigger:webhook → {"expectedDataFields": [{"name": "...", "type": "string|number|email", "description": "..."}]}
    email:resend → {"to": "email@example.com", "subject": "Subject", "body": "Body with {{$trigger.data.field}}"}
    slack:send-message → {"channel": "#channel", "message": "Text with {{$trigger.data.field}}"}
    discord:webhook → {"webhookUrl": "https://...", "content": "Message"}
    teams:webhook → {"webhookUrl": "https://...", "text": "Message"}
    openai:chat → {"prompt": "...", "model": "gpt-4o", "maxTokens": 1000}
    anthropic:claude → {"prompt": "...", "model": "claude-3-5-sonnet-20241022"}
    google-sheets:append → {"spreadsheetId": "...", "range": "Sheet1!A:D", "values": [["a","b"]]}
    google-sheets:read → {"spreadsheetId": "...", "range": "Sheet1!A1:D10"}
    stripe:create-payment-intent → {"amount": 1000, "currency": "usd"}
    stripe:create-customer → {"email": "...", "name": "..."}
    twilio:send-sms → {"to": "+1...", "body": "Message"}
    http:request → {"url": "https://...", "method": "POST", "body": {}}
    condition → {"field": "{{$trigger.data.amount}}", "operator": "greater_than", "value": "100"}
    delay → {"duration": 5, "unit": "minutes"}
    loop:foreach → {"collection": "{{$trigger.data.items}}", "itemVariable": "item"}
    loop:repeat → {"count": 5}
    filter → {"collection": "{{$trigger.data.items}}", "field": "status", "operator": "equals", "value": "active"}
    switch → {"field": "{{$trigger.data.type}}", "cases": [{"value": "order", "label": "Order"}]}
    transform → {"mappings": {"newField": "{{$trigger.data.oldField}}"}}`
  ),

  triggerSchemaJson: z.string().optional().describe(
    "DEPRECATED: Use expectedDataFields in configJson instead"
  ),
});

/**
 * Workflow Edge Schema
 */
export const workflowEdgeSchema = z.object({
  id: z.string().describe("Unique identifier for the edge"),
  source: z.string().describe("ID of the source node"),
  target: z.string().describe("ID of the target node"),
  sourceHandle: z.string().optional().describe("Handle ID on source (e.g., 'yes', 'no' for conditions)"),
  targetHandle: z.string().optional().describe("Handle ID on target"),
  label: z.string().optional().describe("Label for the edge (e.g., 'Yes', 'No')"),
});

/**
 * Workflow Canvas Schema
 */
export const workflowCanvasSchema = z.object({
  workflowId: z.string().optional().describe("Unique workflow identifier"),
  name: z.string().describe("Display name of the workflow"),
  description: z.string().optional().describe("Brief description of the workflow"),
  nodes: z.array(workflowNodeSchema).describe("Array of workflow nodes"),
  edges: z.array(workflowEdgeSchema).describe("Array of connections between nodes"),
  status: z.enum(["draft", "active", "paused"]).optional().default("draft").describe("Workflow status"),
});

export type WorkflowNode = z.infer<typeof workflowNodeSchema>;
export type WorkflowEdge = z.infer<typeof workflowEdgeSchema>;
export type WorkflowCanvas = z.infer<typeof workflowCanvasSchema>;
