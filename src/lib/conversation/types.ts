/**
 * @file types.ts
 * @description Type definitions for conversations
 */

export interface Conversation {
  id: string;
  workflowId?: string | null;
  title: string;
  tamboThreadId?: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface WorkflowVersion {
  id: string;
  workflowId: string;
  conversationId?: string | null;
  messageId?: string | null;
  nodes: unknown[];
  edges: unknown[];
  changeDescription?: string | null;
  changeType?: string | null;
  changedBy: string;
  nodeCount: number;
  createdAt: string;
}
