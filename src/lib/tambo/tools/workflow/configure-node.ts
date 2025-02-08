/**
 * @file configure-node.ts
 * @description Tool for incrementally configuring workflow nodes
 */

import { z } from "zod";
import type { TamboTool } from "@tambo-ai/react";
import { getNodeRequirements, type FieldPrompt } from "../../schemas/node-requirements";
import { determineHandlerType } from "@/lib/execution/handler-types";

/**
 * Configure Node Tool
 * Takes partial configuration and returns what's still missing
 */
export const configureNodeTool: TamboTool = {
  name: "configureNode",
  description: `Configure a workflow node incrementally and check what's still needed.

Use this to:
- Accept partial configuration from user responses
- Validate config against node requirements
- Return remaining required fields with prompts
- Build node config conversationally

This enables collecting node configuration one field at a time through conversation.`,

  tool: async (input: {
    nodeType: string;
    nodeLabel?: string;
    icon?: string;
    currentConfigJson: string;
    newValuesJson?: string;
  }) => {
    const { nodeType, nodeLabel, icon, currentConfigJson, newValuesJson } = input;

    // Parse JSON inputs
    const currentConfig = JSON.parse(currentConfigJson || "{}") as Record<string, unknown>;
    const newValues = newValuesJson ? JSON.parse(newValuesJson) as Record<string, unknown> : {};

    // Merge current config with new values
    const mergedConfig = { ...currentConfig, ...newValues };

    // Determine handler type
    const handlerType = determineHandlerType({
      nodeType,
      label: nodeLabel,
      icon,
      config: mergedConfig,
    });

    // Get requirements for this handler
    const requirements = getNodeRequirements(handlerType);

    if (!requirements) {
      return {
        success: true,
        isComplete: true,
        config: mergedConfig,
        handlerType,
        message: "No specific configuration required for this node type",
        missingFields: [],
        nextField: null,
      };
    }

    // Check which required fields are still missing
    const missingFields: Array<{
      field: string;
      prompt: FieldPrompt;
      isIntegration: boolean;
    }> = [];

    for (const field of requirements.required) {
      const value = mergedConfig[field];
      if (value === undefined || value === null || value === "") {
        const prompt = requirements.prompts[field];
        if (prompt) {
          missingFields.push({
            field,
            prompt,
            isIntegration: field === "integrationId",
          });
        }
      }
    }

    const isComplete = missingFields.length === 0;
    const nextField = missingFields[0] || null;

    // Generate configuration summary
    const configuredFields = Object.entries(mergedConfig)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key]) => key);

    return {
      success: true,
      isComplete,
      configJson: JSON.stringify(mergedConfig),
      handlerType,
      requirements: {
        required: requirements.required,
        optional: requirements.optional || [],
        integrationRequired: requirements.integrationRequired,
        platformFallback: requirements.platformFallback,
      },
      configuredFields,
      missingFields: missingFields.map((mf) => ({
        field: mf.field,
        question: mf.prompt.question,
        type: mf.prompt.type,
        placeholder: mf.prompt.placeholder,
        supportsVariables: mf.prompt.supportsVariables,
        helpText: mf.prompt.helpText,
        options: mf.prompt.options,
        defaultValue: mf.prompt.defaultValue,
        isIntegration: mf.isIntegration,
      })),
      nextField: nextField
        ? {
            field: nextField.field,
            question: nextField.prompt.question,
            type: nextField.prompt.type,
            placeholder: nextField.prompt.placeholder,
            supportsVariables: nextField.prompt.supportsVariables,
            helpText: nextField.prompt.helpText,
            options: nextField.prompt.options,
            defaultValue: nextField.prompt.defaultValue,
          }
        : null,
      message: isComplete
        ? `${nodeLabel || handlerType} is fully configured!`
        : `${missingFields.length} field${missingFields.length > 1 ? "s" : ""} still needed: ${missingFields.map((f) => f.field).join(", ")}`,
    };
  },

  inputSchema: z.object({
    nodeType: z.string().describe("Type of node (action, condition, delay, etc.)"),
    nodeLabel: z.string().optional().describe("Node label for handler type detection"),
    icon: z.string().optional().describe("Node icon for handler type detection"),
    currentConfigJson: z.string().describe("Current configuration values as JSON string"),
    newValuesJson: z.string().optional().describe("New values to merge into config as JSON string"),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    isComplete: z.boolean().describe("Whether all required fields are configured"),
    configJson: z.string().describe("Complete merged configuration as JSON string"),
    handlerType: z.string().describe("Detected handler type"),
    requirements: z.object({
      required: z.array(z.string()),
      optional: z.array(z.string()),
      integrationRequired: z.string().optional(),
      platformFallback: z.boolean().optional(),
    }).optional(),
    configuredFields: z.array(z.string()).describe("Fields that have values"),
    missingFields: z.array(z.object({
      field: z.string(),
      question: z.string(),
      type: z.string(),
      placeholder: z.string().optional(),
      supportsVariables: z.boolean().optional(),
      helpText: z.string().optional(),
      options: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
      defaultValue: z.any().optional(),
      isIntegration: z.boolean(),
    })),
    nextField: z.object({
      field: z.string(),
      question: z.string(),
      type: z.string(),
      placeholder: z.string().optional(),
      supportsVariables: z.boolean().optional(),
      helpText: z.string().optional(),
      options: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
      defaultValue: z.any().optional(),
    }).nullable().describe("Next field to ask about"),
    message: z.string(),
  }),
};

