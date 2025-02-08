/**
 * @file build-workflow-conversational.ts
 * @description Main orchestration tool for conversational workflow building
 *
 * This tool parses natural language and EXTRACTS configuration values directly,
 * enabling workflows to be created with complete configuration from a single request.
 */

import { z } from "zod";
import type { TamboTool } from "@tambo-ai/react";
import { getApiUrl } from "../../utils";
import { NODE_REQUIREMENTS, getNodeRequirements } from "../../schemas/node-requirements";

/**
 * Extract configuration values from natural language
 * This is the KEY function that enables proper workflow configuration
 */
function extractConfigValues(intent: string): {
  emails: string[];
  channels: string[];
  webhookUrls: string[];
  amounts: { value: number; context: string }[];
  subjects: string[];
  messages: string[];
  conditions: Array<{ field: string; operator: string; value: string }>;
  durations: Array<{ duration: number; unit: string }>;
} {
  const emails: string[] = [];
  const channels: string[] = [];
  const webhookUrls: string[] = [];
  const amounts: { value: number; context: string }[] = [];
  const subjects: string[] = [];
  const messages: string[] = [];
  const conditions: Array<{ field: string; operator: string; value: string }> = [];
  const durations: Array<{ duration: number; unit: string }> = [];

  // Extract email addresses
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
  const emailMatches = intent.match(emailRegex);
  if (emailMatches) {
    emails.push(...emailMatches);
  }

  // Extract Slack channels (e.g., #general, #sales)
  const channelRegex = /#[\w-]+/g;
  const channelMatches = intent.match(channelRegex);
  if (channelMatches) {
    channels.push(...channelMatches);
  }

  // Extract webhook URLs
  const urlRegex = /https?:\/\/[^\s"']+/g;
  const urlMatches = intent.match(urlRegex);
  if (urlMatches) {
    webhookUrls.push(...urlMatches);
  }

  // Extract amounts with $ prefix (e.g., $100, $50.00)
  const amountRegex = /\$[\d,]+(?:\.\d{2})?/g;
  const amountMatches = intent.match(amountRegex);
  if (amountMatches) {
    amountMatches.forEach((match) => {
      const value = parseFloat(match.replace(/[$,]/g, ""));
      // Find context around the amount
      const idx = intent.indexOf(match);
      const context = intent.substring(Math.max(0, idx - 30), idx + match.length + 30);
      amounts.push({ value, context });
    });
  }

  // Extract quoted strings (likely subjects or messages)
  const quotedRegex = /["']([^"']+)["']/g;
  let quotedMatch;
  while ((quotedMatch = quotedRegex.exec(intent)) !== null) {
    const text = quotedMatch[1];
    // Determine if it's likely a subject or message based on context
    const beforeQuote = intent.substring(0, quotedMatch.index).toLowerCase();
    if (beforeQuote.includes("subject")) {
      subjects.push(text);
    } else if (beforeQuote.includes("message") || beforeQuote.includes("say") || beforeQuote.includes("body")) {
      messages.push(text);
    } else {
      // Default to subject if shorter, message if longer
      if (text.length < 60) {
        subjects.push(text);
      } else {
        messages.push(text);
      }
    }
  }

  // Extract conditions (e.g., "if amount is over $100", "when order exceeds $50")
  const conditionPatterns = [
    /(?:if|when)\s+(\w+)\s+(?:is\s+)?(?:over|greater than|more than|above|exceeds?)\s+\$?([\d,]+)/gi,
    /(?:if|when)\s+(\w+)\s+(?:is\s+)?(?:under|less than|below)\s+\$?([\d,]+)/gi,
    /(?:if|when)\s+(\w+)\s+(?:equals?|is)\s+["']?([^"'\s]+)["']?/gi,
  ];

  conditionPatterns.forEach((pattern, idx) => {
    let match;
    while ((match = pattern.exec(intent)) !== null) {
      const field = match[1];
      const value = match[2].replace(/,/g, "");
      let operator = "equals";
      if (idx === 0) operator = "greater_than";
      if (idx === 1) operator = "less_than";
      conditions.push({ field: `$trigger.data.${field}`, operator, value });
    }
  });

  // Extract durations (e.g., "wait 5 minutes", "delay for 1 hour")
  const durationRegex = /(?:wait|delay)(?:\s+for)?\s+(\d+)\s*(second|minute|hour|day)s?/gi;
  let durationMatch;
  while ((durationMatch = durationRegex.exec(intent)) !== null) {
    durations.push({
      duration: parseInt(durationMatch[1], 10),
      unit: durationMatch[2].toLowerCase() + "s",
    });
  }

  return { emails, channels, webhookUrls, amounts, subjects, messages, conditions, durations };
}

/**
 * Parse user intent to identify workflow structure
 */
function parseWorkflowIntent(intent: string): {
  triggerType: string;
  triggerDescription: string;
  actions: Array<{ type: string; description: string; extractedConfig?: Record<string, unknown> }>;
  hasConditions: boolean;
  estimatedNodes: number;
  extractedValues: ReturnType<typeof extractConfigValues>;
  conditionConfig?: { field: string; operator: string; value: string };
} {
  const intentLower = intent.toLowerCase();
  const extractedValues = extractConfigValues(intent);

  // Detect trigger type
  let triggerType = "webhook";
  let triggerDescription = "Webhook trigger";

  if (intentLower.includes("form") || intentLower.includes("submit")) {
    triggerType = "form";
    triggerDescription = "Form submission trigger";
  } else if (intentLower.includes("schedule") || intentLower.includes("every") || intentLower.includes("daily") || intentLower.includes("weekly")) {
    triggerType = "schedule";
    triggerDescription = "Scheduled trigger";
  } else if (intentLower.includes("manual")) {
    triggerType = "manual";
    triggerDescription = "Manual trigger";
  }

  // Detect actions WITH extracted configuration
  const actions: Array<{ type: string; description: string; extractedConfig?: Record<string, unknown> }> = [];
  let emailIndex = 0;
  let channelIndex = 0;

  if (intentLower.includes("email") || intentLower.includes("mail")) {
    // Build email config from extracted values
    const emailConfig: Record<string, string> = {};

    // Assign email recipient if available
    if (extractedValues.emails.length > emailIndex) {
      emailConfig.to = extractedValues.emails[emailIndex];
      emailIndex++;
    }

    // Assign subject if available
    if (extractedValues.subjects.length > 0) {
      emailConfig.subject = extractedValues.subjects[0];
    }

    // Assign message/body if available
    if (extractedValues.messages.length > 0) {
      emailConfig.body = extractedValues.messages[0];
    }

    const description = emailConfig.to
      ? `Send email to ${emailConfig.to}`
      : "Send email";

    actions.push({
      type: "email:resend",
      description,
      extractedConfig: Object.keys(emailConfig).length > 0 ? emailConfig : undefined,
    });
  }

  if (intentLower.includes("slack")) {
    const slackConfig: Record<string, string> = {};

    // Assign channel if available
    if (extractedValues.channels.length > channelIndex) {
      slackConfig.channel = extractedValues.channels[channelIndex];
      channelIndex++;
    }

    // Use remaining message for Slack
    const messageIdx = actions.filter((a) => a.type === "email:resend").length;
    if (extractedValues.messages.length > messageIdx) {
      slackConfig.message = extractedValues.messages[messageIdx];
    }

    const description = slackConfig.channel
      ? `Send Slack message to ${slackConfig.channel}`
      : "Send Slack message";

    actions.push({
      type: "slack:send-message",
      description,
      extractedConfig: Object.keys(slackConfig).length > 0 ? slackConfig : undefined,
    });
  }

  if (intentLower.includes("discord")) {
    const discordConfig: Record<string, string> = {};
    if (extractedValues.webhookUrls.length > 0) {
      discordConfig.webhookUrl = extractedValues.webhookUrls[0];
    }
    actions.push({
      type: "discord:webhook",
      description: "Send Discord message",
      extractedConfig: Object.keys(discordConfig).length > 0 ? discordConfig : undefined,
    });
  }

  if (intentLower.includes("teams")) {
    const teamsConfig: Record<string, string> = {};
    if (extractedValues.webhookUrls.length > 0) {
      teamsConfig.webhookUrl = extractedValues.webhookUrls[0];
    }
    actions.push({
      type: "teams:webhook",
      description: "Send Teams message",
      extractedConfig: Object.keys(teamsConfig).length > 0 ? teamsConfig : undefined,
    });
  }

  if (intentLower.includes("sms") || intentLower.includes("text")) {
    actions.push({ type: "twilio:send-sms", description: "Send SMS" });
  }

  if (intentLower.includes("sheet") || intentLower.includes("spreadsheet")) {
    actions.push({ type: "google-sheets:append", description: "Update Google Sheets" });
  }

  if (intentLower.includes("stripe") || intentLower.includes("payment") || intentLower.includes("charge")) {
    actions.push({ type: "stripe:create-payment-intent", description: "Process payment" });
  }

  if (intentLower.includes("webhook") || intentLower.includes("http") || intentLower.includes("api")) {
    const httpConfig: Record<string, string> = {};
    if (extractedValues.webhookUrls.length > 0) {
      httpConfig.url = extractedValues.webhookUrls[0];
      httpConfig.method = "POST";
    }
    actions.push({
      type: "http:request",
      description: "Call HTTP API",
      extractedConfig: Object.keys(httpConfig).length > 0 ? httpConfig : undefined,
    });
  }

  if (intentLower.includes("openai") || intentLower.includes("gpt") || intentLower.includes("ai generate")) {
    actions.push({ type: "openai:chat", description: "Generate with OpenAI" });
  }

  if (intentLower.includes("claude") || intentLower.includes("anthropic")) {
    actions.push({ type: "anthropic:claude", description: "Generate with Claude" });
  }

  // Detect conditions and extract condition config
  const hasConditions = intentLower.includes("if ") ||
    intentLower.includes("when ") ||
    intentLower.includes("condition") ||
    intentLower.includes("otherwise") ||
    intentLower.includes("over $") ||
    intentLower.includes("more than") ||
    intentLower.includes("less than");

  // Use first extracted condition or derive from amounts
  let conditionConfig: { field: string; operator: string; value: string } | undefined;
  if (hasConditions) {
    if (extractedValues.conditions.length > 0) {
      conditionConfig = extractedValues.conditions[0];
    } else if (extractedValues.amounts.length > 0) {
      // Derive condition from amount context
      const amount = extractedValues.amounts[0];
      const context = amount.context.toLowerCase();
      const operator = context.includes("under") || context.includes("less") || context.includes("below")
        ? "less_than"
        : "greater_than";
      conditionConfig = {
        field: "$trigger.data.amount",
        operator,
        value: String(amount.value),
      };
    }
  }

  // Estimate node count
  const estimatedNodes = 1 + actions.length + (hasConditions ? 1 : 0);

  return {
    triggerType,
    triggerDescription,
    actions,
    hasConditions,
    estimatedNodes,
    extractedValues,
    conditionConfig,
  };
}

/**
 * Build Workflow Conversationally Tool
 */
export const buildWorkflowConversationalTool: TamboTool = {
  name: "buildWorkflowConversational",
  description: `Analyze a workflow request and identify what questions to ask the user.

Use this tool to understand what the user wants and what information you need to collect. It returns:
- parsedIntent: What type of workflow the user wants
- questionsToAsk: Questions you MUST ask the user before creating the workflow
- readyToCreate: false if there are missing required fields

IMPORTANT: After calling this tool, you MUST:
1. Look at the "questionsToAsk" array
2. Ask the user EACH question listed there
3. Collect their answers
4. Only call createWorkflow after ALL questions are answered

DO NOT skip asking questions and immediately create the workflow.
DO NOT use template variables like {{$trigger.data.name}} in email bodies.

Example flow:
1. User: "Create email notification workflow"
2. You call buildWorkflowConversational → returns questionsToAsk: ["Who should receive the email?", "What subject?", "What body?"]
3. You ASK the user each question
4. User provides: "john@acme.com", "New Lead", "A new lead came in..."
5. THEN you call createWorkflow with those actual values`,

  tool: async (input: {
    userIntent: string;
    existingContext?: {
      integrations?: Array<{ type: string; id: string; name: string }>;
      partialConfig?: Record<string, unknown>;
    };
  }) => {
    const { userIntent, existingContext } = input;

    // Parse the user's intent
    const parsedIntent = parseWorkflowIntent(userIntent);

    // Gather all required integrations
    const requiredIntegrations: string[] = [];
    const nodeConfigs: Array<{
      nodeId: string;
      nodeType: string;
      handlerType: string;
      label: string;
      icon: string;
      requiredFields: string[];
      optionalFields: string[];
      integrationRequired?: string;
      platformFallback?: boolean;
      prompts: Record<string, { question: string; type: string }>;
      promptsJson: string;
      // NEW: Extracted configuration from natural language
      extractedConfigJson: string;
      missingRequiredFields: string[];
    }> = [];

    // Add trigger node
    const triggerHandlerType = `trigger:${parsedIntent.triggerType}`;
    const triggerRequirements = getNodeRequirements(triggerHandlerType);
    const triggerPrompts = Object.fromEntries(
      Object.entries(triggerRequirements?.prompts || {}).map(([k, v]) => [k, { question: v.question, type: v.type }])
    );

    // Trigger nodes typically don't need config extraction
    nodeConfigs.push({
      nodeId: "trigger-1",
      nodeType: "trigger",
      handlerType: triggerHandlerType,
      label: parsedIntent.triggerDescription,
      icon: parsedIntent.triggerType === "schedule" ? "clock" : "webhook",
      requiredFields: triggerRequirements?.required || [],
      optionalFields: triggerRequirements?.optional || [],
      prompts: triggerPrompts,
      promptsJson: JSON.stringify(triggerPrompts),
      extractedConfigJson: "{}",
      missingRequiredFields: triggerRequirements?.required || [],
    });

    // Add action nodes WITH extracted config
    parsedIntent.actions.forEach((action, index) => {
      const requirements = getNodeRequirements(action.type);
      if (requirements?.integrationRequired) {
        if (!requiredIntegrations.includes(requirements.integrationRequired)) {
          requiredIntegrations.push(requirements.integrationRequired);
        }
      }

      const actionPrompts = Object.fromEntries(
        Object.entries(requirements?.prompts || {}).map(([k, v]) => [k, { question: v.question, type: v.type }])
      );

      // Use extracted config from natural language parsing
      const extractedConfig = action.extractedConfig || {};
      const extractedConfigJson = JSON.stringify(extractedConfig);

      // Determine which required fields are still missing
      const providedFields = Object.keys(extractedConfig);
      const missingRequiredFields = (requirements?.required || []).filter(
        (field) => !providedFields.includes(field) && field !== "integrationId"
      );

      nodeConfigs.push({
        nodeId: `action-${index + 1}`,
        nodeType: "action",
        handlerType: action.type,
        label: action.description,
        icon: requirements?.suggestedIcon || "sparkles",
        requiredFields: requirements?.required || [],
        optionalFields: requirements?.optional || [],
        integrationRequired: requirements?.integrationRequired,
        platformFallback: requirements?.platformFallback,
        prompts: actionPrompts,
        promptsJson: JSON.stringify(actionPrompts),
        extractedConfigJson,
        missingRequiredFields,
      });
    });

    // Add condition node if detected WITH extracted config
    if (parsedIntent.hasConditions) {
      const conditionRequirements = getNodeRequirements("condition");
      const conditionPrompts = Object.fromEntries(
        Object.entries(conditionRequirements?.prompts || {}).map(([k, v]) => [k, { question: v.question, type: v.type }])
      );

      // Use extracted condition config
      const conditionConfig = parsedIntent.conditionConfig || {};
      const extractedConfigJson = JSON.stringify(conditionConfig);

      // Determine missing fields
      const providedFields = Object.keys(conditionConfig);
      const missingRequiredFields = (conditionRequirements?.required || []).filter(
        (field) => !providedFields.includes(field)
      );

      // Update label to be more descriptive if we have config
      let conditionLabel = "Condition Check";
      if (conditionConfig && "field" in conditionConfig && "operator" in conditionConfig && "value" in conditionConfig) {
        const opLabels: Record<string, string> = {
          greater_than: ">",
          less_than: "<",
          equals: "=",
          not_equals: "≠",
        };
        const fieldName = String(conditionConfig.field).replace("$trigger.data.", "");
        conditionLabel = `If ${fieldName} ${opLabels[conditionConfig.operator as string] || conditionConfig.operator} ${conditionConfig.value}`;
      }

      nodeConfigs.push({
        nodeId: "condition-1",
        nodeType: "condition",
        handlerType: "condition",
        label: conditionLabel,
        icon: "git-branch",
        requiredFields: conditionRequirements?.required || [],
        optionalFields: conditionRequirements?.optional || [],
        prompts: conditionPrompts,
        promptsJson: JSON.stringify(conditionPrompts),
        extractedConfigJson,
        missingRequiredFields,
      });
    }

    // Check available integrations
    let availableIntegrations: Array<{ type: string; id: string; name: string }> = existingContext?.integrations || [];
    const missingIntegrations = requiredIntegrations.filter(
      (type) => !availableIntegrations.some((i) => i.type === type) &&
        !nodeConfigs.find((n) => n.integrationRequired === type)?.platformFallback
    );

    // Generate suggested workflow name
    const workflowName = generateWorkflowName(parsedIntent);

    // Build the questions to ask - ONLY for fields that are still missing after extraction
    const questionsToAsk: Array<{
      nodeId: string;
      nodeLabel: string;
      field: string;
      question: string;
      type: string;
      priority: number;
    }> = [];

    for (const node of nodeConfigs) {
      // Only ask about fields that are still missing
      for (const field of node.missingRequiredFields) {
        const prompt = node.prompts[field];
        if (prompt) {
          questionsToAsk.push({
            nodeId: node.nodeId,
            nodeLabel: node.label,
            field,
            question: prompt.question,
            type: prompt.type,
            priority: field === "integrationId" ? 1 : 2, // Ask for integrations first
          });
        }
      }
    }

    // Sort by priority
    questionsToAsk.sort((a, b) => a.priority - b.priority);

    // Determine if workflow is ready to create (all required fields filled)
    const allNodesConfigured = nodeConfigs.every((node) => node.missingRequiredFields.length === 0);

    return {
      success: true,
      parsedIntent: {
        triggerType: parsedIntent.triggerType,
        triggerDescription: parsedIntent.triggerDescription,
        actionCount: parsedIntent.actions.length,
        hasConditions: parsedIntent.hasConditions,
        estimatedNodes: parsedIntent.estimatedNodes,
      },
      suggestedName: workflowName,
      nodes: nodeConfigs,
      requiredIntegrations,
      missingIntegrations,
      hasAllIntegrations: missingIntegrations.length === 0,
      questionsToAsk,
      totalQuestionsRemaining: questionsToAsk.length,
      nextSteps: generateNextSteps(missingIntegrations, questionsToAsk, parsedIntent),
      readyToCreate: missingIntegrations.length === 0 && allNodesConfigured,
      // Summary of what was extracted
      extractionSummary: {
        emailsFound: parsedIntent.extractedValues.emails,
        channelsFound: parsedIntent.extractedValues.channels,
        amountsFound: parsedIntent.extractedValues.amounts.map((a) => a.value),
        conditionExtracted: parsedIntent.conditionConfig ? true : false,
        totalFieldsExtracted: nodeConfigs.reduce((sum, n) => {
          const config = JSON.parse(n.extractedConfigJson);
          return sum + Object.keys(config).length;
        }, 0),
      },
    };
  },

  inputSchema: z.object({
    userIntent: z.string().describe("User's description of what they want the workflow to do"),
    existingContext: z.object({
      integrations: z.array(z.object({
        type: z.string(),
        id: z.string(),
        name: z.string(),
      })).optional(),
      partialConfigJson: z.string().optional().describe("Partial configuration as JSON string"),
    }).optional(),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    parsedIntent: z.object({
      triggerType: z.string(),
      triggerDescription: z.string(),
      actionCount: z.number(),
      hasConditions: z.boolean(),
      estimatedNodes: z.number(),
    }),
    suggestedName: z.string(),
    nodes: z.array(z.object({
      nodeId: z.string(),
      nodeType: z.string(),
      handlerType: z.string(),
      label: z.string(),
      icon: z.string(),
      requiredFields: z.array(z.string()),
      optionalFields: z.array(z.string()),
      integrationRequired: z.string().optional(),
      platformFallback: z.boolean().optional(),
      promptsJson: z.string().describe("Prompts as JSON string"),
      extractedConfigJson: z.string().describe("Configuration extracted from natural language as JSON string"),
      missingRequiredFields: z.array(z.string()).describe("Required fields still missing after extraction"),
    })),
    requiredIntegrations: z.array(z.string()),
    missingIntegrations: z.array(z.string()),
    hasAllIntegrations: z.boolean(),
    questionsToAsk: z.array(z.object({
      nodeId: z.string(),
      nodeLabel: z.string(),
      field: z.string(),
      question: z.string(),
      type: z.string(),
      priority: z.number(),
    })),
    totalQuestionsRemaining: z.number(),
    nextSteps: z.array(z.string()),
    readyToCreate: z.boolean(),
    extractionSummary: z.object({
      emailsFound: z.array(z.string()),
      channelsFound: z.array(z.string()),
      amountsFound: z.array(z.number()),
      conditionExtracted: z.boolean(),
      totalFieldsExtracted: z.number(),
    }).describe("Summary of values extracted from natural language"),
  }),
};

/**
 * Generate a workflow name from parsed intent
 */
function generateWorkflowName(parsedIntent: ReturnType<typeof parseWorkflowIntent>): string {
  const actionNames = parsedIntent.actions.map((a) => a.description.replace(/^Send |^Update |^Process /, ""));
  const actionPart = actionNames.length > 0 ? actionNames.join(" + ") : "Automation";

  const triggerPart = parsedIntent.triggerType === "form" ? "Form"
    : parsedIntent.triggerType === "schedule" ? "Scheduled"
    : parsedIntent.triggerType === "manual" ? "Manual"
    : "Webhook";

  return `${triggerPart} → ${actionPart}`;
}

/**
 * Generate next steps guidance
 */
function generateNextSteps(
  missingIntegrations: string[],
  questionsToAsk: Array<{ nodeLabel: string; field: string; question: string }>,
  parsedIntent: ReturnType<typeof parseWorkflowIntent>
): string[] {
  const steps: string[] = [];

  if (missingIntegrations.length > 0) {
    steps.push(`Connect required integrations: ${missingIntegrations.join(", ")}`);
  }

  if (parsedIntent.triggerType === "webhook" || parsedIntent.triggerType === "form") {
    steps.push("Define what data the trigger will receive");
  }

  if (questionsToAsk.length > 0) {
    const groupedByNode: Record<string, string[]> = {};
    for (const q of questionsToAsk) {
      if (!groupedByNode[q.nodeLabel]) groupedByNode[q.nodeLabel] = [];
      groupedByNode[q.nodeLabel].push(q.field);
    }

    for (const [nodeLabel, fields] of Object.entries(groupedByNode)) {
      steps.push(`Configure "${nodeLabel}": ${fields.join(", ")}`);
    }
  }

  steps.push("Review and create workflow");
  steps.push("Test the workflow with sample data");

  return steps;
}
