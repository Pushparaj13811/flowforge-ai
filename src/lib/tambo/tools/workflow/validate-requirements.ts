/**
 * @file validate-requirements.ts
 * @description Pre-flight validation tool to check what information is needed for a complete workflow
 */

import { z } from "zod";
import type { TamboTool } from "@tambo-ai/react";
import { getApiUrl } from "../../utils";
import {
  NODE_REQUIREMENTS,
  getNodeRequirements,
  type NodeRequirements,
  type FieldPrompt,
} from "../../schemas/node-requirements";
import { determineHandlerType } from "@/lib/execution/handler-types";

/**
 * Schema for a node to validate
 */
const nodeToValidateSchema = z.object({
  id: z.string(),
  type: z.enum(["trigger", "action", "condition", "delay", "loop"]),
  label: z.string().optional(),
  icon: z.string().optional(),
  configJson: z.string().optional().describe("Node configuration as JSON string"),
});

/**
 * Schema for a missing requirement
 */
const missingRequirementSchema = z.object({
  nodeId: z.string(),
  nodeLabel: z.string(),
  nodeType: z.string(),
  handlerType: z.string(),
  field: z.string(),
  prompt: z.object({
    question: z.string(),
    type: z.string(),
    placeholder: z.string().optional(),
    supportsVariables: z.boolean().optional(),
    helpText: z.string().optional(),
    options: z.array(z.object({
      value: z.string(),
      label: z.string(),
    })).optional(),
    defaultValue: z.any().optional(),
  }),
  isIntegration: z.boolean(),
});

/**
 * Schema for missing integration
 */
const missingIntegrationSchema = z.object({
  nodeId: z.string(),
  nodeLabel: z.string(),
  integrationType: z.string(),
  platformFallback: z.boolean(),
});

export type MissingRequirement = z.infer<typeof missingRequirementSchema>;
export type MissingIntegration = z.infer<typeof missingIntegrationSchema>;

/**
 * Validate workflow requirements tool
 */
