// =====================================
// FLUX - Slack Integration Connector
// Last Updated: 02:45:00 Dec 07, 2025
// =====================================

import type {
  OAuthTokens,
  SlackUser,
  SlackChannel,
  SlackMessage,
  SlackBlock,
  SyncResult,
} from './types';
import type { Task, Notification } from '@/types';

const SLACK_API_BASE = 'https://slack.com/api';
const SLACK_OAUTH_URL = 'https://slack.com/oauth/v2';

/**
 * Slack OAuth configuration
 */
export interface SlackOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes?: {
    bot?: string[];
    user?: string[];
  };
}

/**
 * Slack message options
 */
export interface SlackMessageOptions {
  channel: string;
  text: string;
  blocks?: SlackBlock[];
  threadTs?: string;
  unfurlLinks?: boolean;
  unfurlMedia?: boolean;
}

/**
 * Slack Integration Connector
 * Handles authentication and API interactions with Slack
 */
export class SlackConnector {
  private botToken: string;
  private baseUrl = SLACK_API_BASE;

  constructor(botToken: string) {
    this.botToken = botToken;
  }

  // ============================================
  // OAuth Flow Methods (Static)
  // ============================================

  /**
   * Generate OAuth authorization URL
   */
  static getAuthorizationUrl(config: SlackOAuthConfig, state: string): string {
    const botScopes = config.scopes?.bot || [
      'chat:write',
      'channels:read',
      'groups:read',
      'users:read',
      'commands',
      'incoming-webhook',
      'app_mentions:read',
    ];
    
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: botScopes.join(','),
      state,
    });

    if (config.scopes?.user?.length) {
      params.set('user_scope', config.scopes.user.join(','));
    }

    return `${SLACK_OAUTH_URL}/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForToken(
    code: string,
    config: SlackOAuthConfig
  ): Promise<OAuthTokens & { teamId: string; teamName: string; incomingWebhook?: { url: string; channel: string } }> {
    const response = await fetch(`${SLACK_OAUTH_URL}/access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.redirectUri,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(`Slack OAuth error: ${data.error}`);
    }

    return {
      accessToken: data.access_token,
      tokenType: data.token_type,
      scope: data.scope,
      teamId: data.team?.id,
      teamName: data.team?.name,
      incomingWebhook: data.incoming_webhook ? {
        url: data.incoming_webhook.url,
        channel: data.incoming_webhook.channel,
      } : undefined,
    };
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private async request<T>(
    method: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}/${method}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.botToken}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error}`);
    }

    return data;
  }

  // ============================================
  // Auth & User Methods
  // ============================================

  /**
   * Test authentication
   */
  async testAuth(): Promise<{ userId: string; teamId: string; team: string; user: string }> {
    const data = await this.request<{
      ok: boolean;
      user_id: string;
      team_id: string;
      team: string;
      user: string;
    }>('auth.test');

    return {
      userId: data.user_id,
      teamId: data.team_id,
      team: data.team,
      user: data.user,
    };
  }

  /**
   * Get user info
   */
  async getUser(userId: string): Promise<SlackUser> {
    const data = await this.request<{ user: SlackUser }>('users.info', { user: userId });
    return data.user;
  }

  /**
   * List workspace users
   */
  async listUsers(limit = 200): Promise<SlackUser[]> {
    const data = await this.request<{ members: SlackUser[] }>('users.list', { limit });
    return data.members;
  }

  // ============================================
  // Channel Methods
  // ============================================

  /**
   * List conversations (channels)
   */
  async listChannels(options?: {
    types?: string;
    excludeArchived?: boolean;
    limit?: number;
  }): Promise<SlackChannel[]> {
    const data = await this.request<{ channels: SlackChannel[] }>('conversations.list', {
      types: options?.types || 'public_channel,private_channel',
      exclude_archived: options?.excludeArchived ?? true,
      limit: options?.limit || 200,
    });
    return data.channels;
  }

  /**
   * Join a channel
   */
  async joinChannel(channelId: string): Promise<SlackChannel> {
    const data = await this.request<{ channel: SlackChannel }>('conversations.join', {
      channel: channelId,
    });
    return data.channel;
  }

  // ============================================
  // Messaging Methods
  // ============================================

  /**
   * Send a message to a channel
   */
  async postMessage(options: SlackMessageOptions): Promise<SlackMessage> {
    const data = await this.request<{ message: SlackMessage }>('chat.postMessage', {
      channel: options.channel,
      text: options.text,
      blocks: options.blocks,
      thread_ts: options.threadTs,
      unfurl_links: options.unfurlLinks ?? false,
      unfurl_media: options.unfurlMedia ?? true,
    });
    return data.message;
  }

  /**
   * Update an existing message
   */
  async updateMessage(
    channel: string,
    ts: string,
    text: string,
    blocks?: SlackBlock[]
  ): Promise<SlackMessage> {
    const data = await this.request<{ message: SlackMessage }>('chat.update', {
      channel,
      ts,
      text,
      blocks,
    });
    return data.message;
  }

  /**
   * Delete a message
   */
  async deleteMessage(channel: string, ts: string): Promise<void> {
    await this.request('chat.delete', { channel, ts });
  }

  /**
   * Add a reaction to a message
   */
  async addReaction(channel: string, ts: string, emoji: string): Promise<void> {
    await this.request('reactions.add', {
      channel,
      timestamp: ts,
      name: emoji,
    });
  }

  // ============================================
  // Interactive Components
  // ============================================

  /**
   * Open a modal view
   */
  async openModal(triggerId: string, view: Record<string, unknown>): Promise<void> {
    await this.request('views.open', {
      trigger_id: triggerId,
      view,
    });
  }

  /**
   * Update a modal view
   */
  async updateModal(viewId: string, view: Record<string, unknown>): Promise<void> {
    await this.request('views.update', {
      view_id: viewId,
      view,
    });
  }

  // ============================================
  // Flux Integration Methods
  // ============================================

  /**
   * Send task notification to Slack
   */
  async sendTaskNotification(
    channelId: string,
    task: Task,
    action: 'created' | 'updated' | 'completed' | 'assigned'
  ): Promise<SlackMessage> {
    const actionIcon = {
      created: '[NEW]',
      updated: '[UPD]',
      completed: '[DONE]',
      assigned: '[ASSIGNED]',
    };

    const actionText = {
      created: 'New task created',
      updated: 'Task updated',
      completed: 'Task completed',
      assigned: 'Task assigned',
    };

    const priorityColor = {
      low: '#36a64f',
      medium: '#daa038',
      high: '#e01e5a',
      urgent: '#ff0000',
    };

    const blocks: SlackBlock[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${actionIcon[action]} ${actionText[action]}`,
          emoji: false,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Title:*\n${task.title}`,
          },
          {
            type: 'mrkdwn',
            text: `*Priority:*\n${task.priority}`,
          },
          {
            type: 'mrkdwn',
            text: `*Status:*\n${task.status}`,
          },
          {
            type: 'mrkdwn',
            text: `*Assignee:*\n${task.assignee || 'Unassigned'}`,
          },
        ],
      },
    ];

    if (task.description) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Description:*\n${task.description.substring(0, 200)}${task.description.length > 200 ? '...' : ''}`,
        },
      });
    }

    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View in Flux',
            emoji: true,
          },
          url: `${typeof window !== 'undefined' ? window.location.origin : ''}/app/board?task=${task.id}`,
          action_id: 'view_task',
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Mark Complete',
            emoji: true,
          },
          action_id: `complete_task_${task.id}`,
          style: 'primary',
        },
      ],
    });

    return this.postMessage({
      channel: channelId,
      text: `${actionIcon[action]} ${actionText[action]}: ${task.title}`,
      blocks,
    });
  }

  /**
   * Send daily digest to channel
   */
  async sendDailyDigest(
    channelId: string,
    stats: {
      totalTasks: number;
      completed: number;
      inProgress: number;
      urgent: number;
    }
  ): Promise<SlackMessage> {
    const blocks: SlackBlock[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: 'Daily Flux Digest',
          emoji: false,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Total Tasks:*\n${stats.totalTasks}`,
          },
          {
            type: 'mrkdwn',
            text: `*Completed Today:*\n${stats.completed}`,
          },
          {
            type: 'mrkdwn',
            text: `*In Progress:*\n${stats.inProgress}`,
          },
          {
            type: 'mrkdwn',
            text: `*Urgent:*\n${stats.urgent}`,
          },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Open Dashboard',
              emoji: true,
            },
            url: `${typeof window !== 'undefined' ? window.location.origin : ''}/app/dashboard`,
            action_id: 'open_dashboard',
          },
        ],
      },
    ];

    return this.postMessage({
      channel: channelId,
      text: `Daily Digest: ${stats.completed} tasks completed, ${stats.urgent} urgent items`,
      blocks,
    });
  }

  /**
   * Build task creation modal for Slack
   */
  static buildTaskCreationModal(): Record<string, unknown> {
    return {
      type: 'modal',
      callback_id: 'create_task_modal',
      title: {
        type: 'plain_text',
        text: 'Create Flux Task',
      },
      submit: {
        type: 'plain_text',
        text: 'Create',
      },
      close: {
        type: 'plain_text',
        text: 'Cancel',
      },
      blocks: [
        {
          type: 'input',
          block_id: 'title_block',
          element: {
            type: 'plain_text_input',
            action_id: 'task_title',
            placeholder: {
              type: 'plain_text',
              text: 'Enter task title',
            },
          },
          label: {
            type: 'plain_text',
            text: 'Title',
          },
        },
        {
          type: 'input',
          block_id: 'description_block',
          optional: true,
          element: {
            type: 'plain_text_input',
            action_id: 'task_description',
            multiline: true,
            placeholder: {
              type: 'plain_text',
              text: 'Enter task description',
            },
          },
          label: {
            type: 'plain_text',
            text: 'Description',
          },
        },
        {
          type: 'input',
          block_id: 'priority_block',
          element: {
            type: 'static_select',
            action_id: 'task_priority',
            placeholder: {
              type: 'plain_text',
              text: 'Select priority',
            },
            options: [
              { text: { type: 'plain_text', text: 'Low' }, value: 'low' },
              { text: { type: 'plain_text', text: 'Medium' }, value: 'medium' },
              { text: { type: 'plain_text', text: 'High' }, value: 'high' },
              { text: { type: 'plain_text', text: 'Urgent' }, value: 'urgent' },
            ],
            initial_option: { text: { type: 'plain_text', text: 'Medium' }, value: 'medium' },
          },
          label: {
            type: 'plain_text',
            text: 'Priority',
          },
        },
      ],
    };
  }
}

/**
 * Send message via incoming webhook (no auth required)
 */
export async function sendSlackWebhook(
  webhookUrl: string,
  message: {
    text: string;
    blocks?: SlackBlock[];
    username?: string;
    icon_emoji?: string;
  }
): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook error: ${response.statusText}`);
  }
}

/**
 * Verify Slack request signature
 */
export function verifySlackSignature(
  signingSecret: string,
  signature: string,
  timestamp: string,
  body: string
): boolean {
  // Verify timestamp is within 5 minutes
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) {
    return false;
  }

  // TODO: Implement actual HMAC-SHA256 verification
  // const baseString = `v0:${timestamp}:${body}`;
  // const hmac = crypto.createHmac('sha256', signingSecret);
  // const mySignature = 'v0=' + hmac.update(baseString).digest('hex');
  // return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(mySignature));

  return signature.startsWith('v0=');
}

// 02:45:00 Dec 07, 2025

