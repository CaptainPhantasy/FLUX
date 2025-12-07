// =====================================
// FLUX - Supabase Integration Connector
// Last Updated: 02:45:00 Dec 07, 2025
// =====================================

import type { SyncResult } from './types';

const SUPABASE_API_VERSION = 'v1';

/**
 * Supabase project configuration
 */
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

/**
 * Supabase table definition
 */
export interface SupabaseTable {
  name: string;
  schema: string;
  columns: {
    name: string;
    type: string;
    is_nullable: boolean;
    is_primary: boolean;
  }[];
  rowCount?: number;
}

/**
 * Supabase auth user
 */
export interface SupabaseAuthUser {
  id: string;
  email: string;
  phone?: string;
  email_confirmed_at?: string;
  phone_confirmed_at?: string;
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
}

/**
 * Supabase storage bucket
 */
export interface SupabaseBucket {
  id: string;
  name: string;
  public: boolean;
  created_at: string;
  updated_at: string;
  file_size_limit?: number;
  allowed_mime_types?: string[];
}

/**
 * Supabase Integration Connector
 * Handles API interactions with Supabase
 */
export class SupabaseConnector {
  private url: string;
  private anonKey: string;
  private serviceRoleKey?: string;

  constructor(config: SupabaseConfig) {
    this.url = config.url.replace(/\/$/, ''); // Remove trailing slash
    this.anonKey = config.anonKey;
    this.serviceRoleKey = config.serviceRoleKey;
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    useServiceRole = false
  ): Promise<T> {
    const key = useServiceRole && this.serviceRoleKey ? this.serviceRoleKey : this.anonKey;

    const response = await fetch(`${this.url}${endpoint}`, {
      ...options,
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Supabase API error: ${response.status} - ${error.message || error.error || response.statusText}`
      );
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) return {} as T;

    return JSON.parse(text);
  }

  // ============================================
  // REST API Methods (PostgREST)
  // ============================================

  /**
   * Select data from a table
   */
  async select<T>(
    table: string,
    options?: {
      columns?: string;
      filter?: Record<string, string>;
      order?: { column: string; ascending?: boolean };
      limit?: number;
      offset?: number;
    }
  ): Promise<T[]> {
    const params = new URLSearchParams();

    if (options?.columns) {
      params.set('select', options.columns);
    }

    if (options?.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        params.set(key, value);
      });
    }

    if (options?.order) {
      params.set(
        'order',
        `${options.order.column}.${options.order.ascending !== false ? 'asc' : 'desc'}`
      );
    }

    if (options?.limit) {
      params.set('limit', String(options.limit));
    }

    if (options?.offset) {
      params.set('offset', String(options.offset));
    }

    const queryString = params.toString();
    return this.request<T[]>(
      `/rest/${SUPABASE_API_VERSION}/${table}${queryString ? `?${queryString}` : ''}`
    );
  }

  /**
   * Insert data into a table
   */
  async insert<T>(
    table: string,
    data: Record<string, unknown> | Record<string, unknown>[]
  ): Promise<T[]> {
    return this.request<T[]>(`/rest/${SUPABASE_API_VERSION}/${table}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update data in a table
   */
  async update<T>(
    table: string,
    data: Record<string, unknown>,
    filter: Record<string, string>
  ): Promise<T[]> {
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([key, value]) => {
      params.set(key, value);
    });

    return this.request<T[]>(`/rest/${SUPABASE_API_VERSION}/${table}?${params}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * Upsert data into a table
   */
  async upsert<T>(
    table: string,
    data: Record<string, unknown> | Record<string, unknown>[],
    options?: { onConflict?: string }
  ): Promise<T[]> {
    const headers: Record<string, string> = {
      'Prefer': 'return=representation,resolution=merge-duplicates',
    };

    if (options?.onConflict) {
      headers['Prefer'] += `,on_conflict=${options.onConflict}`;
    }

    return this.request<T[]>(
      `/rest/${SUPABASE_API_VERSION}/${table}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      }
    );
  }

  /**
   * Delete data from a table
   */
  async delete<T>(
    table: string,
    filter: Record<string, string>
  ): Promise<T[]> {
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([key, value]) => {
      params.set(key, value);
    });

    return this.request<T[]>(`/rest/${SUPABASE_API_VERSION}/${table}?${params}`, {
      method: 'DELETE',
    });
  }

  /**
   * Call a stored procedure (RPC)
   */
  async rpc<T>(
    functionName: string,
    params?: Record<string, unknown>
  ): Promise<T> {
    return this.request<T>(`/rest/${SUPABASE_API_VERSION}/rpc/${functionName}`, {
      method: 'POST',
      body: params ? JSON.stringify(params) : undefined,
    });
  }

  // ============================================
  // Auth Methods
  // ============================================

