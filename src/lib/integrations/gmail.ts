// =====================================
// FLUX - Gmail Integration Connector
// Last Updated: 00:46:31 Dec 08, 2025
// =====================================
// 
// Gmail OAuth 2.0 XOAUTH2 Implementation
// 
// This connector implements Google's OAuth 2.0 XOAUTH2 protocol for IMAP/SMTP access.
// 
// SETUP REQUIREMENTS:
// 1. Create OAuth 2.0 credentials in Google Cloud Console:
//    - Go to https://console.cloud.google.com/apis/credentials
//    - Create OAuth 2.0 Client ID (Web application)
//    - Add authorized redirect URI: https://your-domain.com/app/appearance
//    - Copy Client ID and Client Secret
// 
// 2. Set environment variables:
//    - VITE_GOOGLE_CLIENT_ID=your-client-id
//    - VITE_GOOGLE_CLIENT_SECRET=your-client-secret
// 
// 3. OAuth Scope:
//    - Uses https://mail.google.com/ scope (required for IMAP/SMTP via XOAUTH2)
//    - This scope provides full access to Gmail via IMAP, POP, and SMTP
//    - According to Google's documentation, apps using this scope must comply with
//      Google API Services: User Data Policy
// 
// XOAUTH2 AUTHENTICATION:
// - Format: user=<email>\x01auth=Bearer <access_token>\x01\x01
// - Base64-encoded and used with IMAP AUTHENTICATE, POP AUTH, or SMTP AUTH commands
// - See: https://developers.google.com/workspace/gmail/imap/xoauth2-protocol
//

import type {
  OAuthTokens,
  GmailProfile,
  GmailMessage,
  GmailLabel,
  SyncResult,
} from './types';
import type { Task } from '@/types';

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1';
const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

/**
 * Google OAuth configuration
 */
export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes?: string[];
}

/**
 * Gmail message query options
 */
export interface GmailQueryOptions {
  query?: string;
  maxResults?: number;
  pageToken?: string;
  labelIds?: string[];
  includeSpamTrash?: boolean;
}

/**
 * Gmail send message options
 */
export interface GmailSendOptions {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  isHtml?: boolean;
  threadId?: string;
}

/**
 * Gmail Integration Connector
 * Handles authentication and API interactions with Gmail
 */
export class GmailConnector {
  private accessToken: string;
  private baseUrl = GMAIL_API_BASE;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  // ============================================
  // OAuth Flow Methods (Static)
  // ============================================

  /**
   * Generate OAuth authorization URL
   * For IMAP/SMTP access, uses https://mail.google.com/ scope
   * This scope allows full access to Gmail via IMAP, POP, and SMTP using XOAUTH2
   */
  static getAuthorizationUrl(config: GoogleOAuthConfig, state: string): string {
    // Use IMAP/SMTP scope for XOAUTH2 access, or custom scopes if provided
    const scopes = config.scopes || [
      'https://mail.google.com/', // Required for IMAP/POP/SMTP access via XOAUTH2
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      state,
      access_type: 'offline', // Required to get refresh token
      prompt: 'consent', // Force consent screen to ensure refresh token
    });

