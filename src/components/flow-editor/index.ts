/**
 * @file index.ts
 * @description Barrel exports for the Flow Editor components
 */

// Core components
export { FlowCanvas } from "./FlowCanvas";
export { CustomNode } from "./CustomNode";
export { ConditionNode } from "./ConditionNode";
export { CustomEdge, EdgeGradientDefs } from "./CustomEdge";
export { NodePalette } from "./NodePalette";
export { PropertiesPanel } from "./PropertiesPanel";
export { VariableInput } from "./VariableInput";

// Modal components
export { ExportImportModal } from "./ExportImportModal";
export { ExampleWorkflows } from "./ExampleWorkflows";
export { FullCanvasModal } from "./FullCanvasModal";
export { SearchModal } from "./SearchModal";
export { TestDataModal } from "./TestDataModal";

// AI Chat
export { AIChatPanel } from "./AIChatPanel";

// Store
export { useFlowStore } from "./store";

// Types
export type {
  WorkflowNode,
  WorkflowEdge,
  WorkflowNodeData,
  WorkflowNodeType,
  NodeStatus,
  NodeOutput,
  OutputType,
  NodeTemplate,
} from "./types";

export { OUTPUT_TEMPLATES, statusColors, nodeTypeColors } from "./types";
