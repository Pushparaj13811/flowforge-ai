import * as React from "react";
import type { WorkflowNode, WorkflowEdge } from "@/components/flow-editor";

// Consolidated message type for display
export interface ConsolidatedMessage {
  id: string;
  role: "user" | "assistant";
  textContent: string;
  renderedComponent?: React.ReactNode;
}

/**
 * Helper to extract text content from message - filters out JSON and tool responses
 */
export function getMessageText(content: unknown): string {
  if (typeof content === "string") {
    // Filter out raw JSON strings (tool responses)
    const trimmed = content.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        JSON.parse(trimmed);
        return ""; // It's valid JSON, don't display it
      } catch {
        return content; // Not valid JSON, display it
      }
    }
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .filter(
        (part): part is { type: "text"; text: string } =>
          typeof part === "object" &&
          part !== null &&
          "type" in part &&
          part.type === "text"
      )
      .map((part) => {
        const text = part.text || "";
        // Filter out JSON text parts
        const trimmed = text.trim();
        if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
          try {
            JSON.parse(trimmed);
            return ""; // It's valid JSON, don't display it
          } catch {
            return text;
          }
        }
        return text;
      })
      .filter(Boolean)
      .join("");
  }
  return "";
}

/**
 * Consolidate consecutive assistant messages into single display messages
 */
export function consolidateMessages(messages: Array<{
  id?: string;
  role: string;
  content: unknown;
  renderedComponent?: React.ReactNode;
}>): ConsolidatedMessage[] {
  const result: ConsolidatedMessage[] = [];
  let currentAssistantMessage: ConsolidatedMessage | null = null;

  for (const msg of messages) {
    // Skip tool messages
    if (msg.role === "tool") continue;

    const textContent = getMessageText(msg.content);

    if (msg.role === "user") {
      // Flush any pending assistant message
      if (currentAssistantMessage) {
        if (currentAssistantMessage.textContent || currentAssistantMessage.renderedComponent) {
          result.push(currentAssistantMessage);
        }
        currentAssistantMessage = null;
      }
      // Add user message
      if (textContent) {
        result.push({
          id: msg.id || `user-${result.length}`,
          role: "user",
          textContent,
        });
      }
    } else if (msg.role === "assistant") {
      // Start new or continue assistant message
      if (!currentAssistantMessage) {
        currentAssistantMessage = {
          id: msg.id || `assistant-${result.length}`,
          role: "assistant",
          textContent: "",
        };
      }

      // Accumulate text content (avoid duplicates)
      if (textContent && !currentAssistantMessage.textContent.includes(textContent)) {
        if (currentAssistantMessage.textContent) {
          currentAssistantMessage.textContent += "\n\n" + textContent;
        } else {
          currentAssistantMessage.textContent = textContent;
        }
      }

      // Take the rendered component (prefer the last one with a component)
      if (msg.renderedComponent) {
        currentAssistantMessage.renderedComponent = msg.renderedComponent;
      }
    }
  }

  // Flush final assistant message
  if (currentAssistantMessage) {
    if (currentAssistantMessage.textContent || currentAssistantMessage.renderedComponent) {
      result.push(currentAssistantMessage);
    }
  }

  return result;
}

/**
 * Extract workflow data from rendered component props
 */
export function extractWorkflowFromComponent(component: React.ReactNode): {
  name?: string;
  description?: string;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
} | null {
  if (!React.isValidElement(component)) return null;

  const props = component.props as Record<string, unknown>;

  // Check if it has workflow data (WorkflowCanvas props)
  if (props.nodes && Array.isArray(props.nodes)) {
    return {
      name: props.name as string | undefined,
      description: props.description as string | undefined,
      nodes: (props.nodes as Array<{
        id: string;
        type?: string;
        label: string;
        description?: string;
        icon?: string;
        status?: string;
        position?: { x: number; y: number };
      }>).map((n, index) => ({
        id: n.id || `node-${index}`,
        type: "custom",
        position: n.position || { x: 100, y: 50 + index * 130 },
        data: {
          label: n.label,
          description: n.description,
          icon: n.icon,
          nodeType: (n.type as "trigger" | "action" | "condition" | "delay" | "loop") || "action",
          status: (n.status as "idle" | "pending" | "running" | "success" | "error") || "idle",
        },
      })),
      edges: (props.edges as Array<{
        id: string;
        source: string;
        target: string;
        sourceHandle?: string;
        targetHandle?: string;
        label?: string;
      }> | undefined)?.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        label: e.label,
        type: "smoothstep",
        animated: true,
      })) || [],
    };
  }

  return null;
}

/**
 * Check if a component is a WorkflowCanvas
 */
export function isWorkflowCanvasComponent(component: React.ReactElement): boolean {
  const componentType = (component.type as { name?: string })?.name;
  const displayName = (component.type as { displayName?: string })?.displayName;
  const componentString = String(component.type);

  const hasWorkflowProps =
    component.props &&
    typeof component.props === 'object' &&
    component.props !== null &&
    'nodes' in component.props &&
    'edges' in component.props &&
    'status' in component.props;

  return (
    componentType === 'WorkflowCanvas' ||
    displayName === 'WorkflowCanvas' ||
    componentString.includes('WorkflowCanvas') ||
    Boolean(hasWorkflowProps)
  );
}
