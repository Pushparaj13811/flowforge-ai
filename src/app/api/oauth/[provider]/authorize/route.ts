/**
 * @file route.ts
 * @description OAuth authorization endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/utils';
import { getOAuthProvider, getRedirectUri, validateProviderConfig } from '@/lib/oauth/providers';
import { getRedisInstance } from '@/lib/queue/redis';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * GET /api/oauth/:provider/authorize
 * Initiate OAuth flow
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider: providerId } = await params;

    // Get session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate provider
    const validation = validateProviderConfig(providerId);
    if (!validation.valid) {
      console.error(`[OAuth] Provider ${providerId} not configured:`, validation.errors);
      return NextResponse.json(
        {
          error: 'OAuth provider not configured',
          message: `To use ${providerId}, you need to set up OAuth credentials in your .env.local file.`,
          details: validation.errors,
          help: 'See the documentation for setting up OAuth integrations.',
        },
        { status: 400 }
      );
    }

    const provider = getOAuthProvider(providerId)!;

    // Generate state parameter for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');

    // Store state in Redis with user ID (expires in 10 minutes)
    const redis = getRedisInstance();
    await redis.setex(
      `oauth:state:${state}`,
      600, // 10 minutes
      JSON.stringify({
        userId: session.id,
        providerId,
        timestamp: Date.now(),
      })
    );

    // Build authorization URL
    const authUrl = new URL(provider.authUrl);
    authUrl.searchParams.set('client_id', provider.clientId);
    authUrl.searchParams.set('redirect_uri', getRedirectUri(providerId));
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', provider.scopes.join(' '));
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('access_type', 'offline'); // Request refresh token
    authUrl.searchParams.set('prompt', 'consent'); // Force consent to get refresh token

    // PKCE support (for providers that require it)
    if (provider.pkce) {
      const codeVerifier = crypto.randomBytes(32).toString('base64url');
      const codeChallenge = crypto
        .createHash('sha256')
        .update(codeVerifier)
        .digest('base64url');

      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');

      // Store code verifier
      await redis.setex(
        `oauth:pkce:${state}`,
        600,
        codeVerifier
      );
    }

    // Redirect to provider
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('OAuth authorize error:', error);
    return NextResponse.json(
      {
        error: 'Failed to initiate OAuth flow',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
