// =====================================
// FLUX - Unified Integration Service
// Last Updated: 02:45:00 Dec 07, 2025
// =====================================

import type {
  IntegrationProvider,
  IntegrationConfig,
  ConnectionStatus,
  OAuthTokens,
  OAuthState,
  SyncResult,
} from './types';
import { GitHubConnector, type GitHubOAuthConfig } from './github';
import { SlackConnector, type SlackOAuthConfig } from './slack';
import { FigmaConnector, type FigmaOAuthConfig } from './figma';
import { TrelloConnector, type TrelloAuthConfig } from './trello';
import { GmailConnector, type GoogleOAuthConfig } from './gmail';
import { VercelConnector } from './vercel';
import { SupabaseConnector, type SupabaseConfig } from './supabase-connector';
import { AWSConnector } from './aws';
import type { AWSCredentials } from './types';

/**
 * Environment configuration for OAuth
 */
interface OAuthEnvironment {
  github?: GitHubOAuthConfig;
  slack?: SlackOAuthConfig;
  figma?: FigmaOAuthConfig;
  trello?: TrelloAuthConfig;
  gmail?: GoogleOAuthConfig;
}

/**
 * Integration connection result
 */
interface ConnectionResult {
  success: boolean;
  provider: IntegrationProvider;
  config?: IntegrationConfig;
  error?: string;
}

/**
 * Unified Integration Service
 * Manages all integration connections, authentication, and syncing
 */
export class IntegrationService {
  private configs: Map<IntegrationProvider, IntegrationConfig> = new Map();
  private connectors: Map<IntegrationProvider, unknown> = new Map();
  private oauthEnv: OAuthEnvironment = {};
  private pendingOAuthStates: Map<string, OAuthState> = new Map();
  private storageKey = 'flux_integrations';

  constructor() {
    this.loadFromStorage();
    this.initOAuthConfig();
  }

  // ============================================
  // Initialization
  // ============================================

  /**
   * Initialize OAuth configuration from environment
   */
  private initOAuthConfig(): void {
    // These would come from environment variables in a real app
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

    this.oauthEnv = {
      github: {
        clientId: import.meta.env?.VITE_GITHUB_CLIENT_ID || '',
        clientSecret: import.meta.env?.VITE_GITHUB_CLIENT_SECRET || '',
        redirectUri: `${baseUrl}/api/integrations/github/callback`,
      },
      slack: {
        clientId: import.meta.env?.VITE_SLACK_CLIENT_ID || '',
        clientSecret: import.meta.env?.VITE_SLACK_CLIENT_SECRET || '',
        redirectUri: `${baseUrl}/api/integrations/slack/callback`,
      },
      figma: {
        clientId: import.meta.env?.VITE_FIGMA_CLIENT_ID || '',
        clientSecret: import.meta.env?.VITE_FIGMA_CLIENT_SECRET || '',
        redirectUri: `${baseUrl}/api/integrations/figma/callback`,
      },
      trello: {
        apiKey: import.meta.env?.VITE_TRELLO_API_KEY || '',
        appName: 'Flux',
        returnUrl: `${baseUrl}/api/integrations/trello/callback`,
      },
      gmail: {
        clientId: import.meta.env?.VITE_GOOGLE_CLIENT_ID || '',
        clientSecret: import.meta.env?.VITE_GOOGLE_CLIENT_SECRET || '',
        redirectUri: `${baseUrl}/api/integrations/gmail/callback`,
      },
    };
  }

  /**
   * Load saved integrations from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const configs: IntegrationConfig[] = JSON.parse(saved);
        configs.forEach((config) => {
          this.configs.set(config.provider, config);
        });
      }
    } catch (err) {
      console.error('Failed to load integrations from storage:', err);
    }
  }

  /**
   * Save integrations to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const configs = Array.from(this.configs.values());
      localStorage.setItem(this.storageKey, JSON.stringify(configs));
    } catch (err) {
      console.error('Failed to save integrations to storage:', err);
    }
  }

  // ============================================
  // OAuth Flow Management
  // ============================================

  /**
   * Generate OAuth state for CSRF protection
   */
  private generateOAuthState(provider: IntegrationProvider, userId: string): string {
    const nonce = Math.random().toString(36).substring(2, 15);
    const state: OAuthState = {
      provider,
      userId,
      redirectUrl: typeof window !== 'undefined' ? window.location.href : '',
      timestamp: Date.now(),
      nonce,
    };

    const stateString = btoa(JSON.stringify(state));
    this.pendingOAuthStates.set(stateString, state);

    // Clean up old states (older than 10 minutes)
    this.cleanupOAuthStates();

    return stateString;
  }