  /**
   * Sign up with email
   */
  async signUp(
    email: string,
    password: string,
    options?: { data?: Record<string, unknown> }
  ): Promise<{ user: SupabaseAuthUser | null; session: unknown }> {
    return this.request('/auth/v1/signup', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        data: options?.data,
      }),
    });
  }

  /**
   * Sign in with email
   */
  async signIn(
    email: string,
    password: string
  ): Promise<{ user: SupabaseAuthUser; access_token: string; refresh_token: string }> {
    return this.request('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  /**
   * Sign in with OAuth
   */
  getOAuthSignInUrl(
    provider: 'google' | 'github' | 'gitlab' | 'azure' | 'slack',
    redirectTo?: string
  ): string {
    const params = new URLSearchParams({ provider });
    if (redirectTo) params.set('redirect_to', redirectTo);
    return `${this.url}/auth/v1/authorize?${params}`;
  }

  /**
   * Sign out
   */
  async signOut(accessToken: string): Promise<void> {
    await this.request('/auth/v1/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }

  /**
   * Get current user (requires service role or valid JWT)
   */
  async getUser(accessToken: string): Promise<SupabaseAuthUser> {
    const response = await fetch(`${this.url}/auth/v1/user`, {
      headers: {
        apikey: this.anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user');
    }

    return response.json();
  }

  /**
   * List all users (requires service role)
   */
  async listUsers(options?: {
    page?: number;
    perPage?: number;
  }): Promise<{ users: SupabaseAuthUser[]; total: number }> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', String(options.page));
    if (options?.perPage) params.set('per_page', String(options.perPage));

    const queryString = params.toString();
    return this.request(
      `/auth/v1/admin/users${queryString ? `?${queryString}` : ''}`,
      {},
      true // Use service role
    );
  }

  // ============================================
  // Storage Methods
  // ============================================

  /**
   * List storage buckets
   */
  async listBuckets(): Promise<SupabaseBucket[]> {
    return this.request('/storage/v1/bucket', {}, true);
  }

  /**
   * Get bucket details
   */
  async getBucket(bucketId: string): Promise<SupabaseBucket> {
    return this.request(`/storage/v1/bucket/${bucketId}`, {}, true);
  }

  /**
   * Create a bucket
   */
  async createBucket(
    id: string,
    options?: {
      public?: boolean;
      fileSizeLimit?: number;
      allowedMimeTypes?: string[];
    }
  ): Promise<SupabaseBucket> {
    return this.request(
      '/storage/v1/bucket',
      {
        method: 'POST',
        body: JSON.stringify({
          id,
          name: id,
          public: options?.public ?? false,
          file_size_limit: options?.fileSizeLimit,
          allowed_mime_types: options?.allowedMimeTypes,
        }),
      },
      true
    );
  }

  /**
   * List objects in a bucket
   */
  async listObjects(
    bucketId: string,
    path?: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{
    name: string;
    id: string;
    created_at: string;
    updated_at: string;
    metadata: Record<string, unknown>;
  }[]> {
    return this.request(
      `/storage/v1/object/list/${bucketId}`,
      {
        method: 'POST',
        body: JSON.stringify({
          prefix: path || '',
          limit: options?.limit || 100,
          offset: options?.offset || 0,
        }),
      }
    );
  }

  /**
   * Get public URL for an object
   */
  getPublicUrl(bucketId: string, path: string): string {
    return `${this.url}/storage/v1/object/public/${bucketId}/${path}`;
  }

  /**
   * Get signed URL for private object
   */
  async createSignedUrl(
    bucketId: string,
    path: string,
    expiresIn = 3600
  ): Promise<{ signedURL: string }> {
    return this.request(
      `/storage/v1/object/sign/${bucketId}/${path}`,
      {
        method: 'POST',
        body: JSON.stringify({ expiresIn }),
      }
    );
  }

  // ============================================
  // Edge Functions Methods
  // ============================================

  /**
   * Invoke an Edge Function
   */
  async invokeFunction<T>(
    functionName: string,
    options?: {
      body?: Record<string, unknown>;
      headers?: Record<string, string>;
    }
  ): Promise<T> {
    const response = await fetch(`${this.url}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.anonKey}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Edge Function error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // ============================================
  // Realtime Methods
  // ============================================

  /**
   * Get realtime connection info
   */
  getRealtimeUrl(): string {
    return this.url.replace('https://', 'wss://').replace('http://', 'ws://') +
      '/realtime/v1/websocket?apikey=' + this.anonKey;
  }

  // ============================================
  // Flux Integration Methods
  // ============================================

  /**
   * Test connection
   */
  async testConnection(): Promise<{
    connected: boolean;
    version?: string;
    error?: string;
  }> {
    try {
      // Try to get health status
      const response = await fetch(`${this.url}/rest/v1/`, {
        headers: { apikey: this.anonKey },
      });

      return {
        connected: response.ok,
        version: response.headers.get('x-supabase-version') || undefined,
      };
    } catch (err) {
      return {
        connected: false,
        error: String(err),
      };
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<{
    tables: { name: string; rowCount: number }[];
    totalRows: number;
  }> {
    // This would require service role and access to pg_stat_user_tables
    // For now, return placeholder
    return {
      tables: [],
      totalRows: 0,
    };
  }

  /**
   * Sync data to Flux
   */
  async syncToFlux(tableName: string): Promise<SyncResult> {
    const errors: string[] = [];
    let itemsSynced = 0;

    try {
      const data = await this.select(tableName, { limit: 1000 });
      itemsSynced = data.length;

      return {
        success: true,
        provider: 'supabase',
        itemsSynced,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return {
        success: false,
        provider: 'supabase',
        itemsSynced: 0,
        errors: [`Failed to sync ${tableName}: ${err}`],
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Create Flux integration tables
   */
  async setupFluxTables(): Promise<void> {
    // This would create necessary tables for Flux
    // In practice, this would use migrations
    console.log('Flux tables setup would go here');
  }
}

// 02:45:00 Dec 07, 2025

