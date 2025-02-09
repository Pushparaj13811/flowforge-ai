/**
 * @file workflow-validator.ts
 * @description Validate workflow configuration before execution
 */

import type { WorkflowNode, WorkflowEdge } from "@/components/flow-editor/types";

export interface ValidationError {
  nodeId?: string;
  nodeLabel?: string;
  field?: string;
  message: string;
  howToFix?: string; // Actionable guidance
  example?: string; // Code example
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate an email node configuration
 * Returns a SINGLE grouped error with all missing fields listed
 *
 * Note: Email nodes can work WITHOUT an integration using platform email (100/month free)
 * So we only require: to, subject, body fields
 */
function validateEmailNode(node: WorkflowNode): ValidationError[] {
  const config = node.data.config || {};
  const missingFields: string[] = [];
  const howToFixParts: string[] = [];
  const exampleParts: string[] = [];

  // Email integration is OPTIONAL - platform email (100/month free) is available
  // No need to validate integrationId or usePlatform - the handler will use platform email as fallback

  // Check recipient (to)
  if (!config.to || (config.to as string).trim() === "") {
    missingFields.push("recipient (to)");
    howToFixParts.push("• Fill in the 'To' field with recipient email");
    exampleParts.push("To: {{$trigger.data.email}}");
  }

  // Check subject
  if (!config.subject || (config.subject as string).trim() === "") {
    missingFields.push("subject");
    howToFixParts.push("• Fill in the 'Subject' field");
    exampleParts.push("Subject: 'Order {{$trigger.data.orderId}} confirmed'");
  }

  // Check body
  if (!config.body || (config.body as string).trim() === "") {
    missingFields.push("body");
    howToFixParts.push("• Fill in the 'Body' field with your email content");
    exampleParts.push("Body: 'Hello {{$trigger.data.name}}...'");
  }

  // Return single grouped error if there are missing fields
  if (missingFields.length > 0) {
    return [{
      nodeId: node.id,
      nodeLabel: node.data.label,
      field: "email-config",
      message: `Missing required fields: ${missingFields.join(", ")}`,
      howToFix: `Click the "${node.data.label}" node and complete:\n${howToFixParts.join("\n")}`,
      example: exampleParts.join(" | "),
    }];
  }

  return [];
}

/**
 * Validate a Slack node configuration
 * Returns a SINGLE grouped error with all missing fields listed
 */
function validateSlackNode(node: WorkflowNode): ValidationError[] {
  const config = node.data.config || {};
  const missingFields: string[] = [];
  const howToFixParts: string[] = [];
  const exampleParts: string[] = [];

  // Check if integration is selected
  if (!config.integrationId) {
    missingFields.push("Slack integration");
    howToFixParts.push("• Select a Slack integration from the dropdown (or add one in Settings → Integrations)");
    exampleParts.push("Connect your Slack workspace first");
  }

  // Check message
  if (!config.message || (config.message as string).trim() === "") {
    missingFields.push("message");
    howToFixParts.push("• Fill in the 'Message' field with content to send");
    exampleParts.push("Message: 'New order {{$trigger.data.orderId}} received!'");
  }

  // Check channel
  if (!config.channel || (config.channel as string).trim() === "") {
    missingFields.push("channel");
    howToFixParts.push("• Fill in the 'Channel' field with your Slack channel");
    exampleParts.push("Channel: #orders, #notifications, or #general");
  }

  // Return single grouped error if there are missing fields
  if (missingFields.length > 0) {
    return [{
      nodeId: node.id,
      nodeLabel: node.data.label,
      field: "slack-config",
      message: `Missing required fields: ${missingFields.join(", ")}`,
      howToFix: `Click the "${node.data.label}" node and complete the following:\n${howToFixParts.join("\n")}`,
      example: exampleParts.join(" | "),
    }];
  }

  return [];
}

/**
 * Validate a Discord node configuration
 * Returns a SINGLE grouped error with all missing fields listed
 */
function validateDiscordNode(node: WorkflowNode): ValidationError[] {
  const config = node.data.config || {};
  const missingFields: string[] = [];
  const howToFixParts: string[] = [];

  // Check if integration is selected
  if (!config.integrationId) {
    missingFields.push("Discord integration");
    howToFixParts.push("• Select a Discord webhook integration from the dropdown");
  }

  // Check message
  if (!config.message || (config.message as string).trim() === "") {
    missingFields.push("message");
    howToFixParts.push("• Fill in the 'Message' field with content to send");
  }

  // Return single grouped error if there are missing fields
  if (missingFields.length > 0) {
    return [{
      nodeId: node.id,
      nodeLabel: node.data.label,
      field: "discord-config",
      message: `Missing required fields: ${missingFields.join(", ")}`,
      howToFix: `Click the "${node.data.label}" node and complete:\n${howToFixParts.join("\n")}`,
      example: "Message: '🎉 New order {{$trigger.data.orderId}} - ${{$trigger.data.amount}}'",
    }];
  }

  return [];
}

/**
 * Validate an HTTP Request node configuration
 * Returns a SINGLE grouped error with all missing fields listed
 */
function validateHTTPNode(node: WorkflowNode): ValidationError[] {
  const config = node.data.config || {};
  const missingFields: string[] = [];
  const howToFixParts: string[] = [];
  let urlFormatError = false;

  // Check URL
  if (!config.url || (config.url as string).trim() === "") {
    missingFields.push("URL");
    howToFixParts.push("• Fill in the 'URL' field with the API endpoint");
  } else {
    // Validate URL format (only if URL is provided)
    try {
      new URL(config.url as string);
    } catch {
      urlFormatError = true;
    }
  }

  // Check method
  if (!config.method) {
    missingFields.push("HTTP method");
    howToFixParts.push("• Select an HTTP method (GET, POST, PUT, DELETE, PATCH)");
  }

  // Return URL format error separately if that's the only issue
  if (urlFormatError && missingFields.length === 0) {
    return [{
      nodeId: node.id,
      nodeLabel: node.data.label,
      field: "url",
      message: "Invalid URL format",
      howToFix: "Make sure the URL starts with http:// or https:// and is properly formatted",
      example: "Valid format: https://api.example.com/endpoint",
    }];
  }

  // Return single grouped error if there are missing fields
  if (missingFields.length > 0) {
    if (urlFormatError) {
      missingFields.push("valid URL format");
      howToFixParts.push("• Fix URL format (must start with http:// or https://)");
    }
    return [{
      nodeId: node.id,
      nodeLabel: node.data.label,
      field: "http-config",
      message: `Missing required fields: ${missingFields.join(", ")}`,
      howToFix: `Click the "${node.data.label}" node and complete:\n${howToFixParts.join("\n")}`,
      example: "URL: https://api.example.com/orders | Method: POST",
    }];
  }

  return [];
}

/**
 * Validate a Condition node configuration
 * The UI uses field/operator/value pattern, NOT a single condition string
 */
function validateConditionNode(node: WorkflowNode): ValidationError[] {
  const config = node.data.config || {};
  const missingFields: string[] = [];
  const howToFixParts: string[] = [];

  // Check field (the variable to compare)
  const hasField = config.field && (config.field as string).trim() !== "";
  if (!hasField) {
    missingFields.push("field");
    howToFixParts.push("• Select a variable to compare (e.g., $trigger.data.amount)");
  }

  // Check operator
  const hasOperator = config.operator && (config.operator as string).trim() !== "";
  if (!hasOperator) {
    missingFields.push("operator");
    howToFixParts.push("• Select a comparison operator (equals, greater than, less than, etc.)");
  }

  // Check value (can be 0 or false which are valid, so only check for undefined/null/empty string)
  const hasValue = config.value !== undefined && config.value !== null && config.value !== "";
  if (!hasValue) {
    missingFields.push("value");
    howToFixParts.push("• Enter the value to compare against");
  }

  // Return single grouped error if there are missing fields
  if (missingFields.length > 0) {
    return [{
      nodeId: node.id,
      nodeLabel: node.data.label,
      field: "condition-config",
      message: `Condition incomplete: missing ${missingFields.join(", ")}`,
      howToFix: `Click the "${node.data.label}" node and complete:\n${howToFixParts.join("\n")}`,
      example: "Example: Field = '$trigger.data.amount' | Operator = 'greater than' | Value = '100'",
    }];
  }

  return [];
}

/**
 * Validate a Delay node configuration
 * Returns a SINGLE grouped error with all missing fields listed
 */
function validateDelayNode(node: WorkflowNode): ValidationError[] {
  const config = node.data.config || {};
  const missingFields: string[] = [];
  const howToFixParts: string[] = [];

  // Check duration
  if (!config.duration || config.duration === 0) {
    missingFields.push("duration");
    howToFixParts.push("• Enter a number greater than 0 in the 'Duration' field");
  }

  // Check unit
  if (!config.unit) {
    missingFields.push("time unit");
    howToFixParts.push("• Select a time unit (seconds, minutes, hours, days)");
  }

  // Return single grouped error if there are missing fields
  if (missingFields.length > 0) {
    return [{
      nodeId: node.id,
      nodeLabel: node.data.label,
      field: "delay-config",
      message: `Missing required fields: ${missingFields.join(", ")}`,
      howToFix: `Click the "${node.data.label}" node and complete:\n${howToFixParts.join("\n")}`,
      example: "Duration: 5 | Unit: minutes → Wait 5 minutes before next step",
    }];
  }

  return [];
}

/**
 * Validate a single node based on its type
 */
function validateNode(node: WorkflowNode): ValidationError[] {
  const label = (node.data.label || "").toLowerCase();
  const icon = (node.data.icon || "").toLowerCase();

  // Email nodes
  if (label.includes("email") || label.includes("mail") || icon === "mail") {
    return validateEmailNode(node);
  }

  // Slack nodes
  if (label.includes("slack") || icon === "message-square" || icon === "slack") {
    return validateSlackNode(node);
  }

  // Discord nodes
  if (label.includes("discord")) {
    return validateDiscordNode(node);
  }

  // HTTP Request nodes
  if (label.includes("http") || label.includes("api") || icon === "globe") {
    return validateHTTPNode(node);
  }

  // Condition nodes
  if (node.data.nodeType === "condition") {
    return validateConditionNode(node);
  }

  // Delay nodes
  if (node.data.nodeType === "delay") {
    return validateDelayNode(node);
  }

  // Trigger nodes - basic validation
  if (node.data.nodeType === "trigger") {
    // Triggers are validated separately (webhook URLs, schedules, etc.)
    return [];
  }

  return [];
}

/**
 * Validate entire workflow
 */
export function validateWorkflow(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): ValidationResult {
  const errors: ValidationError[] = [];

  // 1. Check if workflow has at least one trigger node
  const triggerNodes = nodes.filter((n) => n.data?.nodeType === "trigger");
  if (triggerNodes.length === 0) {
    errors.push({
      message: "Workflow must have at least one trigger node",
      howToFix: "Click 'Add Node' button → Select a trigger type (Webhook, Form Submit, or Schedule)",
      example: "Triggers start your workflow. Add a Webhook trigger to start workflow when external events occur, or Schedule trigger to run on a timer.",
    });
  }

  // 2. Check if workflow has at least one action node
  const actionNodes = nodes.filter((n) => n.data?.nodeType === "action");
  if (actionNodes.length === 0) {
    errors.push({
      message: "Workflow must have at least one action node",
      howToFix: "Click 'Add Node' button → Select an action (Email, Slack, Discord, or HTTP Request)",
      example: "Actions perform tasks like sending emails, posting messages, or calling APIs. Connect them to your trigger to automate tasks.",
    });
  }

  // 3. Check if nodes are connected (if multiple nodes exist)
  if (nodes.length > 1 && edges.length === 0) {
    errors.push({
      message: "Nodes must be connected with edges",
      howToFix: "Drag from the bottom circle of one node to the top circle of another node to create a connection",
      example: "Connect your Webhook trigger to an Email action to send an email when the webhook is called.",
    });
  }

  // 4. Check for orphaned nodes (nodes with no connections)
  if (nodes.length > 1) {
    const connectedNodeIds = new Set<string>();
    edges.forEach((edge) => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });

    const orphanedNodes = nodes.filter((node) => !connectedNodeIds.has(node.id));
    orphanedNodes.forEach((node) => {
      errors.push({
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: `Node "${node.data.label}" is not connected to the workflow`,
        howToFix: "Drag from another node's output (bottom circle) to this node's input (top circle) to connect it",
        example: "All nodes must be connected to trigger or other nodes to be part of the workflow execution flow.",
      });
    });
  }

  // 5. Validate each action node's configuration
  const nodesToValidate = nodes.filter(
    (n) => n.data?.nodeType === "action" || n.data?.nodeType === "condition" || n.data?.nodeType === "delay"
  );

  nodesToValidate.forEach((node) => {
    const nodeErrors = validateNode(node);
    errors.push(...nodeErrors);
  });

  // 6. Check condition nodes have both YES and NO branches
  const conditionNodes = nodes.filter((n) => n.data?.nodeType === "condition");
  conditionNodes.forEach((condNode) => {
    const outgoingEdges = edges.filter((e) => e.source === condNode.id);
    const hasYes = outgoingEdges.some((e) => e.sourceHandle === "yes");
    const hasNo = outgoingEdges.some((e) => e.sourceHandle === "no");

    if (!hasYes && !hasNo) {
      errors.push({
        nodeId: condNode.id,
        nodeLabel: condNode.data.label,
        message: "Condition node must have at least one output branch (YES or NO)",
        howToFix: "Drag from the green 'YES' handle or red 'NO' handle at the bottom of the condition node to another node",
        example: "Connect YES branch to actions that run when condition is true, and NO branch to actions when condition is false.",
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
