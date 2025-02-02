/**
 * @file store.ts
 * @description Zustand store for managing workflow state in the Flow Editor
 */

"use client";

import { create } from "zustand";
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from "@xyflow/react";
import type { WorkflowNode, WorkflowEdge, WorkflowNodeData } from "./types";

// ============================================================================
// Store Interface
// ============================================================================

interface HistoryState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

interface FlowState {
  // Core state
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;

  // Conversation state
  conversationId: string | null;

  // UI state
  rightSidebarOpen: boolean;
  leftSidebarOpen: boolean;

  // History for undo/redo
  history: HistoryState[];
  historyIndex: number;

  // Clipboard
  clipboard: WorkflowNode[] | null;

  // Actions
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: WorkflowEdge[]) => void;
  onNodesChange: OnNodesChange<WorkflowNode>;
  onEdgesChange: OnEdgesChange<WorkflowEdge>;
  onConnect: OnConnect;

  // Node operations
  addNode: (node: WorkflowNode) => void;
  updateNode: (id: string, data: Partial<WorkflowNodeData>) => void;
  deleteNode: (id: string) => void;
  duplicateNode: (id: string) => void;
  selectNode: (id: string | null) => void;

  // Copy/paste
  copyNodes: (ids: string[]) => void;
  pasteNodes: () => void;

  // History
  saveToHistory: () => void;
  undo: () => void;
  redo: () => void;

  // Import/Export
  importWorkflow: (data: string) => boolean;
  exportWorkflow: () => string;

  // UI toggles
  toggleRightSidebar: () => void;
  toggleLeftSidebar: () => void;

  // Sidebar aliases for compatibility
  showLeftSidebar: boolean;
  showRightSidebar: boolean;

  // Computed history states
  canUndo: boolean;
  canRedo: boolean;

  // Load workflow
  loadWorkflow: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => void;

  // Conversation
  setConversation: (id: string | null) => void;

  // Reset
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialNodes: WorkflowNode[] = [];
const initialEdges: WorkflowEdge[] = [];

// ============================================================================
// Store Implementation
// ============================================================================

