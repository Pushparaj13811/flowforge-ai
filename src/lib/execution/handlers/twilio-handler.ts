/**
 * @file twilio-handler.ts
 * @description Twilio SMS/MMS integration handler
 */

import { BaseNodeHandler } from './base-handler';
import type { NodeExecutionResult, ExecutionContext } from '../types';
import type { WorkflowNodeData } from '@/components/flow-editor/types';
import { getIntegrationCredentials } from '@/lib/security/integration-credentials';
import { logIntegrationUsage } from '@/lib/monitoring/logger';
import { withRetry, WorkflowExecutionError, ErrorType } from '../error-handler';
import type { TwilioIntegrationConfig } from '@/types/workflow';
import twilio from 'twilio';

/**
 * Twilio - Send SMS Handler
 */
export class TwilioSendSMSHandler extends BaseNodeHandler {
  protected nodeType = 'twilio:send-sms';

  async execute(
    node: WorkflowNodeData,
    context: ExecutionContext,
    config?: any
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const resolvedConfig = this.resolveConfig(config || ((node as any).data).config, context);

      const {
        integrationId,
        to, // Phone number in E.164 format (e.g., +15555551234)
        body, // SMS message text
        statusCallback, // Optional: webhook for delivery status
      } = resolvedConfig;

      if (!integrationId) {
        throw new Error('Integration ID is required');
      }

      if (!to) {
        throw new Error('Recipient phone number (to) is required');
      }

      if (!body) {
        throw new Error('Message body is required');
      }

      // Validate phone number format
      if (!to.startsWith('+')) {
        throw new Error('Phone number must be in E.164 format (e.g., +15555551234)');
      }

      // Get Twilio credentials
      const credentials = await getIntegrationCredentials<TwilioIntegrationConfig>(integrationId);
      if (!credentials) {
        throw new Error('Twilio credentials not found');
      }

      // Initialize Twilio client
      const client = twilio(credentials.accountSid, credentials.authToken);

      // Send SMS with retry
      const result = await withRetry(
        async () => {
          const message = await client.messages.create({
            from: credentials.fromNumber,
            to,
            body,
            statusCallback: statusCallback || undefined,
          });

          return message;
        },
        { maxAttempts: 3, initialDelay: 1000 },
        { nodeId: ((node as any).id as string), nodeType: this.nodeType }
      );

      logIntegrationUsage({
        integrationId,
        integrationType: 'twilio',
        action: 'send-sms',
        success: true,
        duration: Date.now() - startTime,
      });

      return this.success(
        {
          sid: result.sid,
          to: result.to,
          from: result.from,
          body: result.body,
          status: result.status,
          dateCreated: result.dateCreated,
        },
        startTime
      );
    } catch (error) {
      this.log('error', 'Twilio send SMS failed', { error });

      logIntegrationUsage({
        integrationId: config?.integrationId,
        integrationType: 'twilio',
        action: 'send-sms',
        success: false,
        duration: Date.now() - startTime,
      });

      // Handle specific Twilio errors
      if (error && typeof error === 'object' && 'code' in error) {
        const err = error as any;
        if (err.code === 20003) {
          return this.failure(
            new WorkflowExecutionError(
              'Twilio authentication failed',
              ErrorType.AUTHENTICATION_ERROR,
              false
            ),
            startTime
          );
        }
        if (err.code === 21608) {
          return this.failure(
            new WorkflowExecutionError(
              'Invalid phone number',
              ErrorType.VALIDATION_ERROR,
              false
            ),
            startTime
          );
        }
      }

      return this.failure(error as Error, startTime);
    }
  }
}

/**
 * Twilio - Send MMS Handler
 */
export class TwilioSendMMSHandler extends BaseNodeHandler {
  protected nodeType = 'twilio:send-mms';

