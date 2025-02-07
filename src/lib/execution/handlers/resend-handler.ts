/**
 * @file resend-handler.ts
 * @description Resend email integration handler with hybrid credential support
 * Supports both platform-provided credentials and user-provided credentials
 */

import { BaseNodeHandler } from './base-handler';
import type { NodeExecutionResult, ExecutionContext } from '../types';
import type { WorkflowNodeData } from '@/components/flow-editor/types';
import { getIntegrationCredentials } from '@/lib/security/integration-credentials';
import { logIntegrationUsage } from '@/lib/monitoring/logger';
import { withRetry, WorkflowExecutionError, ErrorType } from '../error-handler';
import { checkPlatformUsageLimit, incrementPlatformUsage } from '@/lib/platform-usage';

/**
 * Resend Email Config (User-provided)
 */
interface ResendConfig {
  apiKey: string;
  fromEmail: string;
}

// Platform usage tracking is now in @/lib/platform-usage

/**
 * Resend Email Handler with Hybrid Credential Support
 *
 * Hybrid Model:
 * 1. If user has configured integration -> use user's credentials
 * 2. If not, fall back to platform credentials (with usage limits)
 */
export class ResendEmailHandler extends BaseNodeHandler {
  protected nodeType = 'email:resend';

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
        body, // Also accept 'body' from EmailConfig form
        cc,
        bcc,
        replyTo,
        attachments,
        tags,
      } = resolvedConfig;

      // Validate required fields
      if (!to) {
        throw new Error('Recipient email (to) is required');
      }

      if (!subject) {
        throw new Error('Subject is required');
      }

      // Support 'body' field from EmailConfig form - treat as HTML if it contains tags, otherwise text
      const emailBody = body as string | undefined;
      const emailHtml = html || (emailBody && emailBody.includes('<') ? emailBody : undefined);
      const emailText = text || (emailBody && !emailBody.includes('<') ? emailBody : undefined);

      if (!emailText && !emailHtml) {
        throw new Error('Email body (text, html, or body) is required');
      }

      let credentials: ResendConfig;
      let source: 'user' | 'platform' = 'user';
      let actualIntegrationId = integrationId;

      // HYBRID LOGIC: User credentials OR platform credentials
      if (integrationId) {
        // User provided their own integration
        const userCredentials = await getIntegrationCredentials<ResendConfig>(integrationId);
        if (!userCredentials) {
          throw new Error('Email integration credentials not found');
        }
        credentials = userCredentials;
        source = 'user';
      } else {
        // Check if platform has credentials configured
        if (!process.env.RESEND_API_KEY) {
          throw new WorkflowExecutionError(
            'Email not configured. Please add an email integration in Settings to use this feature.',
            ErrorType.CONFIGURATION_ERROR,
            false
          );
        }

        // Check usage limits
        const limit = parseInt(process.env.PLATFORM_EMAIL_MONTHLY_LIMIT || '100', 10);
        const usageCheck = await checkPlatformUsageLimit(context.userId || 'anonymous', 'email', limit);

        if (!usageCheck.allowed) {
          throw new WorkflowExecutionError(
            `Platform email limit reached (${usageCheck.current}/${limit} this month). Please add your own email integration in Settings to continue.`,
            ErrorType.RATE_LIMIT_ERROR,
            false
          );
        }

        // Use platform credentials
        credentials = {
          apiKey: process.env.RESEND_API_KEY,
          fromEmail: process.env.EMAIL_FROM || 'FlowForge <noreply@flowforge.ai>',
        };
        source = 'platform';
        actualIntegrationId = 'platform';
        // Usage will be tracked after successful send
      }

      // Send email with retry
      const result = await withRetry(
        async () => {
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: credentials.fromEmail,
              to: Array.isArray(to) ? to : [to],
              subject,
              text: emailText,
              html: emailHtml,
              cc: cc ? (Array.isArray(cc) ? cc : [cc]) : undefined,
              bcc: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined,
              reply_to: replyTo,
              attachments: attachments || undefined,
              tags: tags || undefined,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `HTTP ${response.status}`);
          }

          return await response.json();
        },
        { maxAttempts: 3, initialDelay: 1000 },
        { nodeId: ((node as any).id as string), nodeType: this.nodeType }
      );

      // Increment usage if using platform credentials
      if (source === 'platform') {
        await incrementPlatformUsage(context.userId || 'anonymous', 'email', 1);
      }

      // Log integration usage
      logIntegrationUsage({
        integrationId: actualIntegrationId,
        integrationType: 'email',
        action: 'send-resend',
        success: true,
        duration: Date.now() - startTime,
      });

      this.log('info', `Email sent successfully using ${source} credentials`, {
        to,
        subject,
        source,
      });

      return this.success(
        {
          id: result.id,
          to,
          subject,
          source,
          message: `Email sent successfully using ${source} credentials`,
        },
        startTime
      );
    } catch (error) {
      this.log('error', 'Resend email send failed', { error });

      logIntegrationUsage({
        integrationId: config?.integrationId || 'platform',
        integrationType: 'email',
        action: 'send-resend',
        success: false,
        duration: Date.now() - startTime,
      });

      // Check for specific Resend errors
      if (error && typeof error === 'object' && 'message' in error) {
        const errMsg = (error as any).message;
        if (errMsg.includes('Invalid API key') || errMsg.includes('Unauthorized')) {
          return this.failure(
            new WorkflowExecutionError(
              'Email authentication failed. Please check your API key.',
              ErrorType.AUTHENTICATION_ERROR,
              false
            ),
            startTime
          );
        }
        if (errMsg.includes('rate limit') || errMsg.includes('too many requests')) {
          return this.failure(
            new WorkflowExecutionError(
              'Email rate limit exceeded. Please try again later.',
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