export const validateWorkflowRequirementsTool: TamboTool = {
  name: "validateWorkflowRequirements",
  description: `Check what information is needed to create a complete, ready-to-execute workflow.

Use this BEFORE creating a workflow to:
- Identify what configuration each node needs
- Check which integrations are required
- Get the questions to ask the user for each missing field
- Ensure the workflow will execute successfully

Returns:
- ready: true if workflow has all required configuration
- missing: Array of missing fields with questions to ask
- missingIntegrations: Integrations that need to be connected
- summary: Human-readable summary of what's needed`,

  tool: async (input: {
    nodes: z.infer<typeof nodeToValidateSchema>[];
    checkIntegrations?: boolean;
  }) => {
    const { nodes, checkIntegrations = true } = input;

    const missingRequirements: MissingRequirement[] = [];
    const missingIntegrations: MissingIntegration[] = [];
    const nodesSummary: Array<{ nodeId: string; nodeLabel: string; status: string }> = [];

    // Fetch user's integrations if we need to check them
    let userIntegrations: Array<{ id: string; type: string; name: string; isActive: boolean }> = [];
    if (checkIntegrations) {
      try {
        const response = await fetch(getApiUrl("/api/integrations"), {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          userIntegrations = data.integrations || [];
        }
      } catch {
        // If we can't fetch integrations, continue without checking
      }
    }

    for (const node of nodes) {
      const nodeLabel = node.label || `${node.type} node`;
      const config = node.configJson ? JSON.parse(node.configJson) as Record<string, unknown> : {};

      // Determine the specific handler type
      const handlerType = determineHandlerType({
        nodeType: node.type,
        label: node.label,
        icon: node.icon,
        config,
      });

      const requirements = getNodeRequirements(handlerType);

      if (!requirements) {
        // No specific requirements defined - node is ready
        nodesSummary.push({
          nodeId: node.id,
          nodeLabel,
          status: "ready",
        });
        continue;
      }
      let nodeMissing: string[] = [];

      // Check required fields
      for (const field of requirements.required) {
        const value = config[field];
        if (value === undefined || value === null || value === "") {
          nodeMissing.push(field);

          const prompt = requirements.prompts[field];
          if (prompt) {
            missingRequirements.push({
              nodeId: node.id,
              nodeLabel,
              nodeType: node.type,
              handlerType,
              field,
              prompt: {
                question: prompt.question,
                type: prompt.type,
                placeholder: prompt.placeholder,
                supportsVariables: prompt.supportsVariables,
                helpText: prompt.helpText,
                options: prompt.options,
                defaultValue: prompt.defaultValue,
              },
              isIntegration: field === "integrationId",
            });
          }
        }
      }

      // Check integration requirement
      if (requirements.integrationRequired && checkIntegrations) {
        const hasIntegration = userIntegrations.some(
          (i) => i.type === requirements.integrationRequired && i.isActive
        );

        if (!hasIntegration && !requirements.platformFallback) {
          missingIntegrations.push({
            nodeId: node.id,
            nodeLabel,
            integrationType: requirements.integrationRequired,
            platformFallback: false,
          });
        } else if (!hasIntegration && requirements.platformFallback) {
          // Platform fallback available, add note but not blocking
          missingIntegrations.push({
            nodeId: node.id,
            nodeLabel,
            integrationType: requirements.integrationRequired,
            platformFallback: true,
          });
        }
      }

      // Update node summary
      nodesSummary.push({
        nodeId: node.id,
        nodeLabel,
        status: nodeMissing.length > 0 ? `missing: ${nodeMissing.join(", ")}` : "ready",
      });
    }

    // Build human-readable summary
    const ready = missingRequirements.length === 0 &&
      missingIntegrations.filter(i => !i.platformFallback).length === 0;

    let summary = "";
    if (ready) {
      summary = "All nodes are fully configured and ready to execute.";
    } else {
      const parts: string[] = [];

      if (missingRequirements.length > 0) {
        const byNode = missingRequirements.reduce((acc, req) => {
          if (!acc[req.nodeLabel]) acc[req.nodeLabel] = [];
          acc[req.nodeLabel].push(req.field);
          return acc;
        }, {} as Record<string, string[]>);

        for (const [nodeLabel, fields] of Object.entries(byNode)) {
          parts.push(`"${nodeLabel}" needs: ${fields.join(", ")}`);
        }
      }

      const blockingIntegrations = missingIntegrations.filter(i => !i.platformFallback);
      if (blockingIntegrations.length > 0) {
        const types = [...new Set(blockingIntegrations.map(i => i.integrationType))];
        parts.push(`Missing integrations: ${types.join(", ")}`);
      }

      summary = parts.join(". ");
    }

    return {
      ready,
      missing: missingRequirements,
      missingIntegrations,
      nodesSummary,
      summary,
      totalMissing: missingRequirements.length,
      totalNodes: nodes.length,
    };
  },

  inputSchema: z.object({
    nodes: z.array(nodeToValidateSchema).describe(
      "Array of workflow nodes to validate"
    ),
    checkIntegrations: z.boolean().optional().describe(
      "Whether to check if required integrations are connected (default: true)"
    ),
  }),

  outputSchema: z.object({
    ready: z.boolean().describe("Whether all nodes have complete configuration"),
    missing: z.array(missingRequirementSchema).describe(
      "Array of missing required fields with prompts"
    ),
    missingIntegrations: z.array(missingIntegrationSchema).describe(
      "Integrations that need to be connected"
    ),
    nodesSummary: z.array(z.object({
      nodeId: z.string(),
      nodeLabel: z.string(),
      status: z.string(),
    })).describe("Summary of each node's configuration status"),
    summary: z.string().describe("Human-readable summary of validation results"),
    totalMissing: z.number().describe("Total number of missing required fields"),
    totalNodes: z.number().describe("Total number of nodes validated"),
  }),
};

/**
 * Get missing configuration for a single node
 * Utility function for use by other tools
 */
export function getMissingConfigForNode(node: {
  id: string;
  type: string;
  label?: string;
  icon?: string;
  config?: Record<string, unknown>;
}): {
  handlerType: string;
  requirements: NodeRequirements | null;
  missingFields: string[];
  missingPrompts: Array<{ field: string; prompt: FieldPrompt }>;
} {
  const handlerType = determineHandlerType({
    nodeType: node.type,
    label: node.label,
    icon: node.icon,
    config: node.config,
  });

  const requirements = getNodeRequirements(handlerType);

  if (!requirements) {
    return {
      handlerType,
      requirements: null,
      missingFields: [],
      missingPrompts: [],
    };
  }

  const config = node.config || {};
  const missingFields: string[] = [];
  const missingPrompts: Array<{ field: string; prompt: FieldPrompt }> = [];

  for (const field of requirements.required) {
    const value = config[field];
    if (value === undefined || value === null || value === "") {
      missingFields.push(field);
      const prompt = requirements.prompts[field];
      if (prompt) {
        missingPrompts.push({ field, prompt });
      }
    }
  }

  return {
    handlerType,
    requirements,
    missingFields,
    missingPrompts,
  };
}