  async execute(
    node: WorkflowNodeData,
    context: ExecutionContext,
    config?: any
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const resolvedConfig = this.resolveConfig(config || ((node as any).data).config, context);

      const {
        integrationId,
        to,
        body, // Optional text message
        mediaUrl, // URL(s) to media (image, video, etc.)
        statusCallback,
      } = resolvedConfig;

      if (!integrationId) {
        throw new Error('Integration ID is required');
      }

      if (!to) {
        throw new Error('Recipient phone number (to) is required');
      }

      if (!mediaUrl) {
        throw new Error('Media URL is required for MMS');
      }

      if (!to.startsWith('+')) {
        throw new Error('Phone number must be in E.164 format');
      }

      const credentials = await getIntegrationCredentials<TwilioIntegrationConfig>(integrationId);
      if (!credentials) {
        throw new Error('Twilio credentials not found');
      }

      const client = twilio(credentials.accountSid, credentials.authToken);

      // Prepare media URLs (can be array or single URL)
      const mediaUrls = Array.isArray(mediaUrl) ? mediaUrl : [mediaUrl];

      const result = await withRetry(
        async () => {
          const message = await client.messages.create({
            from: credentials.fromNumber,
            to,
            body: body || undefined,
            mediaUrl: mediaUrls,
            statusCallback: statusCallback || undefined,
          });

          return message;
        },
        { maxAttempts: 3, initialDelay: 1000 },
        { nodeId: ((node as any).id as string), nodeType: this.nodeType }
      );

      logIntegrationUsage({
        integrationId,
        integrationType: 'twilio',
        action: 'send-mms',
        success: true,
        duration: Date.now() - startTime,
      });

      return this.success(
        {
          sid: result.sid,
          to: result.to,
          from: result.from,
          body: result.body,
          numMedia: result.numMedia,
          status: result.status,
          dateCreated: result.dateCreated,
        },
        startTime
      );
    } catch (error) {
      this.log('error', 'Twilio send MMS failed', { error });

      logIntegrationUsage({
        integrationId: config?.integrationId,
        integrationType: 'twilio',
        action: 'send-mms',
        success: false,
        duration: Date.now() - startTime,
      });

      return this.failure(error as Error, startTime);
    }
  }
}

/**
 * Twilio - Lookup Phone Number Handler
 */
export class TwilioLookupHandler extends BaseNodeHandler {
  protected nodeType = 'twilio:lookup';

  async execute(
    node: WorkflowNodeData,
    context: ExecutionContext,
    config?: any
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const resolvedConfig = this.resolveConfig(config || ((node as any).data).config, context);

      const {
        integrationId,
        phoneNumber,
        countryCode = 'US', // Optional: country code for parsing
      } = resolvedConfig;

      if (!integrationId) {
        throw new Error('Integration ID is required');
      }

      if (!phoneNumber) {
        throw new Error('Phone number is required');
      }

      const credentials = await getIntegrationCredentials<TwilioIntegrationConfig>(integrationId);
      if (!credentials) {
        throw new Error('Twilio credentials not found');
      }

      const client = twilio(credentials.accountSid, credentials.authToken);

      const result = await withRetry(
        async () => {
          const lookup = await client.lookups.v2
            .phoneNumbers(phoneNumber)
            .fetch({ countryCode });

          return lookup;
        },
        { maxAttempts: 3, initialDelay: 1000 },
        { nodeId: ((node as any).id as string), nodeType: this.nodeType }
      );

      logIntegrationUsage({
        integrationId,
        integrationType: 'twilio',
        action: 'lookup-phone',
        success: true,
        duration: Date.now() - startTime,
      });

      return this.success(
        {
          phoneNumber: result.phoneNumber,
          nationalFormat: result.nationalFormat,
          countryCode: result.countryCode,
          valid: result.valid,
        },
        startTime
      );
    } catch (error) {
      this.log('error', 'Twilio lookup failed', { error });

      logIntegrationUsage({
        integrationId: config?.integrationId,
        integrationType: 'twilio',
        action: 'lookup-phone',
        success: false,
        duration: Date.now() - startTime,
      });

      return this.failure(error as Error, startTime);
    }
  }
}
