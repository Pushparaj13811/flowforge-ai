"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Lock,
  Unlock,
  Play,
  Save,
  Expand,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WorkflowNode } from "./workflow-node";
import {
  workflowCanvasPropsSchema,
  safePosition,
  ensureArray,
  type WorkflowNode as WorkflowNodeType,
  type WorkflowEdge,
  type WorkflowStatus,
} from "@/lib/validation";
import { useTamboComponentState } from "@tambo-ai/react";
import { WorkflowPlaceholder } from "./workflow-placeholder";
import { useLatestWorkflow } from "@/contexts/LatestWorkflowContext";

interface WorkflowCanvasProps {
  workflowId?: string;
  name?: string;
  description?: string;
  nodes?: WorkflowNodeType[];
  edges?: WorkflowEdge[];
  status?: WorkflowStatus;
  highlightNodeIds?: Set<string>;
  hideHeader?: boolean;
  hideControls?: boolean;
  isInStickyPanel?: boolean; // NEW: Flag to identify if rendered in sticky panel
  onNodeClick?: (nodeId: string) => void;
  onSave?: () => void;
  onRun?: () => void;
  onExpand?: () => void;
  className?: string;
}

// Type for the workflow state stored in Tambo
interface WorkflowCanvasState {
  workflowId?: string;
  name?: string;
  description?: string;
  nodes?: WorkflowNodeType[];
  edges?: WorkflowEdge[];
  status?: WorkflowStatus;
}

const statusConfig = {
  draft: { label: "Draft", variant: "secondary" as const },
  active: { label: "Active", variant: "success" as const },
  paused: { label: "Paused", variant: "warning" as const },
  error: { label: "Error", variant: "destructive" as const },
} as const;