    return `${GOOGLE_OAUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  static async exchangeCodeForToken(
    code: string,
    config: GoogleOAuthConfig
  ): Promise<OAuthTokens> {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code',
        code,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Google OAuth error: ${error.error_description || error.error}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
      tokenType: data.token_type,
      scope: data.scope,
    };
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(
    refreshToken: string,
    config: GoogleOAuthConfig
  ): Promise<OAuthTokens> {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh Google access token');
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: refreshToken, // Refresh token doesn't change
      expiresAt: Date.now() + data.expires_in * 1000,
      tokenType: data.token_type,
      scope: data.scope,
    };
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Gmail API error: ${response.status} - ${error.error?.message || response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Decode base64url encoded string
   */
  private decodeBase64Url(data: string): string {
    // Convert base64url to base64
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    // Decode
    try {
      return decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } catch {
      return atob(base64);
    }
  }

  /**
   * Encode string to base64url
   */
  private encodeBase64Url(str: string): string {
    const base64 = btoa(unescape(encodeURIComponent(str)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  // ============================================
  // Profile Methods
  // ============================================

  /**
   * Get user profile
   */
  async getProfile(): Promise<GmailProfile> {
    return this.request<GmailProfile>('/users/me/profile');
  }

  // ============================================
  // Message Methods
  // ============================================

  /**
   * List messages
   */
  async listMessages(options?: GmailQueryOptions): Promise<{
    messages: { id: string; threadId: string }[];
    nextPageToken?: string;
    resultSizeEstimate: number;
  }> {
    const params = new URLSearchParams();
    if (options?.query) params.set('q', options.query);
    if (options?.maxResults) params.set('maxResults', String(options.maxResults));
    if (options?.pageToken) params.set('pageToken', options.pageToken);
    if (options?.labelIds?.length) params.set('labelIds', options.labelIds.join(','));
    if (options?.includeSpamTrash) params.set('includeSpamTrash', 'true');

    const queryString = params.toString();
    return this.request(`/users/me/messages${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Get a single message
   */
  async getMessage(
    messageId: string,
    format: 'minimal' | 'full' | 'raw' | 'metadata' = 'full'
  ): Promise<GmailMessage> {
    return this.request<GmailMessage>(`/users/me/messages/${messageId}?format=${format}`);
  }

  /**
   * Parse message headers
   */
  parseMessageHeaders(message: GmailMessage): {
    from: string;
    to: string;
    subject: string;
    date: string;
  } {
    const headers = message.payload?.headers || [];
    const getHeader = (name: string) =>
      headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    return {
      from: getHeader('From'),
      to: getHeader('To'),
      subject: getHeader('Subject'),
      date: getHeader('Date'),
    };
  }

  /**
   * Extract message body
   */
  extractMessageBody(message: GmailMessage): { text: string; html: string } {
    let text = '';
    let html = '';

    const extractFromPart = (part: any) => {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        text = this.decodeBase64Url(part.body.data);
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        html = this.decodeBase64Url(part.body.data);
      } else if (part.parts) {
        part.parts.forEach(extractFromPart);
      }
    };

    if (message.payload?.body?.data) {
      text = this.decodeBase64Url(message.payload.body.data);
    } else if (message.payload?.parts) {
      message.payload.parts.forEach(extractFromPart);
    }

    return { text, html };
  }

