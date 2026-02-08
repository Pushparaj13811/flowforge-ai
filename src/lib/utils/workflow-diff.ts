/**
 * @file workflow-diff.ts
 * @description Utility for detecting changes between workflow versions
 */

import type { WorkflowNode, WorkflowEdge } from "@/components/flow-editor/types";

export interface WorkflowChange {
  type: "node_added" | "node_removed" | "node_updated" | "edge_added" | "edge_removed";
  id: string;
  label?: string;
  details?: string;
}

export interface WorkflowDiffResult {
  changes: WorkflowChange[];
  summary: string;
}

/**
 * Detect changes between two workflow states
 */
export function detectWorkflowChanges(
  prevNodes: WorkflowNode[],
  nextNodes: WorkflowNode[],
  prevEdges: WorkflowEdge[],
  nextEdges: WorkflowEdge[]
): WorkflowDiffResult {
  const changes: WorkflowChange[] = [];

  // Create maps for easier lookup
  const prevNodeMap = new Map(prevNodes.map((n) => [n.id, n]));
  const nextNodeMap = new Map(nextNodes.map((n) => [n.id, n]));
  const prevEdgeMap = new Map(prevEdges.map((e) => [e.id, e]));
  const nextEdgeMap = new Map(nextEdges.map((e) => [e.id, e]));

  // Detect added and updated nodes
  for (const node of nextNodes) {
    const prevNode = prevNodeMap.get(node.id);
    if (!prevNode) {
      changes.push({
        type: "node_added",
        id: node.id,
        label: node.data.label,
        details: `Added ${node.data.nodeType} node: ${node.data.label}`,
      });
    } else if (JSON.stringify(prevNode.data) !== JSON.stringify(node.data)) {
      changes.push({
        type: "node_updated",
        id: node.id,
        label: node.data.label,
        details: `Updated node: ${node.data.label}`,
      });
    }
  }

  // Detect removed nodes
  for (const node of prevNodes) {
    if (!nextNodeMap.has(node.id)) {
      changes.push({
        type: "node_removed",
        id: node.id,
        label: node.data.label,
        details: `Removed node: ${node.data.label}`,
      });
    }
  }

  // Detect added edges
  for (const edge of nextEdges) {
    if (!prevEdgeMap.has(edge.id)) {
      changes.push({
        type: "edge_added",
        id: edge.id,
        details: `Added connection from ${edge.source} to ${edge.target}`,
      });
    }
  }

  // Detect removed edges
  for (const edge of prevEdges) {
    if (!nextEdgeMap.has(edge.id)) {
      changes.push({
        type: "edge_removed",
        id: edge.id,
        details: `Removed connection from ${edge.source} to ${edge.target}`,
      });
    }
  }

  // Generate summary
  const summary = generateSummary(changes);

  return { changes, summary };
}

/**
 * Generate a human-readable summary of changes
 */
function generateSummary(changes: WorkflowChange[]): string {
  if (changes.length === 0) {
    return "No changes";
  }

  const added = changes.filter((c) => c.type === "node_added");
  const removed = changes.filter((c) => c.type === "node_removed");
  const updated = changes.filter((c) => c.type === "node_updated");
  const edgesAdded = changes.filter((c) => c.type === "edge_added");
  const edgesRemoved = changes.filter((c) => c.type === "edge_removed");

  const parts: string[] = [];

  if (added.length > 0) {
    const labels = added.map((c) => c.label).filter(Boolean);
    parts.push(
      labels.length === 1
        ? `Added "${labels[0]}"`
        : `Added ${added.length} node${added.length > 1 ? "s" : ""}`
    );
  }

  if (removed.length > 0) {
    const labels = removed.map((c) => c.label).filter(Boolean);
    parts.push(
      labels.length === 1
        ? `Removed "${labels[0]}"`
        : `Removed ${removed.length} node${removed.length > 1 ? "s" : ""}`
    );
  }

  if (updated.length > 0) {
    const labels = updated.map((c) => c.label).filter(Boolean);
    parts.push(
      labels.length === 1
        ? `Updated "${labels[0]}"`
        : `Updated ${updated.length} node${updated.length > 1 ? "s" : ""}`
    );
  }

  if (edgesAdded.length > 0) {
    parts.push(
      `Added ${edgesAdded.length} connection${edgesAdded.length > 1 ? "s" : ""}`
    );
  }

  if (edgesRemoved.length > 0) {
    parts.push(
      `Removed ${edgesRemoved.length} connection${edgesRemoved.length > 1 ? "s" : ""}`
    );
  }

  return parts.join(", ");
}

/**
 * Compare two workflow states for equality
 */
export function areWorkflowsEqual(
  nodes1: WorkflowNode[],
  edges1: WorkflowEdge[],
  nodes2: WorkflowNode[],
  edges2: WorkflowEdge[]
): boolean {
  if (nodes1.length !== nodes2.length || edges1.length !== edges2.length) {
    return false;
  }

  const { changes } = detectWorkflowChanges(nodes1, nodes2, edges1, edges2);
  return changes.length === 0;
}
