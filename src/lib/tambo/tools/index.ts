import type { TamboTool } from "@tambo-ai/react";

// Population stats tools
import { populationStatsTool, globalPopulationTool } from "./population-stats";

// Data tools
import { transformDataTool, delayTool, evaluateConditionTool } from "./data-tools";

// Workflow tools
import {
  createWorkflowTool,
  executeWorkflowTool,
  updateWorkflowTool,
  getCurrentWorkflowTool,
  analyzeWorkflowTool,
  getWorkflowTemplates,
  // Conversational workflow building tools
  validateWorkflowRequirementsTool,
  defineTriggerSchemaTool,
  configureNodeTool,
  batchConfigureNodesTool,
  buildWorkflowConversationalTool,
  testWorkflowTool,
  generateTestDataTool,
} from "./workflow";

// Integration tools
import {
  sendEmailTool,
  sendSlackMessageTool,
  callWebhookTool,
  sendDiscordWebhookTool,
  sendTeamsMessageTool,
  listUserIntegrationsTool,
  checkRequiredIntegrationsTool,
} from "./integrations";

/**
 * All Tambo tools registered for use within the application.
 * Each tool is defined with its name, description, and expected props.
 * The tools can be controlled by AI to dynamically fetch data based on user interactions.
 */
export const tools: TamboTool[] = [
  // Population stats tools
  populationStatsTool,
  globalPopulationTool,

  // Core Workflow tools
  createWorkflowTool,
  executeWorkflowTool,
  updateWorkflowTool,
  getCurrentWorkflowTool,
  analyzeWorkflowTool,
  getWorkflowTemplates,

  // Conversational Workflow Building tools
  buildWorkflowConversationalTool,  // Main orchestration tool - use FIRST when user asks to create workflow
  validateWorkflowRequirementsTool, // Check what config is missing
  defineTriggerSchemaTool,          // Define expected trigger data fields
  configureNodeTool,                // Configure individual nodes
  batchConfigureNodesTool,          // Configure multiple nodes at once
  testWorkflowTool,                 // Test workflow with sample data
  generateTestDataTool,             // Generate sample test data

  // Integration tools
  sendEmailTool,
  sendSlackMessageTool,
  callWebhookTool,
  sendDiscordWebhookTool,
  sendTeamsMessageTool,
  listUserIntegrationsTool,
  checkRequiredIntegrationsTool,    // Check if user has required integrations

  // Data tools
  transformDataTool,
  delayTool,
  evaluateConditionTool,
];
