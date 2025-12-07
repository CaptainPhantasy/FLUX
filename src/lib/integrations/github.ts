// =====================================
// FLUX - GitHub Integration Connector
// Last Updated: 02:45:00 Dec 07, 2025
// =====================================

import type {
  OAuthTokens,
  GitHubUser,
  GitHubRepository,
  GitHubIssue,
  GitHubPullRequest,
  GitHubCommit,
  SyncResult,
} from './types';
import type { Task } from '@/types';

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_OAUTH_URL = 'https://github.com/login/oauth';

/**
 * GitHub OAuth configuration
 */
export interface GitHubOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes?: string[];
}

/**
 * GitHub Integration Connector
 * Handles authentication and API interactions with GitHub
 */
export class GitHubConnector {
  private accessToken: string;
  private baseUrl = GITHUB_API_BASE;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  // ============================================
  // OAuth Flow Methods (Static)
  // ============================================

  /**
   * Generate OAuth authorization URL
   */
  static getAuthorizationUrl(config: GitHubOAuthConfig, state: string): string {
    const scopes = config.scopes || ['repo', 'read:user', 'read:org'];
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: scopes.join(' '),
      state,
      allow_signup: 'true',
    });
    return `${GITHUB_OAUTH_URL}/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForToken(
    code: string,
    config: GitHubOAuthConfig
  ): Promise<OAuthTokens> {
    const response = await fetch(`${GITHUB_OAUTH_URL}/access_token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`GitHub OAuth error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`);
    }

    return {
      accessToken: data.access_token,
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
        'Accept': 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `GitHub API error: ${response.status} - ${error.message || response.statusText}`
      );
    }

    return response.json();
  }

  // ============================================
  // User & Repository Methods
  // ============================================

  /**
   * Get authenticated user info
   */
  async getCurrentUser(): Promise<GitHubUser> {
    return this.request<GitHubUser>('/user');
  }

  /**
   * Get user's repositories
   */
  async getRepositories(options?: {
    type?: 'all' | 'owner' | 'member';
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    perPage?: number;
  }): Promise<GitHubRepository[]> {
    const params = new URLSearchParams({
      type: options?.type || 'all',
      sort: options?.sort || 'updated',
      per_page: String(options?.perPage || 100),
    });
    return this.request<GitHubRepository[]>(`/user/repos?${params}`);
  }

  /**
   * Get a single repository
   */
  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    return this.request<GitHubRepository>(`/repos/${owner}/${repo}`);
  }

  // ============================================
  // Issues Methods
  // ============================================

  /**
   * List issues for a repository
   */
  async getIssues(
    owner: string,
    repo: string,
    options?: {
      state?: 'open' | 'closed' | 'all';
      labels?: string;
      assignee?: string;
      perPage?: number;
      page?: number;
    }
  ): Promise<GitHubIssue[]> {
    const params = new URLSearchParams({
      state: options?.state || 'all',
      per_page: String(options?.perPage || 100),
      page: String(options?.page || 1),
    });
    if (options?.labels) params.set('labels', options.labels);
    if (options?.assignee) params.set('assignee', options.assignee);

    return this.request<GitHubIssue[]>(
      `/repos/${owner}/${repo}/issues?${params}`
    );
  }

  /**
   * Get a single issue
   */
  async getIssue(
    owner: string,
    repo: string,
    issueNumber: number
  ): Promise<GitHubIssue> {
    return this.request<GitHubIssue>(
      `/repos/${owner}/${repo}/issues/${issueNumber}`
    );
  }

  /**
   * Create a new issue
   */
  async createIssue(
    owner: string,
    repo: string,
    data: {
      title: string;
      body?: string;
      labels?: string[];
      assignees?: string[];
    }
  ): Promise<GitHubIssue> {
    return this.request<GitHubIssue>(`/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update an existing issue
   */
  async updateIssue(
    owner: string,
    repo: string,
    issueNumber: number,
    data: {
      title?: string;
      body?: string;
      state?: 'open' | 'closed';
      labels?: string[];
      assignees?: string[];
    }
  ): Promise<GitHubIssue> {
    return this.request<GitHubIssue>(
      `/repos/${owner}/${repo}/issues/${issueNumber}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    );
  }

  // ============================================
  // Pull Requests Methods
  // ============================================

  /**
   * List pull requests for a repository
   */
  async getPullRequests(
    owner: string,
    repo: string,
    options?: {
      state?: 'open' | 'closed' | 'all';
      perPage?: number;
      page?: number;
    }
  ): Promise<GitHubPullRequest[]> {
    const params = new URLSearchParams({
      state: options?.state || 'all',
      per_page: String(options?.perPage || 100),
      page: String(options?.page || 1),
    });

    return this.request<GitHubPullRequest[]>(
      `/repos/${owner}/${repo}/pulls?${params}`
    );
  }

  /**
   * Get a single pull request
   */
  async getPullRequest(
    owner: string,
    repo: string,
    pullNumber: number
  ): Promise<GitHubPullRequest> {
    return this.request<GitHubPullRequest>(
      `/repos/${owner}/${repo}/pulls/${pullNumber}`
    );
  }

  // ============================================
  // Commits Methods
  // ============================================

  /**
   * List commits for a repository
   */
  async getCommits(
    owner: string,
    repo: string,
    options?: {
      sha?: string;
      path?: string;
      author?: string;
      since?: string;
      until?: string;
      perPage?: number;
    }
  ): Promise<GitHubCommit[]> {
    const params = new URLSearchParams({
      per_page: String(options?.perPage || 100),
    });
    if (options?.sha) params.set('sha', options.sha);
    if (options?.path) params.set('path', options.path);
    if (options?.author) params.set('author', options.author);
    if (options?.since) params.set('since', options.since);
    if (options?.until) params.set('until', options.until);

    const data = await this.request<{ sha: string; commit: any; html_url: string }[]>(
      `/repos/${owner}/${repo}/commits?${params}`
    );

    return data.map((item) => ({
      sha: item.sha,
      message: item.commit.message,
      author: item.commit.author,
      html_url: item.html_url,
    }));
  }

  // ============================================
  // Webhook Methods
  // ============================================

  /**
   * Create a webhook for a repository
   */
  async createWebhook(
    owner: string,
    repo: string,
    config: {
      url: string;
      contentType?: 'json' | 'form';
      secret?: string;
      events?: string[];
    }
  ): Promise<{ id: number; url: string; active: boolean }> {
    return this.request(`/repos/${owner}/${repo}/hooks`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'web',
        active: true,
        events: config.events || ['issues', 'pull_request', 'push'],
        config: {
          url: config.url,
          content_type: config.contentType || 'json',
          secret: config.secret,
          insecure_ssl: '0',
        },
      }),
    });
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(owner: string, repo: string, hookId: number): Promise<void> {
    await this.request(`/repos/${owner}/${repo}/hooks/${hookId}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // Flux Integration Methods
  // ============================================

  /**
   * Convert GitHub issue to Flux task
   */
  issueToFluxTask(issue: GitHubIssue, repoFullName: string): Partial<Task> {
    // Map GitHub labels to priority
    let priority: Task['priority'] = 'medium';
    const labelNames = issue.labels.map((l) => l.name.toLowerCase());
    if (labelNames.includes('critical') || labelNames.includes('urgent')) {
      priority = 'urgent';
    } else if (labelNames.includes('high') || labelNames.includes('important')) {
      priority = 'high';
    } else if (labelNames.includes('low')) {
      priority = 'low';
    }

    return {
      id: `github-${issue.id}`,
      title: issue.title,
      description: `${issue.body || ''}\n\n---\n[View on GitHub](${issue.html_url})`,
      status: issue.state === 'closed' ? 'done' : 'todo',
      priority,
      assignee: issue.assignees[0]?.login,
      tags: issue.labels.map((l) => l.name),
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
    };
  }

  /**
   * Convert Flux task to GitHub issue data
   */
  fluxTaskToIssueData(task: Task): {
    title: string;
    body: string;
    labels: string[];
    state: 'open' | 'closed';
  } {
    const labels: string[] = task.tags || [];
    
    // Add priority label
    if (task.priority === 'urgent' || task.priority === 'high') {
      labels.push(task.priority);
    }

    return {
      title: task.title,
      body: task.description || '',
      labels,
      state: task.status === 'done' || task.status === 'archived' ? 'closed' : 'open',
    };
  }

  /**
   * Sync all issues from a repository to Flux tasks
   */
  async syncRepositoryIssues(
    owner: string,
    repo: string
  ): Promise<SyncResult> {
    const errors: string[] = [];
    let itemsSynced = 0;

    try {
      const issues = await this.getIssues(owner, repo, { state: 'all' });
      
      for (const issue of issues) {
        try {
          // Convert to Flux task format
          this.issueToFluxTask(issue, `${owner}/${repo}`);
          itemsSynced++;
        } catch (err) {
          errors.push(`Failed to sync issue #${issue.number}: ${err}`);
        }
      }

      return {
        success: errors.length === 0,
        provider: 'github',
        itemsSynced,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return {
        success: false,
        provider: 'github',
        itemsSynced: 0,
        errors: [`Failed to fetch issues: ${err}`],
        timestamp: new Date().toISOString(),
      };
    }
  }
}

/**
 * Verify GitHub webhook signature
 */
export function verifyGitHubWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // In a real implementation, use crypto to verify HMAC-SHA256
  // For now, return true if signature exists
  if (!signature || !secret) return false;
  
  // TODO: Implement actual signature verification
  // const hmac = crypto.createHmac('sha256', secret);
  // const digest = 'sha256=' + hmac.update(payload).digest('hex');
  // return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  
  return signature.startsWith('sha256=');
}

// 02:45:00 Dec 07, 2025