/**
 * Batch configure multiple nodes
 */
export const batchConfigureNodesTool: TamboTool = {
  name: "batchConfigureNodes",
  description: `Configure multiple nodes at once and get overall status.

Use this when creating a complete workflow to:
- Check all nodes have required configuration
- Get a summary of what's missing across all nodes
- Prioritize configuration collection`,

  tool: async (input: {
    nodes: Array<{
      nodeId: string;
      nodeType: string;
      nodeLabel?: string;
      icon?: string;
      configJson: string;
    }>;
  }) => {
    const { nodes } = input;
    const results: Array<{
      nodeId: string;
      nodeLabel: string;
      handlerType: string;
      isComplete: boolean;
      missingCount: number;
      missingFields: string[];
    }> = [];

    let totalMissing = 0;
    let completeCount = 0;

    for (const node of nodes) {
      const config = JSON.parse(node.configJson || "{}") as Record<string, unknown>;
      const handlerType = determineHandlerType({
        nodeType: node.nodeType,
        label: node.nodeLabel,
        icon: node.icon,
        config,
      });

      const requirements = getNodeRequirements(handlerType);
      const missingFields: string[] = [];

      if (requirements) {
        for (const field of requirements.required) {
          const value = config?.[field];
          if (value === undefined || value === null || value === "") {
            missingFields.push(field);
          }
        }
      }

      const isComplete = missingFields.length === 0;
      if (isComplete) completeCount++;
      totalMissing += missingFields.length;

      results.push({
        nodeId: node.nodeId,
        nodeLabel: node.nodeLabel || handlerType,
        handlerType,
        isComplete,
        missingCount: missingFields.length,
        missingFields,
      });
    }

    const allComplete = completeCount === nodes.length;

    return {
      success: true,
      allComplete,
      completeCount,
      totalNodes: nodes.length,
      totalMissingFields: totalMissing,
      nodes: results,
      summary: allComplete
        ? "All nodes are fully configured!"
        : `${completeCount}/${nodes.length} nodes complete, ${totalMissing} fields still needed`,
    };
  },

  inputSchema: z.object({
    nodes: z.array(z.object({
      nodeId: z.string(),
      nodeType: z.string(),
      nodeLabel: z.string().optional(),
      icon: z.string().optional(),
      configJson: z.string().describe("Node configuration as JSON string"),
    })),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    allComplete: z.boolean(),
    completeCount: z.number(),
    totalNodes: z.number(),
    totalMissingFields: z.number(),
    nodes: z.array(z.object({
      nodeId: z.string(),
      nodeLabel: z.string(),
      handlerType: z.string(),
      isComplete: z.boolean(),
      missingCount: z.number(),
      missingFields: z.array(z.string()),
    })),
    summary: z.string(),
  }),
};
