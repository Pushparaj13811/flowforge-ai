/**
 * @file tambo.ts
 * @description Central configuration file for Tambo components and tools
 *
 * This file re-exports from the modular tambo/ directory structure.
 * All implementation has been moved to separate files for better maintainability.
 *
 * Read more about Tambo at https://tambo.co/docs
 */

// Export tools and components
export { tools, components, workflowContextHelpers, workflowBuildingContextHelper } from "./tambo/index";

// Export schemas for external use
export {
  workflowNodeSchema,
  workflowEdgeSchema,
  workflowCanvasSchema,
  executionStepSchema,
  executionTimelineSchema,
  type WorkflowNode,
  type WorkflowEdge,
  type WorkflowCanvas,
  type ExecutionStep,
  type ExecutionTimeline,
} from "./tambo/schemas";

// Export utils
export { getApiUrl } from "./tambo/utils";