  /**
   * Validate OAuth state
   */
  private validateOAuthState(stateString: string): OAuthState | null {
    const state = this.pendingOAuthStates.get(stateString);
    if (!state) return null;

    // Check if state is too old (10 minutes)
    if (Date.now() - state.timestamp > 10 * 60 * 1000) {
      this.pendingOAuthStates.delete(stateString);
      return null;
    }

    this.pendingOAuthStates.delete(stateString);
    return state;
  }

  /**
   * Clean up expired OAuth states
   */
  private cleanupOAuthStates(): void {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes

    this.pendingOAuthStates.forEach((state, key) => {
      if (now - state.timestamp > maxAge) {
        this.pendingOAuthStates.delete(key);
      }
    });
  }

  /**
   * Get OAuth authorization URL
   */
  getAuthorizationUrl(provider: IntegrationProvider, userId: string): string | null {
    const state = this.generateOAuthState(provider, userId);

    switch (provider) {
      case 'github':
        if (!this.oauthEnv.github?.clientId) return null;
        return GitHubConnector.getAuthorizationUrl(this.oauthEnv.github, state);

      case 'slack':
        if (!this.oauthEnv.slack?.clientId) return null;
        return SlackConnector.getAuthorizationUrl(this.oauthEnv.slack, state);

      case 'figma':
        if (!this.oauthEnv.figma?.clientId) return null;
        return FigmaConnector.getAuthorizationUrl(this.oauthEnv.figma, state);

      case 'trello':
        if (!this.oauthEnv.trello?.apiKey) return null;
        return TrelloConnector.getAuthorizationUrl(this.oauthEnv.trello);

      case 'gmail':
        if (!this.oauthEnv.gmail?.clientId) return null;
        return GmailConnector.getAuthorizationUrl(this.oauthEnv.gmail, state);

      default:
        return null;
    }
  }

  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(
    provider: IntegrationProvider,
    code: string,
    state: string
  ): Promise<ConnectionResult> {
    // Validate state
    const oauthState = this.validateOAuthState(state);
    if (!oauthState) {
      return { success: false, provider, error: 'Invalid or expired OAuth state' };
    }

    try {
      let tokens: OAuthTokens;
      let metadata: IntegrationConfig['metadata'] = {};

      switch (provider) {
        case 'github': {
          if (!this.oauthEnv.github) throw new Error('GitHub not configured');
          tokens = await GitHubConnector.exchangeCodeForToken(code, this.oauthEnv.github);
          const gh = new GitHubConnector(tokens.accessToken);
          const user = await gh.getCurrentUser();
          metadata = { accountName: user.login, accountEmail: user.email || undefined, avatarUrl: user.avatar_url };
          break;
        }

        case 'slack': {
          if (!this.oauthEnv.slack) throw new Error('Slack not configured');
          const slackTokens = await SlackConnector.exchangeCodeForToken(code, this.oauthEnv.slack);
          tokens = slackTokens;
          metadata = { workspaceName: slackTokens.teamName, teamId: slackTokens.teamId };
          break;
        }

        case 'figma': {
          if (!this.oauthEnv.figma) throw new Error('Figma not configured');
          tokens = await FigmaConnector.exchangeCodeForToken(code, this.oauthEnv.figma);
          const figma = new FigmaConnector(tokens.accessToken);
          const figmaUser = await figma.getCurrentUser();
          metadata = { accountName: figmaUser.handle, accountEmail: figmaUser.email, avatarUrl: figmaUser.img_url };
          break;
        }

        case 'gmail': {
          if (!this.oauthEnv.gmail) throw new Error('Gmail not configured');
          tokens = await GmailConnector.exchangeCodeForToken(code, this.oauthEnv.gmail);
          const gmail = new GmailConnector(tokens.accessToken);
          const profile = await gmail.getProfile();
          metadata = { accountEmail: profile.emailAddress };
          break;
        }

        default:
          return { success: false, provider, error: 'Unsupported provider for OAuth' };
      }

      // Save the configuration
      const config: IntegrationConfig = {
        id: `${provider}-${oauthState.userId}`,
        provider,
        status: 'connected',
        credentials: tokens,
        connectedAt: new Date().toISOString(),
        userId: oauthState.userId,
        metadata,
      };

      this.configs.set(provider, config);
      this.saveToStorage();

      return { success: true, provider, config };
    } catch (err) {
      console.error(`OAuth callback error for ${provider}:`, err);
      return { success: false, provider, error: String(err) };
    }
  }

