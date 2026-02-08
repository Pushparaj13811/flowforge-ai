/**
 * @file token-manager.ts
 * @description OAuth token storage and refresh management
 */

import { db } from '@/db';
import { integrations } from '@/db/schema';
import { eq, and, lt } from 'drizzle-orm';
import { encryptCredentialJSON, decryptCredentialJSON, getVault } from '../security/credential-vault';
import { getOAuthProvider } from './providers';
import { workflowLogger } from '../monitoring/logger';

/**
 * OAuth token data
 */
export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  scope?: string;
  tokenType?: string;
}

/**
 * OAuth Token Manager
 */
export class OAuthTokenManager {
  /**
   * Store OAuth tokens securely
   */
  async storeTokens(params: {
    userId: string;
    providerId: string;
    name: string;
    tokens: OAuthTokens;
  }): Promise<string> {
    const { userId, providerId, name, tokens } = params;

    // Encrypt tokens
    const encryptedConfig = encryptCredentialJSON(tokens);
    const keyVersion = getVault().getKeyVersion();

    // Store in database
    const [integration] = await db
      .insert(integrations)
      .values({
        userId,
        type: providerId,
        name,
        encryptedConfig,
        keyVersion,
      })
      .returning({ id: integrations.id });

    workflowLogger.info(
      { integrationId: integration.id, providerId },
      'OAuth tokens stored'
    );

    return integration.id;
  }

  /**
   * Get valid access token (refresh if expired)
   */
  async getValidToken(integrationId: string): Promise<string> {
    // Load integration
    const integration = await db.query.integrations.findFirst({
      where: eq(integrations.id, integrationId),
    });

    if (!integration) {
      throw new Error('Integration not found');
    }

    if (!integration.isActive) {
      throw new Error('Integration is disabled');
    }

    // Decrypt tokens
    const tokens = decryptCredentialJSON<OAuthTokens>(integration.encryptedConfig);

    // Check if token is expired (with 5 minute buffer)
    const now = new Date();
    const expiresAt = new Date(tokens.expiresAt);
    const bufferMs = 5 * 60 * 1000; // 5 minutes

    if (expiresAt.getTime() - now.getTime() > bufferMs) {
      // Token still valid
      return tokens.accessToken;
    }

    // Token expired or expiring soon, refresh it
    if (!tokens.refreshToken) {
      throw new Error('Refresh token not available, re-authentication required');
    }

    workflowLogger.info(
      { integrationId, providerId: integration.type },
      'Refreshing OAuth token'
    );

    const newTokens = await this.refreshToken(integration.type, tokens.refreshToken);

    // Update stored tokens
    await this.updateTokens(integrationId, newTokens);

    return newTokens.accessToken;
  }

  /**
   * Refresh OAuth token
   */
  async refreshToken(providerId: string, refreshToken: string): Promise<OAuthTokens> {
    const provider = getOAuthProvider(providerId);
    if (!provider) {
      throw new Error(`Unknown OAuth provider: ${providerId}`);
    }

    try {
      const response = await fetch(provider.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: provider.clientId,
          client_secret: provider.clientSecret,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token refresh failed: ${errorText}`);
      }

      const data = await response.json();

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken, // Some providers don't return new refresh token
        expiresAt: new Date(Date.now() + (data.expires_in * 1000)),
        scope: data.scope,
        tokenType: data.token_type || 'Bearer',
      };
    } catch (error) {
      workflowLogger.error(
        { providerId, error },
        'OAuth token refresh failed'
      );
      throw error;
    }
  }

  /**
   * Update stored tokens
   */
  async updateTokens(integrationId: string, tokens: OAuthTokens): Promise<void> {
    const encryptedConfig = encryptCredentialJSON(tokens);
    const keyVersion = getVault().getKeyVersion();

    await db
      .update(integrations)
      .set({
        encryptedConfig,
        keyVersion,
        updatedAt: new Date(),
      })
      .where(eq(integrations.id, integrationId));

    workflowLogger.info({ integrationId }, 'OAuth tokens updated');
  }

  /**
   * Revoke OAuth token
   */
  async revokeToken(integrationId: string): Promise<void> {
    const integration = await db.query.integrations.findFirst({
      where: eq(integrations.id, integrationId),
    });

    if (!integration) {
      throw new Error('Integration not found');
    }

    // Deactivate integration
    await db
      .update(integrations)
      .set({ isActive: false })
      .where(eq(integrations.id, integrationId));

    workflowLogger.info({ integrationId }, 'OAuth integration revoked');
  }

  /**
   * Find integrations that need token refresh
   */
  async findExpiredTokens(): Promise<string[]> {
    const now = new Date();
    const expiringSoon = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now

    // Note: This query won't work directly since expiresAt is encrypted
    // In production, you'd want to store expiresAt separately or implement a background job
    // that checks all active OAuth integrations periodically

    workflowLogger.warn('Token expiration check not fully implemented');
    return [];
  }
}

/**
 * Singleton token manager instance
 */
let tokenManagerInstance: OAuthTokenManager | null = null;

export function getTokenManager(): OAuthTokenManager {
  if (!tokenManagerInstance) {
    tokenManagerInstance = new OAuthTokenManager();
  }
  return tokenManagerInstance;
}