export function WorkflowCanvas(props: WorkflowCanvasProps) {
  // Validate and apply defaults from props
  const validatedProps = React.useMemo(() => {
    const result = workflowCanvasPropsSchema.safeParse(props);
    if (result.success) {
      return result.data;
    }
    // Return safe defaults if validation fails
    return {
      workflowId: props.workflowId,
      name: props.name ?? "Untitled Workflow",
      description: props.description,
      nodes: ensureArray(props.nodes),
      edges: ensureArray(props.edges),
      status: props.status ?? "draft",
    };
  }, [props]);

  // Build the current props as state object for streaming
  // This allows Tambo to stream prop updates during generation
  const propsAsState = React.useMemo<WorkflowCanvasState>(() => ({
    workflowId: validatedProps.workflowId,
    name: validatedProps.name,
    description: validatedProps.description,
    nodes: validatedProps.nodes,
    edges: validatedProps.edges,
    status: validatedProps.status ?? "draft",
  }), [validatedProps]);

  // Use Tambo component state to sync workflow data with Tambo
  // This enables:
  // 1. Receiving updates from AI tools (createWorkflow, updateWorkflow)
  // 2. Persisting user changes back to the thread
  // 3. Streaming props support during generation
  //
  // The third parameter (setFromProp) is KEY for updates:
  // - During streaming, when props change, the state updates automatically
  // - Once the user makes changes (via setState), user changes take precedence
  const [workflowState, setWorkflowState] = useTamboComponentState<WorkflowCanvasState>(
    "workflow-canvas",
    // Initial value (used if no state exists in the message)
    propsAsState,
    // setFromProp: Seed state from streamed props - updates when props change during streaming
    propsAsState
  );

  // Use state from Tambo - this will receive streaming updates via setFromProp
  // The workflowState will be updated during streaming when Tambo streams new props
  const currentState = workflowState ?? propsAsState;
  const { name, description, status } = currentState;
  const nodes = ensureArray(currentState.nodes);
  const edges = ensureArray(currentState.edges);

  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [isLocked, setIsLocked] = React.useState(false);
  const [selectedNode, setSelectedNode] = React.useState<string | null>(null);
  const canvasRef = React.useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.1, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.5));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId);
    props.onNodeClick?.(nodeId);
  };

  // Calculate edge counts and labels for each node
  const nodeEdgeCounts = React.useMemo(() => {
    const counts = new Map<string, { count: number; labels: string[] }>();

    edges.forEach(edge => {
      const current = counts.get(edge.source) || { count: 0, labels: [] };
      const targetNode = nodes.find(n => n.id === edge.target);
      counts.set(edge.source, {
        count: current.count + 1,
        labels: [...current.labels, targetNode?.label || edge.label || 'Connection']
      });
    });

    return counts;
  }, [edges, nodes]);

  // Calculate SVG path for edges with safe position access
  // Node width is 220px, so center is at x + 110
  // Node height is ~80px, bottom handle at y + 80, top handle at y
  const getEdgePath = (
    source: WorkflowNodeType | undefined,
    target: WorkflowNodeType | undefined
  ): string | null => {
    if (!source || !target) return null;

    const sourcePos = safePosition(source.position);
    const targetPos = safePosition(target.position);

    // Source: bottom center of node (node width = 220, height ~80)
    const sourceX = sourcePos.x + 110;
    const sourceY = sourcePos.y + 85; // bottom of node + handle offset

    // Target: top center of node
    const targetX = targetPos.x + 110;
    const targetY = targetPos.y - 5; // top of node - handle offset

    // Calculate control points for smooth bezier curve
    const deltaY = Math.abs(targetY - sourceY);
    const controlOffset = Math.min(deltaY * 0.5, 60);

    return `M ${sourceX} ${sourceY} C ${sourceX} ${sourceY + controlOffset}, ${targetX} ${targetY - controlOffset}, ${targetX} ${targetY}`;
  };

  const safeStatus = status && statusConfig[status] ? statusConfig[status] : statusConfig.draft;

  // Check if sticky panel is open (only from LatestWorkflowContext if available)
  let isPanelOpen = false;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { isPanelOpen: panelState } = useLatestWorkflow();
    isPanelOpen = panelState;
  } catch {
    // Context not available, panel is not open
    isPanelOpen = false;
  }

  // If sticky panel is open and this is NOT the sticky panel instance, show placeholder
  if (isPanelOpen && !props.isInStickyPanel) {
    return (
      <WorkflowPlaceholder
        name={name ?? "Untitled Workflow"}
        description={description}
        nodeCount={nodes.length}
        onExpand={props.onExpand}
        className={props.className}
      />
    );
  }

  // Show empty state if no nodes
  if (nodes.length === 0) {
    return (
      <div
        className={cn(
          "relative rounded-2xl border border-border bg-card overflow-hidden",
          "h-full min-h-[400px] flex items-center justify-center",
          props.className
        )}
      >
        <div className="text-center p-8">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Play className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No workflow yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Describe your workflow in the chat and I'll build it for you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative bg-card overflow-hidden",
        !props.hideHeader && "rounded-2xl border border-border",
        "h-full min-h-[500px]",
        "z-0",
        props.className
      )}
    >
      {/* Header */}
      {!props.hideHeader && (
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="font-semibold">{name}</h2>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <Badge variant={safeStatus.variant}>{safeStatus.label}</Badge>
        </div>

        <div className="flex items-center gap-2">
          {props.onExpand && (
            <Button
              variant="ghost"
              size="sm"
              onClick={props.onExpand}
              className="gap-1"
            >
              <Expand className="h-4 w-4" />
              Open Editor
            </Button>
          )}
          {props.onSave && (
            <Button variant="ghost" size="sm" onClick={props.onSave}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          )}
          {props.onRun && (
            <Button variant="gradient" size="sm" onClick={props.onRun}>
              <Play className="h-4 w-4 mr-1" />
              Run
            </Button>
          )}
        </div>
      </div>
      )}

      {/* Canvas Controls */}
      {!props.hideControls && (
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
        <div className="glass rounded-xl p-1 flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium px-2 min-w-[50px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleZoomIn}
            disabled={zoom >= 2}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <Button variant="glass" size="icon-sm" onClick={handleResetView}>
          <Maximize2 className="h-4 w-4" />
        </Button>

        <Button
          variant="glass"
          size="icon-sm"
          onClick={() => setIsLocked(!isLocked)}
        >
          {isLocked ? (
            <Lock className="h-4 w-4" />
          ) : (
            <Unlock className="h-4 w-4" />
          )}
        </Button>
      </div>
      )}

      {/* Node Count */}
      {!props.hideControls && (
      <div className="absolute bottom-4 right-4 z-10">
        <div className="glass rounded-xl px-3 py-1.5">
          <span className="text-xs text-muted-foreground">
            {nodes.length} nodes · {edges.length} connections
          </span>
        </div>
      </div>
      )}

      {/* Canvas */}
      <div
        ref={canvasRef}
        className={cn(
          "absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing",
          !props.hideHeader && "pt-14"
        )}
        onMouseDown={() => !isLocked && setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={(e) => {
          if (isDragging && !isLocked) {
            setPan((p) => ({
              x: p.x + e.movementX,
              y: p.y + e.movementY,
            }));
          }
        }}
      >
        {/* Grid Background */}
        <div
          className="absolute inset-0 bg-dots opacity-30"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
          }}
        />

        {/* Workflow Container */}
        <motion.div
          className="absolute inset-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "top left",
          }}
          animate={{
            x: pan.x,
            y: pan.y,
            scale: zoom,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* SVG for Edges */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ overflow: "visible" }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  className="fill-muted-foreground"
                />
              </marker>
              <linearGradient
                id="edgeGradient"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop
                  offset="0%"
                  stopColor="var(--flow-blue)"
                  stopOpacity="0.5"
                />
                <stop
                  offset="100%"
                  stopColor="var(--flow-purple)"
                  stopOpacity="0.5"
                />
              </linearGradient>
            </defs>

            {edges.map((edge) => {
              const sourceNode = nodes.find((n) => n.id === edge.source);
              const targetNode = nodes.find((n) => n.id === edge.target);
              const path = getEdgePath(sourceNode, targetNode);

              if (!path) return null;

              return (
                <g key={edge.id}>
                  {/* Edge glow */}
                  <motion.path
                    d={path}
                    fill="none"
                    stroke="url(#edgeGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    className="blur-sm"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.3 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  />
                  {/* Edge line */}
                  <motion.path
                    d={path}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="none"
                    className="text-muted-foreground"
                    markerEnd="url(#arrowhead)"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  />
                  {/* Animated flow */}
                  <motion.circle
                    r="4"
                    className="fill-primary"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <animateMotion
                      dur="2s"
                      repeatCount="indefinite"
                      path={path}
                    />
                  </motion.circle>
                </g>
              );
            })}
          </svg>

          {/* Nodes */}
          <AnimatePresence>
            {nodes.map((node, index) => {
              const position = safePosition(node.position);
              return (
                <motion.div
                  key={node.id}
                  className="absolute"
                  style={{
                    left: position.x,
                    top: position.y,
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <WorkflowNode
                    id={node.id}
                    type={node.type}
                    label={node.label}
                    description={node.description}
                    icon={node.icon}
                    status={node.status}
                    isSelected={selectedNode === node.id}
                    isActive={node.status === "running"}
                    isHighlighted={props.highlightNodeIds?.has(node.id)}
                    onClick={() => handleNodeClick(node.id)}
                    outputEdgeCount={nodeEdgeCounts.get(node.id)?.count || 0}
                    outputEdgeLabels={nodeEdgeCounts.get(node.id)?.labels || []}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

// Re-export types for convenience
export type { WorkflowNodeType as WorkflowNodeData, WorkflowEdge as WorkflowEdgeData };