export const useFlowStore = create<FlowState>((set, get) => ({
  // Initial state
  nodes: initialNodes,
  edges: initialEdges,
  selectedNodeId: null,
  conversationId: null,
  rightSidebarOpen: true,
  leftSidebarOpen: true,
  history: [{ nodes: initialNodes, edges: initialEdges }],
  historyIndex: 0,
  clipboard: null,

  // Sidebar aliases (set as regular properties, updated by toggles)
  showLeftSidebar: true,
  showRightSidebar: true,

  // Computed history states (these will be computed as booleans, not functions)
  canUndo: false,
  canRedo: false,

  // Set nodes
  setNodes: (nodes) => {
    set({ nodes });
  },

  // Set edges
  setEdges: (edges) => {
    set({ edges });
  },

  // Handle node changes (from React Flow)
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  // Handle edge changes (from React Flow)
  onEdgesChange: (changes: EdgeChange<WorkflowEdge>[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  // Handle new connections
  onConnect: (connection: Connection) => {
    set({
      edges: addEdge(
        {
          ...connection,
          type: "smoothstep",
          animated: true,
        },
        get().edges
      ),
    });
  },

  // Add a new node
  addNode: (node) => {
    set((state) => ({
      nodes: [...state.nodes, node],
    }));
  },

  // Update node data
  updateNode: (id, data) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, ...data } }
          : node
      ),
    }));
  },

  // Delete a node and its connected edges
  deleteNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    }));
  },

  // Duplicate a node
  duplicateNode: (id) => {
    const state = get();
    const node = state.nodes.find((n) => n.id === id);
    if (!node) return;

    const newNode: WorkflowNode = {
      ...node,
      id: `${node.id}-copy-${Date.now()}`,
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50,
      },
      data: {
        ...node.data,
        label: `${node.data.label} (Copy)`,
      },
      selected: false,
    };

    set((state) => ({
      nodes: [...state.nodes, newNode],
    }));
  },

  // Select a node
  selectNode: (id) => {
    set({ selectedNodeId: id });
  },

  // Copy nodes to clipboard
  copyNodes: (ids) => {
    const state = get();
    const nodesToCopy = state.nodes.filter((n) => ids.includes(n.id));
    set({ clipboard: nodesToCopy });
  },

  // Paste nodes from clipboard
  pasteNodes: () => {
    const state = get();
    if (!state.clipboard || state.clipboard.length === 0) return;

    const newNodes = state.clipboard.map((node) => ({
      ...node,
      id: `${node.id}-paste-${Date.now()}`,
      position: {
        x: node.position.x + 100,
        y: node.position.y + 100,
      },
      data: {
        ...node.data,
        label: `${node.data.label} (Copy)`,
      },
      selected: false,
    }));

    set((state) => ({
      nodes: [...state.nodes, ...newNodes],
    }));
  },

  // Save current state to history
  saveToHistory: () => {
    const state = get();
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push({
      nodes: JSON.parse(JSON.stringify(state.nodes)),
      edges: JSON.parse(JSON.stringify(state.edges)),
    });

    // Limit history to 50 entries
    if (newHistory.length > 50) {
      newHistory.shift();
    }

    const newHistoryIndex = newHistory.length - 1;
    set({
      history: newHistory,
      historyIndex: newHistoryIndex,
      canUndo: newHistoryIndex > 0,
      canRedo: newHistoryIndex < newHistory.length - 1,
    });
  },

  // Undo last action
  undo: () => {
    const state = get();
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1;
      const prevState = state.history[newIndex];
      set({
        nodes: prevState.nodes,
        edges: prevState.edges,
        historyIndex: newIndex,
        canUndo: newIndex > 0,
        canRedo: true,
      });
    }
  },

  // Redo last undone action
  redo: () => {
    const state = get();
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1;
      const nextState = state.history[newIndex];
      set({
        nodes: nextState.nodes,
        edges: nextState.edges,
        historyIndex: newIndex,
        canUndo: true,
        canRedo: newIndex < state.history.length - 1,
      });
    }
  },

  // Import workflow from JSON
  importWorkflow: (data) => {
    try {
      const parsed = JSON.parse(data);

      // Convert from API format if needed
      const nodes: WorkflowNode[] = (parsed.nodes || []).map(
        (n: {
          id: string;
          label: string;
          description?: string;
          icon?: string;
          type: string;
          config?: Record<string, unknown>;
          position?: { x: number; y: number };
        }) => ({
          id: n.id,
          type: n.type === "condition" ? "condition" : "custom",
          position: n.position || { x: 250, y: 100 + (parsed.nodes || []).indexOf(n) * 150 },
          data: {
            label: n.label,
            description: n.description,
            icon: n.icon,
            nodeType: n.type,
            status: "idle",
            config: n.config || {},
          },
        })
      );

      const edges: WorkflowEdge[] = (parsed.edges || []).map(
        (e: {
          id: string;
          source: string;
          target: string;
          sourceHandle?: string;
          label?: string;
        }) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          label: e.label,
          type: "smoothstep",
          animated: true,
        })
      );

      set({ nodes, edges });
      get().saveToHistory();
      return true;
    } catch (error) {
      console.error("Failed to import workflow:", error);
      return false;
    }
  },

  // Export workflow to JSON
  exportWorkflow: () => {
    const state = get();
    return JSON.stringify(
      {
        nodes: state.nodes.map((n) => ({
          id: n.id,
          label: n.data.label,
          description: n.data.description,
          icon: n.data.icon,
          type: n.data.nodeType,
          config: n.data.config,
          position: n.position,
        })),
        edges: state.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          label: e.label,
        })),
      },
      null,
      2
    );
  },

  // Toggle right sidebar
  toggleRightSidebar: () => {
    set((state) => ({
      rightSidebarOpen: !state.rightSidebarOpen,
      showRightSidebar: !state.rightSidebarOpen,
    }));
  },

  // Toggle left sidebar
  toggleLeftSidebar: () => {
    set((state) => ({
      leftSidebarOpen: !state.leftSidebarOpen,
      showLeftSidebar: !state.leftSidebarOpen,
    }));
  },

  // Set conversation
  setConversation: (id) => {
    set({ conversationId: id });
  },

  // Load workflow (sets nodes and edges, saves to history)
  loadWorkflow: (nodes, edges) => {
    set({ nodes, edges });
    get().saveToHistory();
  },

  // Reset to initial state
  reset: () => {
    set({
      nodes: initialNodes,
      edges: initialEdges,
      selectedNodeId: null,
      conversationId: null,
      history: [{ nodes: initialNodes, edges: initialEdges }],
      historyIndex: 0,
      clipboard: null,
    });
  },
}));
