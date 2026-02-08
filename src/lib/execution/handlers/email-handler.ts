/**
 * @file email-handler.ts
 * @description Email integration handlers (SMTP and SendGrid)
 */

import { BaseNodeHandler } from './base-handler';
import type { NodeExecutionResult, ExecutionContext } from '../types';
import type { WorkflowNodeData } from '@/components/flow-editor/types';
import { getIntegrationCredentials } from '@/lib/security/integration-credentials';
import { logIntegrationUsage } from '@/lib/monitoring/logger';
import { withRetry, WorkflowExecutionError, ErrorType } from '../error-handler';
import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';

/**
 * SMTP Email Config
 */
interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean; // true for 465, false for other ports
  username: string;
  password: string;
  from: string;
}

/**
 * SendGrid Config
 */
interface SendGridConfig {
  apiKey: string;
  from: string;
}

/**
 * SMTP Email Handler
 */
export class SMTPEmailHandler extends BaseNodeHandler {
  protected nodeType = 'email:smtp';

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
        subject,
        text,
        html,
        cc,
        bcc,
        replyTo,
        attachments,
      } = resolvedConfig;

      if (!integrationId) {
        throw new Error('Integration ID is required');
      }

      if (!to) {
        throw new Error('Recipient email (to) is required');
      }

      if (!subject) {
        throw new Error('Subject is required');
      }

      if (!text && !html) {
        throw new Error('Email body (text or html) is required');
      }

      // Get SMTP credentials
      const credentials = await getIntegrationCredentials<SMTPConfig>(integrationId);
      if (!credentials) {
        throw new Error('SMTP credentials not found');
      }

      // Send email with retry
      const result = await withRetry(
        async () => {
          // Create transporter
          const transporter = nodemailer.createTransport({
            host: credentials.host,
            port: credentials.port,
            secure: credentials.secure,
            auth: {
              user: credentials.username,
              pass: credentials.password,
            },
          });

          // Send email
          const info = await transporter.sendMail({
            from: credentials.from,
            to: Array.isArray(to) ? to.join(', ') : to,
            subject,
            text,
            html,
            cc: cc ? (Array.isArray(cc) ? cc.join(', ') : cc) : undefined,
            bcc: bcc ? (Array.isArray(bcc) ? bcc.join(', ') : bcc) : undefined,
            replyTo: replyTo,
            attachments: attachments || undefined,
          });

          return info;
        },
        { maxAttempts: 3, initialDelay: 1000 },
        { nodeId: ((node as any).id as string), nodeType: this.nodeType }
      );

      // Log integration usage
      logIntegrationUsage({
        integrationId,
        integrationType: 'email',
        action: 'send-smtp',
        success: true,
        duration: Date.now() - startTime,
      });

      return this.success(
        {
          messageId: result.messageId,
          response: result.response,
          accepted: result.accepted,
          rejected: result.rejected,
          to,
          subject,
        },
        startTime
      );
    } catch (error) {
      this.log('error', 'SMTP email send failed', { error });

      logIntegrationUsage({
        integrationId: config?.integrationId,
        integrationType: 'email',
        action: 'send-smtp',
        success: false,
        duration: Date.now() - startTime,
      });

      return this.failure(error as Error, startTime);
    }
  }
}

/**
 * SendGrid Email Handler
 */
export class SendGridEmailHandler extends BaseNodeHandler {
  protected nodeType = 'email:sendgrid';

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
        subject,
        text,
        html,
        templateId,
        dynamicTemplateData,
        cc,
        bcc,
        replyTo,
        attachments,
        categories,
        customArgs,
      } = resolvedConfig;

      if (!integrationId) {
        throw new Error('Integration ID is required');
      }

      if (!to) {
        throw new Error('Recipient email (to) is required');
      }

      if (!subject && !templateId) {
        throw new Error('Subject or template ID is required');
      }

      // Get SendGrid credentials
      const credentials = await getIntegrationCredentials<SendGridConfig>(integrationId);
      if (!credentials) {
        throw new Error('SendGrid credentials not found');
      }

      // Set API key
      sgMail.setApiKey(credentials.apiKey);

      // Prepare message
      const msg: any = {
        from: credentials.from,
        to: Array.isArray(to) ? to : [to],
        subject,
        text,
        html,
        cc: cc ? (Array.isArray(cc) ? cc : [cc]) : undefined,
        bcc: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined,
        replyTo: replyTo,
        attachments: attachments || undefined,
        categories: categories || undefined,
        customArgs: customArgs || undefined,
      };

      // Template support
      if (templateId) {
        msg.templateId = templateId;
        msg.dynamicTemplateData = dynamicTemplateData || {};
      }

      // Send with retry
      const result = await withRetry(
        async () => {
          const [response] = await sgMail.send(msg);
          return response;
        },
        { maxAttempts: 3, initialDelay: 1000 },
        { nodeId: ((node as any).id as string), nodeType: this.nodeType }
      );

      // Log integration usage
      logIntegrationUsage({
        integrationId,
        integrationType: 'sendgrid',
        action: 'send-email',
        success: true,
        duration: Date.now() - startTime,
      });

      return this.success(
        {
          statusCode: result.statusCode,
          body: result.body,
          headers: result.headers,
          to,
          subject: subject || `Template: ${templateId}`,
        },
        startTime
      );
    } catch (error) {
      this.log('error', 'SendGrid email send failed', { error });

      logIntegrationUsage({
        integrationId: config?.integrationId,
        integrationType: 'sendgrid',
        action: 'send-email',
        success: false,
        duration: Date.now() - startTime,
      });

      // Check for specific SendGrid errors
      if (error && typeof error === 'object' && 'code' in error) {
        const err = error as any;
        if (err.code === 401 || err.code === 403) {
          return this.failure(
            new WorkflowExecutionError(
              'SendGrid authentication failed',
              ErrorType.AUTHENTICATION_ERROR,
              false
            ),
            startTime
          );
        }
        if (err.code === 429) {
          return this.failure(
            new WorkflowExecutionError(
              'SendGrid rate limit exceeded',
              ErrorType.RATE_LIMIT_ERROR,
              true
            ),
            startTime
          );
        }
      }

      return this.failure(error as Error, startTime);
    }
  }
}