  // ============================================
  // Direct Authentication (Non-OAuth)
  // ============================================

  /**
   * Connect with API key/token (Trello, Vercel)
   */
  async connectWithApiKey(
    provider: IntegrationProvider,
    credentials: { apiKey: string; token?: string; teamId?: string },
    userId: string
  ): Promise<ConnectionResult> {
    try {
      let metadata: IntegrationConfig['metadata'] = {};

      switch (provider) {
        case 'trello': {
          if (!credentials.token) {
            return { success: false, provider, error: 'Trello requires both API key and token' };
          }
          const trello = new TrelloConnector(credentials.apiKey, credentials.token);
          const member = await trello.getCurrentMember();
          metadata = { accountName: member.username, avatarUrl: member.avatarUrl || undefined };
          break;
        }

        case 'vercel': {
          const vercel = new VercelConnector(credentials.apiKey, credentials.teamId);
          const user = await vercel.getCurrentUser();
          metadata = { accountName: user.username, accountEmail: user.email, avatarUrl: user.avatar || undefined };
          break;
        }

        default:
          return { success: false, provider, error: 'Provider does not support API key auth' };
      }

      const config: IntegrationConfig = {
        id: `${provider}-${userId}`,
        provider,
        status: 'connected',
        credentials: { apiKey: credentials.apiKey, token: credentials.token },
        connectedAt: new Date().toISOString(),
        userId,
        metadata,
        settings: credentials.teamId ? { teamId: credentials.teamId } : undefined,
      };

      this.configs.set(provider, config);
      this.saveToStorage();

      return { success: true, provider, config };
    } catch (err) {
      console.error(`API key connection error for ${provider}:`, err);
      return { success: false, provider, error: String(err) };
    }
  }

  /**
   * Connect Supabase
   */
  async connectSupabase(
    config: SupabaseConfig,
    userId: string
  ): Promise<ConnectionResult> {
    try {
      const supabase = new SupabaseConnector(config);
      const testResult = await supabase.testConnection();

      if (!testResult.connected) {
        return { success: false, provider: 'supabase', error: testResult.error || 'Connection failed' };
      }

      const integrationConfig: IntegrationConfig = {
        id: `supabase-${userId}`,
        provider: 'supabase',
        status: 'connected',
        credentials: { apiKey: config.anonKey },
        connectedAt: new Date().toISOString(),
        userId,
        settings: { url: config.url },
        metadata: { workspaceName: new URL(config.url).hostname },
      };

      this.configs.set('supabase', integrationConfig);
      this.saveToStorage();

      return { success: true, provider: 'supabase', config: integrationConfig };
    } catch (err) {
      return { success: false, provider: 'supabase', error: String(err) };
    }
  }

  /**
   * Connect AWS
   */
  async connectAWS(
    credentials: AWSCredentials,
    userId: string
  ): Promise<ConnectionResult> {
    try {
      const aws = new AWSConnector(credentials);
      const testResult = await aws.testCredentials();

      if (!testResult.valid) {
        return { success: false, provider: 'aws', error: testResult.error || 'Invalid credentials' };
      }

      const config: IntegrationConfig = {
        id: `aws-${userId}`,
        provider: 'aws',
        status: 'connected',
        credentials,
        connectedAt: new Date().toISOString(),
        userId,
        metadata: { accountName: testResult.accountId },
        settings: { region: credentials.region },
      };

      this.configs.set('aws', config);
      this.saveToStorage();

      return { success: true, provider: 'aws', config };
    } catch (err) {
      return { success: false, provider: 'aws', error: String(err) };
    }
  }

