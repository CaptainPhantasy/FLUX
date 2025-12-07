// =====================================
// FLUX - Vercel Integration Connector
// Last Updated: 02:45:00 Dec 07, 2025
// =====================================

import type {
  VercelUser,
  VercelProject,
  VercelDeployment,
  SyncResult,
} from './types';

const VERCEL_API_BASE = 'https://api.vercel.com';

/**
 * Vercel deployment state
 */
export type VercelDeploymentState =
  | 'QUEUED'
  | 'BUILDING'
  | 'READY'
  | 'ERROR'
  | 'CANCELED'
  | 'INITIALIZING';

/**
 * Vercel deployment options
 */
export interface VercelDeploymentOptions {
  target?: 'production' | 'preview';
  ref?: string;
  sha?: string;
  force?: boolean;
}

/**
 * Vercel project domain
 */
export interface VercelDomain {
  name: string;
  apexName: string;
  verified: boolean;
  gitBranch?: string;
}

/**
 * Vercel Integration Connector
 * Handles API interactions with Vercel
 */
export class VercelConnector {
  private token: string;
  private teamId?: string;
  private baseUrl = VERCEL_API_BASE;

  constructor(token: string, teamId?: string) {
    this.token = token;
    this.teamId = teamId;
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (this.teamId) {
      url.searchParams.set('teamId', this.teamId);
    }

    const response = await fetch(url.toString(), {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Vercel API error: ${response.status} - ${error.error?.message || response.statusText}`
      );
    }

    return response.json();
  }

  // ============================================
  // User Methods
  // ============================================

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<VercelUser> {
    const data = await this.request<{ user: VercelUser }>('/v2/user');
    return data.user;
  }

  /**
   * List user's teams
   */
  async listTeams(): Promise<{
    teams: { id: string; slug: string; name: string; avatar?: string }[];
  }> {
    return this.request('/v2/teams');
  }

  // ============================================
  // Project Methods
  // ============================================

  /**
   * List projects
   */
  async listProjects(options?: {
    limit?: number;
    from?: number;
    search?: string;
  }): Promise<{
    projects: VercelProject[];
    pagination: { count: number; next: number | null };
  }> {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.from) params.set('from', String(options.from));
    if (options?.search) params.set('search', options.search);

    const queryString = params.toString();
    return this.request(`/v9/projects${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Get a project
   */
  async getProject(projectIdOrName: string): Promise<VercelProject> {
    return this.request<VercelProject>(`/v9/projects/${projectIdOrName}`);
  }

  /**
   * Get project domains
   */
  async getProjectDomains(projectId: string): Promise<{
    domains: VercelDomain[];
  }> {
    return this.request(`/v9/projects/${projectId}/domains`);
  }

  /**
   * Get project environment variables
   */
  async getProjectEnvVars(projectId: string): Promise<{
    envs: {
      id: string;
      key: string;
      value: string;
      target: ('production' | 'preview' | 'development')[];
      type: 'plain' | 'secret' | 'encrypted';
    }[];
  }> {
    return this.request(`/v9/projects/${projectId}/env`);
  }

  // ============================================
  // Deployment Methods
  // ============================================

  /**
   * List deployments
   */
  async listDeployments(options?: {
    projectId?: string;
    limit?: number;
    from?: number;
    state?: VercelDeploymentState;
    target?: 'production' | 'preview';
  }): Promise<{
    deployments: VercelDeployment[];
    pagination: { count: number; next: number | null };
  }> {
    const params = new URLSearchParams();
    if (options?.projectId) params.set('projectId', options.projectId);
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.from) params.set('from', String(options.from));
    if (options?.state) params.set('state', options.state);
    if (options?.target) params.set('target', options.target);

    const queryString = params.toString();
    return this.request(`/v6/deployments${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Get a deployment
   */
  async getDeployment(deploymentId: string): Promise<VercelDeployment & {
    readyState: VercelDeploymentState;
    alias: string[];
    aliasError?: { code: string; message: string };
    createdIn: string;
    buildingAt?: number;
    ready?: number;
  }> {
    return this.request(`/v13/deployments/${deploymentId}`);
  }

  /**
   * Get deployment events (logs)
   */
  async getDeploymentEvents(deploymentId: string): Promise<{
    events: {
      type: string;
      created: number;
      payload: { text?: string; deploymentId?: string };
    }[];
  }> {
    return this.request(`/v3/deployments/${deploymentId}/events`);
  }

  /**
   * Cancel a deployment
   */
  async cancelDeployment(deploymentId: string): Promise<VercelDeployment> {
    return this.request(`/v12/deployments/${deploymentId}/cancel`, {
      method: 'PATCH',
    });
  }

  /**
   * Trigger a deployment via deploy hook
   */
  async triggerDeployHook(hookUrl: string): Promise<{
    job: { id: string; state: string; createdAt: number };
  }> {
    const response = await fetch(hookUrl, { method: 'POST' });
    if (!response.ok) {
      throw new Error(`Deploy hook error: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Create a deployment (from GitHub)
   */
  async createDeployment(
    projectId: string,
    options?: VercelDeploymentOptions
  ): Promise<VercelDeployment> {
    const body: Record<string, unknown> = {
      name: projectId,
      target: options?.target || 'production',
    };

    if (options?.ref || options?.sha) {
      body.gitSource = {
        type: 'github',
        ref: options.ref,
        sha: options.sha,
      };
    }

    if (options?.force) {
      body.forceNew = true;
    }

    return this.request('/v13/deployments', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Promote deployment to production
   */
  async promoteToProduction(deploymentId: string): Promise<void> {
    const deployment = await this.getDeployment(deploymentId);
    if (deployment.state !== 'READY') {
      throw new Error('Can only promote ready deployments');
    }

    // Create alias to production domain
    // This is a simplified version - full implementation would handle custom domains
    await this.request(`/v2/deployments/${deploymentId}/aliases`, {
      method: 'POST',
      body: JSON.stringify({ alias: deployment.url }),
    });
  }

  // ============================================
  // Webhook Methods
  // ============================================

  /**
   * List webhooks
   */
  async listWebhooks(projectId: string): Promise<{
    hooks: {
      id: string;
      url: string;
      events: string[];
      createdAt: number;
    }[];
  }> {
    return this.request(`/v1/webhooks?projectId=${projectId}`);
  }

  /**
   * Create a webhook
   */
  async createWebhook(
    projectId: string,
    url: string,
    events: string[]
  ): Promise<{ id: string; secret: string }> {
    return this.request('/v1/webhooks', {
      method: 'POST',
      body: JSON.stringify({
        url,
        events,
        projectIds: [projectId],
      }),
    });
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    await this.request(`/v1/webhooks/${webhookId}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // Flux Integration Methods
  // ============================================

  /**
   * Get deployment status for Flux dashboard
   */
  async getDeploymentStatus(deploymentId: string): Promise<{
    id: string;
    url: string;
    state: VercelDeploymentState;
    target: string | null;
    createdAt: number;
    buildingAt?: number;
    readyAt?: number;
    errorMessage?: string;
    duration?: number;
    commit?: { ref: string; sha: string; message?: string };
  }> {
    const deployment = await this.getDeployment(deploymentId);

    let duration: number | undefined;
    if (deployment.buildingAt && deployment.ready) {
      duration = deployment.ready - deployment.buildingAt;
    }

    return {
      id: deployment.uid,
      url: `https://${deployment.url}`,
      state: deployment.readyState || deployment.state,
      target: deployment.target,
      createdAt: deployment.createdAt,
      buildingAt: deployment.buildingAt,
      readyAt: deployment.ready,
      duration,
      commit: deployment.meta?.githubCommitSha
        ? {
            ref: deployment.meta.githubCommitRef || 'main',
            sha: deployment.meta.githubCommitSha,
          }
        : undefined,
    };
  }

  /**
   * Get project health summary for Flux
   */
  async getProjectHealth(projectId: string): Promise<{
    projectName: string;
    latestDeployment?: {
      id: string;
      state: VercelDeploymentState;
      url: string;
      createdAt: number;
    };
    recentDeployments: number;
    successRate: number;
    domains: string[];
  }> {
    const [project, deploymentsData, domainsData] = await Promise.all([
      this.getProject(projectId),
      this.listDeployments({ projectId, limit: 10 }),
      this.getProjectDomains(projectId),
    ]);

    const deployments = deploymentsData.deployments;
    const successCount = deployments.filter((d) => d.state === 'READY').length;
    const successRate = deployments.length > 0 ? successCount / deployments.length : 1;

    const latest = deployments[0];

    return {
      projectName: project.name,
      latestDeployment: latest
        ? {
            id: latest.uid,
            state: latest.state,
            url: `https://${latest.url}`,
            createdAt: latest.createdAt,
          }
        : undefined,
      recentDeployments: deployments.length,
      successRate,
      domains: domainsData.domains.map((d) => d.name),
    };
  }

  /**
   * Sync Vercel deployments to Flux
   */
  async syncDeploymentsToFlux(projectId?: string): Promise<SyncResult> {
    const errors: string[] = [];
    let itemsSynced = 0;

    try {
      const { deployments } = await this.listDeployments({
        projectId,
        limit: 50,
      });

      for (const deployment of deployments) {
        try {
          await this.getDeploymentStatus(deployment.uid);
          itemsSynced++;
        } catch (err) {
          errors.push(`Failed to sync deployment ${deployment.uid}: ${err}`);
        }
      }

      return {
        success: errors.length === 0,
        provider: 'vercel',
        itemsSynced,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return {
        success: false,
        provider: 'vercel',
        itemsSynced: 0,
        errors: [`Failed to fetch deployments: ${err}`],
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Create deployment notification for Flux
   */
  formatDeploymentNotification(deployment: VercelDeployment): {
    title: string;
    description: string;
    type: 'info' | 'success' | 'warning' | 'error';
  } {
    const stateIndicator: Record<VercelDeploymentState, string> = {
      QUEUED: '[QUEUED]',
      INITIALIZING: '[INIT]',
      BUILDING: '[BUILD]',
      READY: '[OK]',
      ERROR: '[ERR]',
      CANCELED: '[CANCEL]',
    };

    const stateType: Record<VercelDeploymentState, 'info' | 'success' | 'warning' | 'error'> = {
      QUEUED: 'info',
      INITIALIZING: 'info',
      BUILDING: 'info',
      READY: 'success',
      ERROR: 'error',
      CANCELED: 'warning',
    };

    const indicator = stateIndicator[deployment.state] || '[DEPLOY]';
    const type = stateType[deployment.state] || 'info';

    return {
      title: `${indicator} Deployment ${deployment.state.toLowerCase()}`,
      description: `${deployment.name} - ${deployment.target || 'preview'}\n${deployment.url}`,
      type,
    };
  }
}

// 02:45:00 Dec 07, 2025

