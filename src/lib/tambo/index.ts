/**
 * @file tambo/index.ts
 * @description Central configuration file for Tambo components and tools
 *
 * This file serves as the central place to register your Tambo components and tools.
 * It exports arrays that will be used by the TamboProvider.
 *
 * Read more about Tambo at https://tambo.co/docs
 */

// Export tools
export { tools } from "./tools";

// Export components
export { components } from "./components-registry";

// Export context helpers for workflow building
export { workflowContextHelpers, workflowBuildingContextHelper } from "./context-helpers";

// Export schemas for external use
export * from "./schemas";

// Export utils
export { getApiUrl } from "./utils";
