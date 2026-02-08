/**
 * @file index.ts
 * @description Node handler registry
 */

import type { NodeHandler } from '../types';
import { SlackSendMessageHandler } from './slack-handler';
import { HttpRequestHandler } from './http-handler';
import { ConditionHandler } from './condition-handler';
import { DelayHandler } from './delay-handler';
import { SMTPEmailHandler, SendGridEmailHandler } from './email-handler';
import { ResendEmailHandler } from './resend-handler';
import { DiscordWebhookHandler } from './discord-handler';
import { TeamsWebhookHandler } from './teams-handler';
import { OpenAIChatHandler, OpenAIEmbeddingsHandler } from './openai-handler';
import { AnthropicClaudeHandler } from './anthropic-handler';
import {
  GoogleSheetsReadHandler,
  GoogleSheetsAppendHandler,
  GoogleSheetsUpdateHandler,
  GoogleSheetsCreateHandler,
} from './google-sheets-handler';
import {
  StripeCreatePaymentIntentHandler,
  StripeCreateCustomerHandler,
  StripeCreateSubscriptionHandler,
  StripeRefundHandler,
  StripeGetCustomerHandler,
} from './stripe-handler';
import {
  TwilioSendSMSHandler,
  TwilioSendMMSHandler,
  TwilioLookupHandler,
} from './twilio-handler';
import { ForEachLoopHandler, RepeatLoopHandler } from './loop-handler';
import { FilterHandler } from './filter-handler';
import { SwitchHandler } from './switch-handler';
import { TransformHandler } from './transform-handler';
import { TriggerHandler } from './trigger-handler';

// Import and re-export handler type utilities from the shared module (client-safe)
import { determineHandlerType, HANDLER_TYPES, isValidHandlerType } from '../handler-types';
export { determineHandlerType, HANDLER_TYPES, isValidHandlerType };
export type { HandlerType } from '../handler-types';

/**
 * Handler registry
 * Maps node types to their handlers
 */
export const HANDLER_REGISTRY: Record<string, NodeHandler> = {
  // Messaging
  'slack:send-message': new SlackSendMessageHandler(),
  'discord:webhook': new DiscordWebhookHandler(),
  'discord:send-message': new DiscordWebhookHandler(), // Alias
  'teams:webhook': new TeamsWebhookHandler(),
  'teams:send-message': new TeamsWebhookHandler(), // Alias

  // Email
  'email:smtp': new SMTPEmailHandler(),
  'email:send': new SMTPEmailHandler(), // Alias
  'email:sendgrid': new SendGridEmailHandler(),
  'sendgrid:send': new SendGridEmailHandler(), // Alias
  'email:resend': new ResendEmailHandler(),
  'resend:send': new ResendEmailHandler(), // Alias

  // AI
  'openai:chat': new OpenAIChatHandler(),
  'openai:completion': new OpenAIChatHandler(), // Alias
  'openai:embeddings': new OpenAIEmbeddingsHandler(),
  'anthropic:claude': new AnthropicClaudeHandler(),
  'claude:message': new AnthropicClaudeHandler(), // Alias

  // Google Sheets
  'google-sheets:read': new GoogleSheetsReadHandler(),
  'google-sheets:append': new GoogleSheetsAppendHandler(),
  'google-sheets:update': new GoogleSheetsUpdateHandler(),
  'google-sheets:create': new GoogleSheetsCreateHandler(),
  'sheets:read': new GoogleSheetsReadHandler(), // Alias
  'sheets:append': new GoogleSheetsAppendHandler(), // Alias
  'sheets:update': new GoogleSheetsUpdateHandler(), // Alias

  // Stripe
  'stripe:create-payment-intent': new StripeCreatePaymentIntentHandler(),
  'stripe:create-customer': new StripeCreateCustomerHandler(),
  'stripe:create-subscription': new StripeCreateSubscriptionHandler(),
  'stripe:refund': new StripeRefundHandler(),
  'stripe:get-customer': new StripeGetCustomerHandler(),

  // Twilio
  'twilio:send-sms': new TwilioSendSMSHandler(),
  'twilio:send-mms': new TwilioSendMMSHandler(),
  'twilio:lookup': new TwilioLookupHandler(),
  'sms:send': new TwilioSendSMSHandler(), // Alias

  // HTTP
  'http:request': new HttpRequestHandler(),
  'webhook:send': new HttpRequestHandler(), // Same as HTTP request

  // Control flow
  'condition': new ConditionHandler(),
  'delay': new DelayHandler(),

  // Loops
  'loop': new ForEachLoopHandler(),
  'loop:foreach': new ForEachLoopHandler(),
  'loop:repeat': new RepeatLoopHandler(),
  'for-each': new ForEachLoopHandler(), // Alias
  'repeat': new RepeatLoopHandler(), // Alias

  // Filter
  'filter': new FilterHandler(),
  'condition:filter': new FilterHandler(), // Alias

  // Switch
  'switch': new SwitchHandler(),
  'condition:switch': new SwitchHandler(), // Alias

  // Transform
  'transform': new TransformHandler(),
  'transform:data': new TransformHandler(), // Alias
  'data:transform': new TransformHandler(), // Alias

  // Triggers - pass through trigger data without executing external actions
  'trigger': new TriggerHandler(),
  'trigger:webhook': new TriggerHandler(),
  'trigger:form': new TriggerHandler(),
  'trigger:schedule': new TriggerHandler(),
  'trigger:event': new TriggerHandler(),
  'trigger:manual': new TriggerHandler(),
};


/**
 * Get handler for a node type
 */
export function getHandler(nodeType: string): NodeHandler | null {
  // Try exact match first
  if (HANDLER_REGISTRY[nodeType]) {
    return HANDLER_REGISTRY[nodeType];
  }

  // Try prefix match (e.g., "slack" matches "slack:send-message")
  const prefixMatch = Object.keys(HANDLER_REGISTRY).find((key) =>
    key.startsWith(nodeType + ':')
  );

  if (prefixMatch) {
    return HANDLER_REGISTRY[prefixMatch];
  }

  return null;
}

/**
 * Get handler for a node using its full metadata
 * This is the preferred method as it can determine handler type from label/icon
 */
export function getHandlerForNode(node: {
  nodeType: string;
  label?: string;
  icon?: string;
  config?: Record<string, unknown>;
}): NodeHandler | null {
  const handlerType = determineHandlerType(node);
  return getHandler(handlerType);
}

/**
 * Check if a node type has a handler
 */
export function hasHandler(nodeType: string): boolean {
  return getHandler(nodeType) !== null;
}

/**
 * List all supported node types
 */
export function getSupportedNodeTypes(): string[] {
  return Object.keys(HANDLER_REGISTRY);
}
