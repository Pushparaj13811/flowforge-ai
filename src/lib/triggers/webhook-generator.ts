/**
 * @file webhook-generator.ts
 * @description Generate and verify webhook URLs and tokens
 */

import crypto from 'crypto';

/**
 * Generate a secure random webhook token
 */
export function generateWebhookToken(): string {
  return crypto.randomBytes(32).toString('hex'); // 64 character hex string
}

/**
 * Generate the full webhook URL from a token
 */
export function generateWebhookUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/api/webhooks/trigger/${token}`;
}

/**
 * Generate HMAC signature for webhook payload verification
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
