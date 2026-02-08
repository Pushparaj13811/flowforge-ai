/**
 * @file stripe-handler.ts
 * @description Stripe payment integration handlers
 */

import { BaseNodeHandler } from './base-handler';
import type { NodeExecutionResult, ExecutionContext } from '../types';
import type { WorkflowNodeData } from '@/components/flow-editor/types';
import { getIntegrationCredentials } from '@/lib/security/integration-credentials';
import { logIntegrationUsage } from '@/lib/monitoring/logger';
import { withRetry, WorkflowExecutionError, ErrorType } from '../error-handler';
import Stripe from 'stripe';

interface StripeConfig {
  apiKey: string;
  webhookSecret?: string;
}

/**
 * Stripe - Create Payment Intent Handler
 */
export class StripeCreatePaymentIntentHandler extends BaseNodeHandler {
  protected nodeType = 'stripe:create-payment-intent';

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
        amount, // in cents (e.g., 2000 = $20.00)
        currency = 'usd',
        description,
        customerEmail,
        metadata = {},
        automaticPaymentMethods = true,
      } = resolvedConfig;

      if (!integrationId) {
        throw new Error('Integration ID is required');
      }

      if (!amount || amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      // Get Stripe credentials
      const credentials = await getIntegrationCredentials<StripeConfig>(integrationId);
      if (!credentials) {
        throw new Error('Stripe credentials not found');
      }

      // Initialize Stripe
      const stripe = new Stripe(credentials.apiKey, {
        apiVersion: '2026-01-28.clover',
      });

      // Create payment intent with retry
      const result = await withRetry(
        async () => {
          const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            description: description || undefined,
            receipt_email: customerEmail || undefined,
            metadata,
            automatic_payment_methods: automaticPaymentMethods
              ? { enabled: true }
              : undefined,
          });

          return paymentIntent;
        },
        { maxAttempts: 3, initialDelay: 1000 },
        { nodeId: ((node as any).id as string), nodeType: this.nodeType }
      );

      logIntegrationUsage({
        integrationId,
        integrationType: 'stripe',
        action: 'create-payment-intent',
        success: true,
        duration: Date.now() - startTime,
      });

      return this.success(
        {
          id: result.id,
          clientSecret: result.client_secret,
          amount: result.amount,
          currency: result.currency,
          status: result.status,
          description: result.description,
        },
        startTime
      );
    } catch (error) {
      this.log('error', 'Stripe create payment intent failed', { error });

      logIntegrationUsage({
        integrationId: config?.integrationId,
        integrationType: 'stripe',
        action: 'create-payment-intent',
        success: false,
        duration: Date.now() - startTime,
      });

      return this.failure(error as Error, startTime);
    }
  }
}

/**
 * Stripe - Create Customer Handler
 */
export class StripeCreateCustomerHandler extends BaseNodeHandler {
  protected nodeType = 'stripe:create-customer';

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
        email,
        name,
        description,
        metadata = {},
        phone,
        address,
      } = resolvedConfig;

      if (!integrationId) {
        throw new Error('Integration ID is required');
      }

      if (!email) {
        throw new Error('Email is required');
      }

      const credentials = await getIntegrationCredentials<StripeConfig>(integrationId);
      if (!credentials) {
        throw new Error('Stripe credentials not found');
      }

      const stripe = new Stripe(credentials.apiKey, {
        apiVersion: '2026-01-28.clover',
      });

      const result = await withRetry(
        async () => {
          const customer = await stripe.customers.create({
            email,
            name: name || undefined,
            description: description || undefined,
            metadata,
            phone: phone || undefined,
            address: address || undefined,
          });

          return customer;
        },
        { maxAttempts: 3, initialDelay: 1000 },
        { nodeId: ((node as any).id as string), nodeType: this.nodeType }
      );

      logIntegrationUsage({
        integrationId,
        integrationType: 'stripe',
        action: 'create-customer',
        success: true,
        duration: Date.now() - startTime,
      });

      return this.success(
        {
          id: result.id,
          email: result.email,
          name: result.name,
          created: result.created,
        },
        startTime
      );
    } catch (error) {
      this.log('error', 'Stripe create customer failed', { error });

      logIntegrationUsage({
        integrationId: config?.integrationId,
        integrationType: 'stripe',
        action: 'create-customer',
        success: false,
        duration: Date.now() - startTime,
      });

      return this.failure(error as Error, startTime);
    }
  }
}

/**
 * Stripe - Create Subscription Handler
 */
