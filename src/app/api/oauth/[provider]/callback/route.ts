/**
 * @file route.ts
 * @description OAuth callback endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOAuthProvider, getRedirectUri } from '@/lib/oauth/providers';
import { getTokenManager } from '@/lib/oauth/token-manager';
import { getRedisInstance } from '@/lib/queue/redis';
import { workflowLogger } from '@/lib/monitoring/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/oauth/:provider/callback
 * Handle OAuth callback
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider: providerId } = await params;
    const { searchParams } = req.nextUrl;

    // Get authorization code and state
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for OAuth error
    if (error) {
      const errorDescription = searchParams.get('error_description') || error;
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?section=integrations?error=${encodeURIComponent(errorDescription)}`
      );
    }

    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing code or state parameter' },
        { status: 400 }
      );
    }

    // Verify state parameter
    const redis = getRedisInstance();
    const stateData = await redis.get(`oauth:state:${state}`);

    if (!stateData) {
      return NextResponse.json(
        { error: 'Invalid or expired state parameter' },
        { status: 400 }
      );
    }

    const { userId, providerId: storedProviderId } = JSON.parse(stateData);

    if (storedProviderId !== providerId) {
      return NextResponse.json(
        { error: 'Provider mismatch' },
        { status: 400 }
      );
    }

    // Delete state from Redis
    await redis.del(`oauth:state:${state}`);

    // Get provider config
    const provider = getOAuthProvider(providerId);
    if (!provider) {
      return NextResponse.json(
        { error: 'Unknown provider' },
        { status: 400 }
      );
    }

    // Prepare token request
    const tokenParams: Record<string, string> = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: getRedirectUri(providerId),
      client_id: provider.clientId,
      client_secret: provider.clientSecret,
    };

    // Add PKCE code verifier if needed
    if (provider.pkce) {
      const codeVerifier = await redis.get(`oauth:pkce:${state}`);
      if (codeVerifier) {
        tokenParams.code_verifier = codeVerifier;
        await redis.del(`oauth:pkce:${state}`);
      }
    }

    // Exchange code for tokens
    const tokenResponse = await fetch(provider.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams(tokenParams),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      workflowLogger.error(
        { providerId, error: errorText },
        'OAuth token exchange failed'
      );

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?section=integrations?error=token_exchange_failed`
      );
    }

    const tokenData = await tokenResponse.json();

    // Store tokens
    const tokenManager = getTokenManager();
    const integrationId = await tokenManager.storeTokens({
      userId,
      providerId,
      name: `${provider.name} Account`,
      tokens: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: new Date(Date.now() + (tokenData.expires_in * 1000)),
        scope: tokenData.scope,
        tokenType: tokenData.token_type || 'Bearer',
      },
    });

    workflowLogger.info(
      { integrationId, providerId, userId },
      'OAuth integration connected'
    );

    // Redirect to integrations page with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?section=integrations?success=true&provider=${providerId}&integrationId=${integrationId}`
    );
  } catch (error) {
    workflowLogger.error({ error }, 'OAuth callback error');

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?section=integrations?error=callback_failed`
    );
  }
}
