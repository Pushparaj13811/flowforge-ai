/**
 * @file providers.ts
 * @description OAuth 2.0 provider configurations
 */

export interface OAuthProvider {
  id: string;
  name: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  clientId: string;
  clientSecret: string;
  pkce?: boolean; // Use PKCE flow
}

/**
 * OAuth provider configurations
 * Client ID and Secret should be loaded from environment variables
 */
export const OAUTH_PROVIDERS: Record<string, OAuthProvider> = {
  google: {
    id: 'google',
    name: 'Google',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  },

  github: {
    id: 'github',
    name: 'GitHub',
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scopes: ['repo', 'user:email', 'read:org'],
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  },

  microsoft: {
    id: 'microsoft',
    name: 'Microsoft',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: [
      'openid',
      'profile',
      'email',
      'offline_access',
      'Files.ReadWrite',
      'Calendars.ReadWrite',
    ],
    clientId: process.env.MICROSOFT_CLIENT_ID || '',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
  },

  dropbox: {
    id: 'dropbox',
    name: 'Dropbox',
    authUrl: 'https://www.dropbox.com/oauth2/authorize',
    tokenUrl: 'https://api.dropboxapi.com/oauth2/token',
    scopes: ['files.content.write', 'files.content.read'],
    clientId: process.env.DROPBOX_CLIENT_ID || '',
    clientSecret: process.env.DROPBOX_CLIENT_SECRET || '',
    pkce: true,
  },

  hubspot: {
    id: 'hubspot',
    name: 'HubSpot',
    authUrl: 'https://app.hubspot.com/oauth/authorize',
    tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
    scopes: ['contacts', 'crm.objects.contacts.read', 'crm.objects.contacts.write'],
    clientId: process.env.HUBSPOT_CLIENT_ID || '',
    clientSecret: process.env.HUBSPOT_CLIENT_SECRET || '',
  },
};

/**
 * Map integration type to OAuth provider
 * Some integrations share the same OAuth provider (e.g., Google Sheets and Google Drive both use Google)
 */
const INTEGRATION_TO_PROVIDER: Record<string, string> = {
  'google': 'google',
  'google-sheets': 'google',
  'google-drive': 'google',
  'gmail': 'google',
  'google-calendar': 'google',
  'github': 'github',
  'microsoft': 'microsoft',
  'microsoft-teams': 'microsoft',
  'onedrive': 'microsoft',
  'outlook': 'microsoft',
  'dropbox': 'dropbox',
  'hubspot': 'hubspot',
};

/**
 * Get OAuth provider by ID (supports both direct provider IDs and integration type IDs)
 */
export function getOAuthProvider(providerId: string): OAuthProvider | null {
  // First check if it's a direct provider ID
  if (OAUTH_PROVIDERS[providerId]) {
    return OAUTH_PROVIDERS[providerId];
  }

  // Check if it's an integration type that maps to a provider
  const mappedProviderId = INTEGRATION_TO_PROVIDER[providerId];
  if (mappedProviderId && OAUTH_PROVIDERS[mappedProviderId]) {
    return OAUTH_PROVIDERS[mappedProviderId];
  }

  return null;
}

/**
 * Get the actual provider ID for an integration type
 */
export function getProviderIdForIntegration(integrationTypeId: string): string {
  return INTEGRATION_TO_PROVIDER[integrationTypeId] || integrationTypeId;
}

/**
 * Get redirect URI for OAuth callback
 */
export function getRedirectUri(providerId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/api/oauth/${providerId}/callback`;
}

/**
 * Validate provider configuration
 */
export function validateProviderConfig(providerId: string): {
  valid: boolean;
  errors: string[];
} {
  const provider = getOAuthProvider(providerId);
  const errors: string[] = [];

  if (!provider) {
    const supportedProviders = Object.keys(OAUTH_PROVIDERS).join(', ');
    const supportedIntegrations = Object.keys(INTEGRATION_TO_PROVIDER).join(', ');
    errors.push(`Unknown provider: ${providerId}. Supported OAuth providers: ${supportedProviders}. Supported integration types: ${supportedIntegrations}`);
    return { valid: false, errors };
  }

  if (!provider.clientId) {
    errors.push(`Missing ${provider.name.toUpperCase()}_CLIENT_ID environment variable. Please add it to your .env.local file.`);
  }

  if (!provider.clientSecret) {
    errors.push(`Missing ${provider.name.toUpperCase()}_CLIENT_SECRET environment variable. Please add it to your .env.local file.`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
