"use client";

/**
 * Main Flow Canvas component using React Flow
 * Clean, minimal design with essential controls
 */

import * as React from "react";
import {
  ReactFlow,
  MiniMap,
  Background,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  ConnectionLineType,
  type Node,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react";
import type { WorkflowNodeData } from "./types";
import "@xyflow/react/dist/style.css";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CustomNode } from "./CustomNode";
import { ConditionNode } from "./ConditionNode";
import { CustomEdge, EdgeGradientDefs } from "./CustomEdge";
import { useFlowStore } from "./store";
import type { WorkflowNode } from "./types";

// Define custom node types
const nodeTypes: NodeTypes = {
  custom: CustomNode,
  condition: ConditionNode,
};

// Define custom edge types
const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

interface FlowCanvasProps {
  className?: string;
}

function FlowCanvasInner({ className }: FlowCanvasProps) {
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const {
    nodes,
    edges,
    selectedNodeId,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    selectNode,
  } = useFlowStore();

  // Handle drag over for dropping new nodes
  const onDragOver = React.useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Handle drop to create new nodes
  const onDrop = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const data = event.dataTransfer.getData("application/reactflow");
      if (!data) return;

      try {
        const template = JSON.parse(data);

        // Get the position where the node was dropped
        const reactFlowBounds = event.currentTarget.getBoundingClientRect();
        const position = {
          x: event.clientX - reactFlowBounds.left - 100,
          y: event.clientY - reactFlowBounds.top - 40,
        };

        const newNode: WorkflowNode = {
          id: `node-${Date.now()}`,
          type: template.type === "condition" ? "condition" : "custom",
          position,
          data: {
            label: template.label,
            description: template.description,
            icon: template.icon,
            nodeType: template.type,
            status: "idle",
            config: {},
          },
        };

        addNode(newNode);
      } catch (error) {
        console.error("Failed to parse drop data:", error);
      }
    },
    [addNode]
  );

  // Handle node click
  const onNodeClick = React.useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  // Handle pane click (deselect)
  const onPaneClick = React.useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isInputFocused = document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA";

      // Delete selected node
      if (event.key === "Delete" || event.key === "Backspace") {
        if (selectedNodeId && !isInputFocused) {
          event.preventDefault();
          useFlowStore.getState().deleteNode(selectedNodeId);
        }
      }

      // Copy (Ctrl+C or Cmd+C)
      if ((event.ctrlKey || event.metaKey) && event.key === "c") {
        if (selectedNodeId && !isInputFocused) {
          event.preventDefault();
          useFlowStore.getState().copyNodes([selectedNodeId]);
        }
      }

      // Paste (Ctrl+V or Cmd+V)
      if ((event.ctrlKey || event.metaKey) && event.key === "v") {
        if (!isInputFocused) {
          event.preventDefault();
          useFlowStore.getState().pasteNodes();
        }
      }

      // Undo (Ctrl+Z or Cmd+Z)
      if ((event.ctrlKey || event.metaKey) && event.key === "z" && !event.shiftKey) {
        if (!isInputFocused) {
          event.preventDefault();
          useFlowStore.getState().undo();
        }
      }

      // Redo (Ctrl+Y or Cmd+Shift+Z)
      if ((event.ctrlKey || event.metaKey) && (event.key === "y" || (event.key === "z" && event.shiftKey))) {
        if (!isInputFocused) {
          event.preventDefault();
          useFlowStore.getState().redo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodeId]);

  return (
    <div className={cn("relative h-full w-full", className)}>
      <EdgeGradientDefs />

      {/* Zoom Controls - Bottom Right */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1">
        <div className="flex items-center bg-white dark:bg-card rounded-lg border border-border/50 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-r-none"
            onClick={() => zoomOut()}
            title="Zoom Out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <div className="w-px h-4 bg-border" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-none"
            onClick={() => zoomIn()}
            title="Zoom In"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <div className="w-px h-4 bg-border" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-l-none"
            onClick={() => fitView({ padding: 0.2 })}
            title="Fit View"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Node Count - Bottom Left */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-white dark:bg-card rounded-lg border border-border/50 shadow-sm px-3 py-1.5">
          <span className="text-xs text-muted-foreground">
            {nodes.length} node{nodes.length !== 1 ? "s" : ""} · {edges.length} connection{edges.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges.map((edge) => ({
          ...edge,
          // Style edges based on sourceHandle for condition nodes
          style: edge.sourceHandle === "yes"
            ? { stroke: "#22c55e", strokeWidth: 2 }
            : edge.sourceHandle === "no"
            ? { stroke: "#ef4444", strokeWidth: 2 }
            : edge.style,
          label: edge.sourceHandle === "yes"
            ? "✓"
            : edge.sourceHandle === "no"
            ? "✗"
            : edge.label,
        }))}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: true,
        }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        snapToGrid
        snapGrid={[15, 15]}
        connectionLineStyle={{ stroke: "hsl(var(--primary))", strokeWidth: 2 }}
        connectionLineType={ConnectionLineType.SmoothStep}
        deleteKeyCode={[]}
        className="bg-[#fafbfc] dark:bg-background"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="hsl(var(--muted-foreground) / 0.15)"
        />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as WorkflowNodeData;
            switch (data.nodeType) {
              case "trigger":
                return "#3b82f6";
              case "action":
                return "#22c55e";
              case "condition":
                return "#a855f7";
              case "delay":
                return "#f97316";
              case "loop":
                return "#06b6d4";
              default:
                return "#6b7280";
            }
          }}
          maskColor="rgba(0, 0, 0, 0.5)"
          className="!bg-white dark:!bg-card !border-border/50 !rounded-lg !shadow-sm"
          style={{ width: 120, height: 80 }}
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}

// Wrapper with ReactFlowProvider
export function FlowCanvas(props: FlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