  /**
   * Send a message
   */
  async sendMessage(options: GmailSendOptions): Promise<GmailMessage> {
    const boundary = `flux_${Date.now()}`;
    const mimeType = options.isHtml ? 'text/html' : 'text/plain';

    let rawMessage = [
      `From: me`,
      `To: ${options.to.join(', ')}`,
      options.cc?.length ? `Cc: ${options.cc.join(', ')}` : '',
      options.bcc?.length ? `Bcc: ${options.bcc.join(', ')}` : '',
      `Subject: ${options.subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: ${mimeType}; charset="UTF-8"`,
      '',
      options.body,
    ]
      .filter(Boolean)
      .join('\r\n');

    const encodedMessage = this.encodeBase64Url(rawMessage);

    const body: Record<string, string> = { raw: encodedMessage };
    if (options.threadId) {
      body.threadId = options.threadId;
    }

    return this.request<GmailMessage>('/users/me/messages/send', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Reply to a message
   */
  async replyToMessage(
    originalMessage: GmailMessage,
    body: string,
    isHtml = false
  ): Promise<GmailMessage> {
    const headers = this.parseMessageHeaders(originalMessage);
    
    return this.sendMessage({
      to: [headers.from],
      subject: headers.subject.startsWith('Re:') ? headers.subject : `Re: ${headers.subject}`,
      body,
      isHtml,
      threadId: originalMessage.threadId,
    });
  }

  /**
   * Trash a message
   */
  async trashMessage(messageId: string): Promise<GmailMessage> {
    return this.request<GmailMessage>(`/users/me/messages/${messageId}/trash`, {
      method: 'POST',
    });
  }

  /**
   * Untrash a message
   */
  async untrashMessage(messageId: string): Promise<GmailMessage> {
    return this.request<GmailMessage>(`/users/me/messages/${messageId}/untrash`, {
      method: 'POST',
    });
  }

  /**
   * Modify message labels
   */
  async modifyMessage(
    messageId: string,
    addLabelIds?: string[],
    removeLabelIds?: string[]
  ): Promise<GmailMessage> {
    return this.request<GmailMessage>(`/users/me/messages/${messageId}/modify`, {
      method: 'POST',
      body: JSON.stringify({
        addLabelIds: addLabelIds || [],
        removeLabelIds: removeLabelIds || [],
      }),
    });
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<GmailMessage> {
    return this.modifyMessage(messageId, [], ['UNREAD']);
  }

  /**
   * Mark message as unread
   */
  async markAsUnread(messageId: string): Promise<GmailMessage> {
    return this.modifyMessage(messageId, ['UNREAD'], []);
  }

  // ============================================
  // Label Methods
  // ============================================

  /**
   * List labels
   */
  async listLabels(): Promise<GmailLabel[]> {
    const data = await this.request<{ labels: GmailLabel[] }>('/users/me/labels');
    return data.labels;
  }

  /**
   * Get a label
   */
  async getLabel(labelId: string): Promise<GmailLabel> {
    return this.request<GmailLabel>(`/users/me/labels/${labelId}`);
  }

  /**
   * Create a label
   */
  async createLabel(name: string): Promise<GmailLabel> {
    return this.request<GmailLabel>('/users/me/labels', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  // ============================================
  // Watch (Push Notifications) Methods
  // ============================================

  /**
   * Set up push notifications for mailbox changes
   */
  async watchMailbox(topicName: string, labelIds?: string[]): Promise<{
    historyId: string;
    expiration: string;
  }> {
    return this.request('/users/me/watch', {
      method: 'POST',
      body: JSON.stringify({
        topicName,
        labelIds: labelIds || ['INBOX'],
        labelFilterAction: 'include',
      }),
    });
  }

  /**
   * Stop push notifications
   */
  async stopWatch(): Promise<void> {
    await this.request('/users/me/stop', { method: 'POST' });
  }

  // ============================================
  // XOAUTH2 Methods for IMAP/SMTP
  // ============================================

  /**
   * Generate XOAUTH2 authentication string for IMAP/SMTP
   * Format: user=<email>\x01auth=Bearer <access_token>\x01\x01
   * This string is base64-encoded and used with AUTHENTICATE XOAUTH2 command
   */
  static generateXOAUTH2String(email: string, accessToken: string): string {
    // Create the XOAUTH2 string according to Google's spec
    const authString = `user=${email}\x01auth=Bearer ${accessToken}\x01\x01`;
    // Base64 encode
    return btoa(authString).replace(/\r\n/g, '');
  }

  /**
   * Generate XOAUTH2 authentication string (instance method)
   */
  async generateXOAUTH2StringForEmail(email: string): Promise<string> {
    // Ensure token is fresh
    const token = await this.ensureValidToken();
    return GmailConnector.generateXOAUTH2String(email, token);
  }

  /**
   * Ensure access token is valid, refresh if needed
   */
  private async ensureValidToken(): Promise<string> {
    // This would check expiration and refresh if needed
    // For now, just return the current token
    // In production, you'd check expiresAt and refresh if expired
    return this.accessToken;
  }

  /**
   * Get IMAP/SMTP connection info for Gmail
   */
  static getGmailConnectionInfo() {
    return {
      imap: {
        host: 'imap.gmail.com',
        port: 993,
        secure: true, // Use TLS
        authMethod: 'XOAUTH2',
      },
      smtp: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // Use STARTTLS
        authMethod: 'XOAUTH2',
      },
      pop3: {
        host: 'pop.gmail.com',
        port: 995,
        secure: true, // Use TLS
        authMethod: 'XOAUTH2',
      },
    };
  }

  // ============================================
  // Flux Integration Methods
  // ============================================

  /**
   * Convert email to Flux task
   */
  async emailToFluxTask(messageId: string): Promise<Partial<Task>> {
    const message = await this.getMessage(messageId);
    const headers = this.parseMessageHeaders(message);
    const body = this.extractMessageBody(message);

    // Determine priority from subject or sender
    let priority: Task['priority'] = 'medium';
    const subject = headers.subject.toLowerCase();
    if (
      subject.includes('urgent') ||
      subject.includes('asap') ||
      subject.includes('critical')
    ) {
      priority = 'urgent';
    } else if (subject.includes('important') || subject.includes('high priority')) {
      priority = 'high';
    }

    return {
      id: `gmail-${messageId}`,
      title: headers.subject || 'No Subject',
      description: [
        `**From:** ${headers.from}`,
        `**Date:** ${headers.date}`,
        '',
        '---',
        '',
        body.text || body.html?.replace(/<[^>]+>/g, '') || message.snippet,
      ].join('\n'),
      status: 'todo',
      priority,
      tags: ['email'],
      createdAt: new Date(parseInt(message.internalDate)).toISOString(),
    };
  }

  /**
   * Search for actionable emails
   */
  async findActionableEmails(options?: {
    daysBack?: number;
    excludeLabels?: string[];
  }): Promise<{ id: string; threadId: string }[]> {
    const daysBack = options?.daysBack || 7;
    const afterDate = new Date();
    afterDate.setDate(afterDate.getDate() - daysBack);
    const afterTimestamp = Math.floor(afterDate.getTime() / 1000);

    // Query for emails that might need action
    const query = [
      `after:${afterTimestamp}`,
      'in:inbox',
      '-is:chat',
      // Look for action-oriented keywords
      '(subject:action OR subject:todo OR subject:follow-up OR subject:request OR subject:please)',
    ].join(' ');

    const result = await this.listMessages({
      query,
      maxResults: 50,
    });

    return result.messages || [];
  }

  /**
   * Create Flux task from email and apply label
   */
  async convertEmailToTask(
    messageId: string,
    fluxLabelName = 'Flux/Tasks'
  ): Promise<{
    task: Partial<Task>;
    message: GmailMessage;
  }> {
    // Get or create Flux label
    const labels = await this.listLabels();
    let fluxLabel = labels.find((l) => l.name === fluxLabelName);
    if (!fluxLabel) {
      fluxLabel = await this.createLabel(fluxLabelName);
    }

    // Convert to task
    const task = await this.emailToFluxTask(messageId);

    // Apply label to message
    const message = await this.modifyMessage(messageId, [fluxLabel.id]);

    return { task, message };
  }

  /**
   * Sync inbox to Flux tasks
   */
  async syncInboxToFlux(options?: {
    maxMessages?: number;
    query?: string;
  }): Promise<SyncResult> {
    const errors: string[] = [];
    let itemsSynced = 0;

    try {
      const messages = await this.listMessages({
        query: options?.query || 'in:inbox is:unread',
        maxResults: options?.maxMessages || 20,
      });

      for (const msg of messages.messages || []) {
        try {
          await this.emailToFluxTask(msg.id);
          itemsSynced++;
        } catch (err) {
          errors.push(`Failed to sync message ${msg.id}: ${err}`);
        }
      }

      return {
        success: errors.length === 0,
        provider: 'gmail',
        itemsSynced,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return {
        success: false,
        provider: 'gmail',
        itemsSynced: 0,
        errors: [`Failed to fetch messages: ${err}`],
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// 00:46:31 Dec 08, 2025

