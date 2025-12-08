// =====================================
// FLUX - API Client for Edge Functions
// =====================================
// Typed client for calling Supabase Edge Functions

import { supabase } from '@/lib/supabase-client';

/** API Response wrapper */
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

/** Pagination parameters */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/** Task filters */
export interface TaskFilters extends PaginationParams {
  projectId?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
}

/** Task input */
export interface TaskInput {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  tags?: string[];
  assignee?: string;
  dueDate?: string;
  projectId?: string;
}

/** Email search filters */
export interface EmailFilters extends PaginationParams {
  accountId?: string;
  folder?: string;
  isRead?: boolean;
  search?: string;
  from?: string;
  to?: string;
  subject?: string;
  hasAttachments?: boolean;
  startDate?: string;
  endDate?: string;
}

/**
 * FLUX API Client
 * Typed wrapper for Supabase Edge Functions
 */
export class FluxAPIClient {
  private baseUrl: string;

  constructor() {
    // Edge functions URL is derived from Supabase URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    this.baseUrl = `${supabaseUrl}/functions/v1`;
  }

  /**
   * Make an authenticated request to an Edge Function
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    try {
      // Get current session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.error?.code || 'REQUEST_FAILED',
            message: data.error?.message || `Request failed with status ${response.status}`,
            details: data.error?.details,
          },
        };
      }

      return {
        success: true,
        data: data.data,
        meta: data.meta,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network request failed',
        },
      };
    }
  }

  // ==================
  // Users
  // ==================

  async getCurrentUser() {
    return this.request('/users/me');
  }

  async updateCurrentUser(data: { name?: string; avatar?: string }) {
    return this.request('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateUserPreferences(preferences: Record<string, unknown>) {
    return this.request('/users/me/preferences', {
      method: 'PATCH',
      body: JSON.stringify(preferences),
    });
  }

  // ==================
  // Tasks
  // ==================

  async listTasks(filters?: TaskFilters) {
    const params = new URLSearchParams();
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.projectId) params.set('projectId', filters.projectId);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.priority) params.set('priority', filters.priority);
    if (filters?.assigneeId) params.set('assigneeId', filters.assigneeId);

    const query = params.toString();
    return this.request(`/tasks${query ? `?${query}` : ''}`);
  }

  async getTask(id: string) {
    return this.request(`/tasks/${id}`);
  }

  async createTask(input: TaskInput) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateTask(id: string, updates: Partial<TaskInput>) {
    return this.request(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteTask(id: string) {
    return this.request(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  async moveTask(id: string, status: string, order?: number) {
    return this.request(`/tasks/${id}/move`, {
      method: 'POST',
      body: JSON.stringify({ status, order }),
    });
  }

  async archiveTasks(ids: string[]) {
    return this.request('/tasks/archive', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }

  async bulkUpdateTasks(ids: string[], updates: { status?: string; priority?: string }) {
    return this.request('/tasks/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ ids, ...updates }),
    });
  }

  // ==================
  // Projects
  // ==================

  async listProjects(params?: PaginationParams) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const queryStr = query.toString();
    return this.request(`/projects${queryStr ? `?${queryStr}` : ''}`);
  }

  async getProject(id: string) {
    return this.request(`/projects/${id}`);
  }

  async createProject(data: { name: string; description?: string; color?: string }) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, updates: { name?: string; description?: string; color?: string }) {
    return this.request(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteProject(id: string) {
    return this.request(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================
  // Notifications
  // ==================

  async listNotifications(params?: PaginationParams & { unreadOnly?: boolean }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.unreadOnly) query.set('unreadOnly', 'true');

    const queryStr = query.toString();
    return this.request(`/notifications${queryStr ? `?${queryStr}` : ''}`);
  }

  async markNotificationRead(id: string) {
    return this.request(`/notifications/${id}/read`, {
      method: 'POST',
    });
  }

  async markAllNotificationsRead() {
    return this.request('/notifications/mark-all-read', {
      method: 'POST',
    });
  }

  async deleteNotification(id: string) {
    return this.request(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================
  // Emails
  // ==================

  async listEmails(filters?: EmailFilters) {
    const params = new URLSearchParams();
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.accountId) params.set('accountId', filters.accountId);
    if (filters?.folder) params.set('folder', filters.folder);
    if (filters?.isRead !== undefined) params.set('isRead', String(filters.isRead));
    if (filters?.search) params.set('search', filters.search);

    const query = params.toString();
    return this.request(`/emails${query ? `?${query}` : ''}`);
  }

  async getEmail(id: string) {
    return this.request(`/emails/${id}`);
  }

  async searchEmails(query: string, filters?: Omit<EmailFilters, 'search'>) {
    return this.request('/emails/search', {
      method: 'POST',
      body: JSON.stringify({ query, ...filters }),
    });
  }

  async markEmailRead(id: string, isRead = true) {
    return this.request(`/emails/${id}/read`, {
      method: 'POST',
      body: JSON.stringify({ isRead }),
    });
  }

  async moveEmail(id: string, folder: string) {
    return this.request(`/emails/${id}/move`, {
      method: 'POST',
      body: JSON.stringify({ folder }),
    });
  }

  async deleteEmailLocal(id: string) {
    return this.request(`/emails/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================
  // AI / Agent
  // ==================

  async aiChat(message: string) {
    return this.request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async aiGenerateTasks(description: string) {
    return this.request('/ai/generate-tasks', {
      method: 'POST',
      body: JSON.stringify({ description }),
    });
  }

  async aiAnalyzeWorkflow() {
    return this.request('/ai/analyze-workflow', {
      method: 'POST',
    });
  }

  async aiTriageIncident(incidentId: string) {
    return this.request('/ai/triage-incident', {
      method: 'POST',
      body: JSON.stringify({ incidentId }),
    });
  }

  async aiPredictSLA(incidentId: string) {
    return this.request('/ai/predict-sla', {
      method: 'POST',
      body: JSON.stringify({ incidentId }),
    });
  }

  async agentExecute(tool: string, args: Record<string, unknown>) {
    return this.request('/agent/execute', {
      method: 'POST',
      body: JSON.stringify({ tool, arguments: args }),
    });
  }

  async agentListTools() {
    return this.request('/agent/tools');
  }

  // ==================
  // Analytics
  // ==================

  async getAnalyticsDashboard(timeRange?: string) {
    const params = timeRange ? `?timeRange=${timeRange}` : '';
    return this.request(`/analytics/dashboard${params}`);
  }

  async getTaskMetrics(timeRange?: string) {
    const params = timeRange ? `?timeRange=${timeRange}` : '';
    return this.request(`/analytics/tasks${params}`);
  }

  async generateReport(config: { type: string; format: string; timeRange: string }) {
    return this.request('/analytics/report', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  // ==================
  // Integrations
  // ==================

  async listIntegrations() {
    return this.request('/integrations');
  }

  async connectIntegration(type: string, config: Record<string, unknown>) {
    return this.request('/integrations/connect', {
      method: 'POST',
      body: JSON.stringify({ type, config }),
    });
  }

  async disconnectIntegration(type: string) {
    return this.request(`/integrations/${type}/disconnect`, {
      method: 'POST',
    });
  }

  // ==================
  // Webhooks
  // ==================

  async listWebhooks() {
    return this.request('/webhooks');
  }

  async createWebhook(data: { url: string; events: string[]; secret?: string }) {
    return this.request('/webhooks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteWebhook(id: string) {
    return this.request(`/webhooks/${id}`, {
      method: 'DELETE',
    });
  }
}

// Singleton instance
let instance: FluxAPIClient | null = null;

export function getAPIClient(): FluxAPIClient {
  if (!instance) {
    instance = new FluxAPIClient();
  }
  return instance;
}

export default FluxAPIClient;

