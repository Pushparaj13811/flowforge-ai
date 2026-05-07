/**
 * @file integration-credentials.ts
 * @description Helper functions for managing encrypted integration credentials
 */

import { db } from '@/db';
import { integrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { encryptCredentialJSON, decryptCredentialJSON, getVault } from './credential-vault';
import type { IntegrationConfig } from '@/types/workflow';

/**
 * Store integration credentials securely
 */
export async function storeIntegrationCredentials(params: {
  userId: string;
  type: string;
  name: string;
  config: IntegrationConfig;
}): Promise<string> {
  const { userId, type, name, config } = params;

  // Encrypt the config
  const encryptedConfig = encryptCredentialJSON(config);
  const keyVersion = getVault().getKeyVersion();

  // Insert into database
  const [integration] = await db
    .insert(integrations)
    .values({
      userId,
      type,
      name,
      encryptedConfig,
      keyVersion,
    })
    .returning({ id: integrations.id });

  console.log(`Stored encrypted credentials for ${type} integration: ${integration.id}`);

  return integration.id;
}

/**
 * Retrieve and decrypt integration credentials
 */
export async function getIntegrationCredentials<T extends IntegrationConfig = IntegrationConfig>(
  integrationId: string,
  userId: string
): Promise<T> {
  const integration = await db.query.integrations.findFirst({
    where: and(eq(integrations.id, integrationId), eq(integrations.userId, userId)),
  });

  if (!integration) {
    throw new Error('Integration not found or access denied');
  }

  if (!integration.isActive) {
    throw new Error('Integration is disabled');
  }

  // Decrypt the config
  try {
    const config = decryptCredentialJSON<T>(integration.encryptedConfig);
    return config;
  } catch (error) {
    console.error(`Failed to decrypt credentials for integration ${integrationId}:`, error);
    throw new Error('Failed to decrypt integration credentials');
  }
}

/**
 * Update integration credentials
 */
export async function updateIntegrationCredentials(
  integrationId: string,
  userId: string,
  config: IntegrationConfig
): Promise<void> {
  const encryptedConfig = encryptCredentialJSON(config);
  const keyVersion = getVault().getKeyVersion();

  await db
    .update(integrations)
    .set({
      encryptedConfig,
      keyVersion,
      updatedAt: new Date(),
    })
    .where(and(eq(integrations.id, integrationId), eq(integrations.userId, userId)));

  console.log(`Updated encrypted credentials for integration: ${integrationId}`);
}

/**
 * Delete integration
 */
export async function deleteIntegration(integrationId: string, userId: string): Promise<void> {
  const result = await db
    .delete(integrations)
    .where(and(eq(integrations.id, integrationId), eq(integrations.userId, userId)))
    .returning({ id: integrations.id });

  if (result.length === 0) {
    throw new Error('Integration not found or access denied');
  }

  console.log(`Deleted integration: ${integrationId}`);
}

/**
 * List user integrations (without decrypting credentials)
 */
export async function listUserIntegrations(userId: string) {
  const userIntegrations = await db.query.integrations.findMany({
    where: eq(integrations.userId, userId),
    columns: {
      id: true,
      type: true,
      name: true,
      isActive: true,
      lastUsedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return userIntegrations;
}

/**
 * Update last used timestamp
 */
export async function touchIntegration(integrationId: string): Promise<void> {
  await db
    .update(integrations)
    .set({ lastUsedAt: new Date() })
    .where(eq(integrations.id, integrationId));
}