export class StripeCreateSubscriptionHandler extends BaseNodeHandler {
  protected nodeType = 'stripe:create-subscription';

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
        customerId,
        priceId, // Stripe Price ID (e.g., price_1234567890)
        trialPeriodDays,
        metadata = {},
      } = resolvedConfig;

      if (!integrationId) {
        throw new Error('Integration ID is required');
      }

      if (!customerId) {
        throw new Error('Customer ID is required');
      }

      if (!priceId) {
        throw new Error('Price ID is required');
      }

      const credentials = await getIntegrationCredentials<StripeConfig>(integrationId);
      if (!credentials) {
        throw new Error('Stripe credentials not found');
      }

      const stripe = new Stripe(credentials.apiKey, {
        apiVersion: '2026-01-28.clover',
      });

      const result = await withRetry(
        async () => {
          const subscription = await stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: priceId }],
            trial_period_days: trialPeriodDays || undefined,
            metadata,
          });

          return subscription;
        },
        { maxAttempts: 3, initialDelay: 1000 },
        { nodeId: ((node as any).id as string), nodeType: this.nodeType }
      );

      logIntegrationUsage({
        integrationId,
        integrationType: 'stripe',
        action: 'create-subscription',
        success: true,
        duration: Date.now() - startTime,
      });

      return this.success(
        {
          id: result.id,
          customerId: result.customer as string,
          status: result.status,
          currentPeriodStart: (result as any).current_period_start,
          currentPeriodEnd: (result as any).current_period_end,
          trialEnd: result.trial_end,
        },
        startTime
      );
    } catch (error) {
      this.log('error', 'Stripe create subscription failed', { error });

      logIntegrationUsage({
        integrationId: config?.integrationId,
        integrationType: 'stripe',
        action: 'create-subscription',
        success: false,
        duration: Date.now() - startTime,
      });

      return this.failure(error as Error, startTime);
    }
  }
}

/**
 * Stripe - Refund Payment Handler
 */
export class StripeRefundHandler extends BaseNodeHandler {
  protected nodeType = 'stripe:refund';

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
        paymentIntentId,
        amount, // Optional: partial refund in cents
        reason, // 'duplicate', 'fraudulent', 'requested_by_customer'
        metadata = {},
      } = resolvedConfig;

      if (!integrationId) {
        throw new Error('Integration ID is required');
      }

      if (!paymentIntentId) {
        throw new Error('Payment Intent ID is required');
      }

      const credentials = await getIntegrationCredentials<StripeConfig>(integrationId);
      if (!credentials) {
        throw new Error('Stripe credentials not found');
      }

      const stripe = new Stripe(credentials.apiKey, {
        apiVersion: '2026-01-28.clover',
      });

      const result = await withRetry(
        async () => {
          const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount: amount || undefined, // Full refund if not specified
            reason: reason || undefined,
            metadata,
          });

          return refund;
        },
        { maxAttempts: 3, initialDelay: 1000 },
        { nodeId: ((node as any).id as string), nodeType: this.nodeType }
      );

      logIntegrationUsage({
        integrationId,
        integrationType: 'stripe',
        action: 'refund',
        success: true,
        duration: Date.now() - startTime,
      });

      return this.success(
        {
          id: result.id,
          amount: result.amount,
          currency: result.currency,
          status: result.status,
          reason: result.reason,
        },
        startTime
      );
    } catch (error) {
      this.log('error', 'Stripe refund failed', { error });

      logIntegrationUsage({
        integrationId: config?.integrationId,
        integrationType: 'stripe',
        action: 'refund',
        success: false,
        duration: Date.now() - startTime,
      });

      return this.failure(error as Error, startTime);
    }
  }
}

/**
 * Stripe - Retrieve Customer Handler
 */
export class StripeGetCustomerHandler extends BaseNodeHandler {
  protected nodeType = 'stripe:get-customer';

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
        customerId,
      } = resolvedConfig;

      if (!integrationId) {
        throw new Error('Integration ID is required');
      }

      if (!customerId) {
        throw new Error('Customer ID is required');
      }

      const credentials = await getIntegrationCredentials<StripeConfig>(integrationId);
      if (!credentials) {
        throw new Error('Stripe credentials not found');
      }

      const stripe = new Stripe(credentials.apiKey, {
        apiVersion: '2026-01-28.clover',
      });

      const result = await withRetry(
        async () => {
          const customer = await stripe.customers.retrieve(customerId);
          return customer;
        },
        { maxAttempts: 3, initialDelay: 1000 },
        { nodeId: ((node as any).id as string), nodeType: this.nodeType }
      );

      logIntegrationUsage({
        integrationId,
        integrationType: 'stripe',
        action: 'get-customer',
        success: true,
        duration: Date.now() - startTime,
      });

      // Handle deleted customers
      if ((result as any).deleted) {
        return this.success(
          {
            id: result.id,
            deleted: true,
          },
          startTime
        );
      }

      const customer = result as Stripe.Customer;

      return this.success(
        {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          description: customer.description,
          metadata: customer.metadata,
          created: customer.created,
          balance: customer.balance,
        },
        startTime
      );
    } catch (error) {
      this.log('error', 'Stripe get customer failed', { error });

      logIntegrationUsage({
        integrationId: config?.integrationId,
        integrationType: 'stripe',
        action: 'get-customer',
        success: false,
        duration: Date.now() - startTime,
      });

      return this.failure(error as Error, startTime);
    }
  }
}