  // ============================================
  // Connection Management
  // ============================================

  /**
   * Get integration configuration
   */
  getConfig(provider: IntegrationProvider): IntegrationConfig | undefined {
    return this.configs.get(provider);
  }

  /**
   * Get all integration configurations
   */
  getAllConfigs(): IntegrationConfig[] {
    return Array.from(this.configs.values());
  }

  /**
   * Check if integration is connected
   */
  isConnected(provider: IntegrationProvider): boolean {
    const config = this.configs.get(provider);
    return config?.status === 'connected';
  }

  /**
   * Get connection status
   */
  getStatus(provider: IntegrationProvider): ConnectionStatus {
    return this.configs.get(provider)?.status || 'disconnected';
  }

  /**
   * Disconnect an integration
   */
  disconnect(provider: IntegrationProvider): void {
    this.configs.delete(provider);
    this.connectors.delete(provider);
    this.saveToStorage();
  }

  /**
   * Update integration settings
   */
  updateSettings(provider: IntegrationProvider, settings: Record<string, unknown>): void {
    const config = this.configs.get(provider);
    if (config) {
      config.settings = { ...config.settings, ...settings };
      this.saveToStorage();
    }
  }

  // ============================================
  // Connector Access
  // ============================================

  /**
   * Get or create a connector instance
   */
  getConnector<T>(provider: IntegrationProvider): T | null {
    // Check cache
    const cached = this.connectors.get(provider);
    if (cached) return cached as T;

    const config = this.configs.get(provider);
    if (!config || config.status !== 'connected' || !config.credentials) {
      return null;
    }

    let connector: unknown;
    const creds = config.credentials;

    switch (provider) {
      case 'github':
        if ('accessToken' in creds) {
          connector = new GitHubConnector(creds.accessToken);
        }
        break;

      case 'slack':
        if ('accessToken' in creds) {
          connector = new SlackConnector(creds.accessToken);
        }
        break;

      case 'figma':
        if ('accessToken' in creds) {
          connector = new FigmaConnector(creds.accessToken);
        }
        break;

      case 'trello':
        if ('apiKey' in creds && creds.token) {
          connector = new TrelloConnector(creds.apiKey, creds.token);
        }
        break;

      case 'gmail':
        if ('accessToken' in creds) {
          connector = new GmailConnector(creds.accessToken);
        }
        break;

      case 'vercel':
        if ('apiKey' in creds) {
          const teamId = config.settings?.teamId as string | undefined;
          connector = new VercelConnector(creds.apiKey, teamId);
        }
        break;

      case 'supabase':
        if ('apiKey' in creds && config.settings?.url) {
          connector = new SupabaseConnector({
            url: config.settings.url as string,
            anonKey: creds.apiKey,
          });
        }
        break;

      case 'aws':
        if ('accessKeyId' in creds) {
          connector = new AWSConnector(creds as AWSCredentials);
        }
        break;
    }

    if (connector) {
      this.connectors.set(provider, connector);
    }

    return connector as T | null;
  }

  // ============================================
  // Sync Operations
  // ============================================

  /**
   * Sync a specific integration
   */
  async sync(provider: IntegrationProvider): Promise<SyncResult> {
    const config = this.configs.get(provider);
    if (!config || config.status !== 'connected') {
      return {
        success: false,
        provider,
        itemsSynced: 0,
        errors: ['Integration not connected'],
        timestamp: new Date().toISOString(),
      };
    }

    try {
      // Update last sync timestamp
      config.lastSyncAt = new Date().toISOString();
      this.saveToStorage();

      // Provider-specific sync logic would go here
      // For now, return success
      return {
        success: true,
        provider,
        itemsSynced: 0,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return {
        success: false,
        provider,
        itemsSynced: 0,
        errors: [String(err)],
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Sync all connected integrations
   */
  async syncAll(): Promise<SyncResult[]> {
    const connectedProviders = Array.from(this.configs.entries())
      .filter(([, config]) => config.status === 'connected')
      .map(([provider]) => provider);

    const results = await Promise.all(
      connectedProviders.map((provider) => this.sync(provider))
    );

    return results;
  }
}

// Singleton instance
export const integrationService = new IntegrationService();

// 02:45:00 Dec 07, 2025

