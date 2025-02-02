import type { WorkflowNode, WorkflowEdge } from "../types";

/**
 * Build workflow context message for AI
 */
export function buildWorkflowContext(
  workflowId: string,
  workflowName: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  userMessage: string
): string {
  const workflowContext = {
    workflowId: workflowId || "current-canvas",
    workflowName: workflowName || "Current Workflow",
    currentNodes: nodes.map((n) => ({
      id: n.id,
      type: n.data.nodeType,
      label: n.data.label,
      description: n.data.description,
      icon: n.data.icon,
      position: n.position,
    })),
    currentEdges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      label: e.label,
    })),
  };

  return `
IMPORTANT: You are editing an existing workflow on a visual canvas. You MUST use the updateWorkflow tool to make changes.

Current workflow state:
- Workflow ID: ${workflowContext.workflowId}
- Workflow Name: ${workflowContext.workflowName}
- Current Nodes (${workflowContext.currentNodes.length}): ${JSON.stringify(workflowContext.currentNodes, null, 2)}
- Current Edges (${workflowContext.currentEdges.length}): ${JSON.stringify(workflowContext.currentEdges, null, 2)}

INSTRUCTIONS - You MUST follow these exactly:
1. Call the "updateWorkflow" tool with this structure:
   {
     "workflowId": "${workflowContext.workflowId}",
     "updates": {
       "nodes": [...all existing nodes plus any new nodes...],
       "edges": [...all existing edges plus any new connections...]
     }
   }

2. When adding a new node:
   - Keep ALL existing nodes in the nodes array
   - Add the new node with a unique id (e.g., "node-${Date.now()}")
   - Position the new node appropriately (increment y by 130 from the last node)
   - Add an edge connecting it to the appropriate node

3. Node types: "trigger", "action", "condition", "delay", "loop"
   Icons: "clock" for delay, "mail" for email, "message-square" for Slack, "webhook" for webhooks, "bell" for notifications

4. DO NOT just describe changes in text - you MUST call the updateWorkflow tool!

User request: ${userMessage}`;
}

/**
 * Extract text content from Tambo message content
 */
export function extractTextFromContent(content: unknown): string {
  if (typeof content === 'string') return content.trim();
  if (Array.isArray(content)) {
    return content
      .filter((part): part is { type: string; text?: string } =>
        typeof part === 'object' && part !== null && 'type' in part
      )
      .filter(part => part.type === 'text' && part.text)
      .map(part => part.text || '')
      .join('')
      .trim();
  }
  return '';
}

/**
 * Extract and clean message content for display
 */
export function getMessageContent(content: unknown): string {
  if (typeof content === "string") {
    // Remove JSON code blocks
    let cleaned = content.replace(/```json\n?[\s\S]*?\n?```/g, "").trim();
    // Remove tool call markers if present
    cleaned = cleaned.replace(/\[Tool call:.*?\]/g, "").trim();
    return cleaned;
  }

  // Handle array content (Tambo messages can have array content)
  if (Array.isArray(content)) {
    return content
      .filter((part: unknown) =>
        typeof part === 'object' && part !== null && 'type' in part && (part as { type: string }).type === 'text'
      )
      .map((part: unknown) => (part as { text?: string }).text || '')
      .join('')
      .replace(/```json\n?[\s\S]*?\n?```/g, "")
      .trim();
  }

  return '';
}

export const SUGGESTIONS = [
  "Add an email notification step",
  "Add error handling to this workflow",
  "Add a 5 minute delay before the action",
  "Add a Slack notification when complete",
];
