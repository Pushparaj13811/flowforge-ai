/**
 * @file handler-types.ts
 * @description Handler type utilities - safe to import in client code
 * This file contains only pure functions that don't import any server-side modules
 */

/**
 * All supported handler types
 */
export const HANDLER_TYPES = [
  // Messaging
  'slack:send-message',
  'discord:webhook',
  'discord:send-message',
  'teams:webhook',
  'teams:send-message',

  // Email
  'email:smtp',
  'email:send',
  'email:sendgrid',
  'sendgrid:send',
  'email:resend',
  'resend:send',

  // AI
  'openai:chat',
  'openai:completion',
  'openai:embeddings',
  'anthropic:claude',
  'claude:message',

  // Google Sheets
  'google-sheets:read',
  'google-sheets:append',
  'google-sheets:update',
  'google-sheets:create',
  'sheets:read',
  'sheets:append',
  'sheets:update',

  // Stripe
  'stripe:create-payment-intent',
  'stripe:create-customer',
  'stripe:create-subscription',
  'stripe:refund',
  'stripe:get-customer',

  // Twilio
  'twilio:send-sms',
  'twilio:send-mms',
  'twilio:lookup',
  'sms:send',

  // HTTP
  'http:request',
  'webhook:send',

  // Control flow
  'condition',
  'delay',

  // Loops
  'loop',
  'loop:foreach',
  'loop:repeat',
  'for-each',
  'repeat',

  // Filter
  'filter',
  'condition:filter',

  // Switch
  'switch',
  'condition:switch',

  // Transform
  'transform',
  'transform:data',
  'data:transform',

  // Triggers
  'trigger',
  'trigger:webhook',
  'trigger:form',
  'trigger:schedule',
  'trigger:event',
  'trigger:manual',
] as const;

export type HandlerType = typeof HANDLER_TYPES[number];

/**
 * Determine the specific handler type from node metadata
 * This maps generic node types (like "action") to specific handlers (like "email:resend")
 * based on the node's label and icon
 *
 * This is a pure function with no side effects or external dependencies
 */
export function determineHandlerType(node: {
  nodeType: string;
  label?: string;
  icon?: string;
  config?: Record<string, unknown>;
}): string {
  const { nodeType, label, icon, config } = node;
  const labelLower = (label || '').toLowerCase();
  const iconLower = (icon || '').toLowerCase();

  // For non-action nodes, use the nodeType directly
  if (nodeType !== 'action') {
    return nodeType;
  }

  // Determine specific handler type from label/icon

  // Email - use Resend as the default email handler (supports platform fallback)
  if (labelLower.includes('email') || labelLower.includes('mail') || iconLower === 'mail') {
    // Check if user has specified a specific email provider in config
    const integrationId = config?.integrationId as string | undefined;
    if (integrationId) {
      // Determine provider from integration (would need to query DB, for now default to resend)
      return 'email:resend';
    }
    // Default to Resend for platform email
    return 'email:resend';
  }

  // Slack
  if (labelLower.includes('slack') || iconLower === 'slack') {
    return 'slack:send-message';
  }

  // Discord
  if (labelLower.includes('discord') || iconLower === 'message-square' || iconLower === 'discord') {
    return 'discord:webhook';
  }

  // Teams
  if (labelLower.includes('teams') || iconLower === 'users') {
    return 'teams:webhook';
  }

  // SMS/Twilio
  if (labelLower.includes('sms') || labelLower.includes('twilio') || iconLower === 'phone') {
    return 'twilio:send-sms';
  }

  // OpenAI
  if (labelLower.includes('openai') || labelLower.includes('gpt') || labelLower.includes('ai') || iconLower === 'brain') {
    return 'openai:chat';
  }

  // Claude/Anthropic
  if (labelLower.includes('claude') || labelLower.includes('anthropic')) {
    return 'anthropic:claude';
  }

  // Google Sheets
  if (labelLower.includes('google sheets') || labelLower.includes('sheets') || iconLower === 'table') {
    if (labelLower.includes('read') || labelLower.includes('get')) {
      return 'google-sheets:read';
    }
    if (labelLower.includes('append') || labelLower.includes('add')) {
      return 'google-sheets:append';
    }
    if (labelLower.includes('update')) {
      return 'google-sheets:update';
    }
    return 'google-sheets:append'; // Default
  }

  // Stripe
  if (labelLower.includes('stripe') || labelLower.includes('payment') || iconLower === 'credit-card') {
    if (labelLower.includes('customer')) {
      return 'stripe:create-customer';
    }
    if (labelLower.includes('subscription')) {
      return 'stripe:create-subscription';
    }
    if (labelLower.includes('refund')) {
      return 'stripe:refund';
    }
    return 'stripe:create-payment-intent'; // Default
  }

  // HTTP/Webhook
  if (labelLower.includes('http') || labelLower.includes('webhook') || labelLower.includes('api') || iconLower === 'globe') {
    return 'http:request';
  }

  // Transform/Data
  if (labelLower.includes('transform') || labelLower.includes('map') || labelLower.includes('format')) {
    return 'transform';
  }

  // Filter
  if (labelLower.includes('filter')) {
    return 'filter';
  }

  // Loop
  if (labelLower.includes('loop') || labelLower.includes('for each') || labelLower.includes('foreach')) {
    return 'loop:foreach';
  }
  if (labelLower.includes('repeat')) {
    return 'loop:repeat';
  }

  // Default: return the original nodeType
  return nodeType;
}

/**
 * Check if a handler type is valid
 */
export function isValidHandlerType(handlerType: string): boolean {
  return HANDLER_TYPES.includes(handlerType as HandlerType);
}
