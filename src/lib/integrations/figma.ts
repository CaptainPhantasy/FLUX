// =====================================
// FLUX - Figma Integration Connector
// Last Updated: 02:45:00 Dec 07, 2025
// =====================================

import type {
  OAuthTokens,
  FigmaUser,
  FigmaProject,
  FigmaFile,
  FigmaComment,
  SyncResult,
} from './types';

const FIGMA_API_BASE = 'https://api.figma.com/v1';
const FIGMA_OAUTH_URL = 'https://www.figma.com/oauth';

/**
 * Figma OAuth configuration
 */
export interface FigmaOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes?: string[];
}

/**
 * Figma file node structure
 */
export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Figma image export options
 */
export interface FigmaImageOptions {
  format?: 'jpg' | 'png' | 'svg' | 'pdf';
  scale?: number;
  svgIncludeId?: boolean;
  svgSimplifyStroke?: boolean;
}

/**
 * Figma Integration Connector
 * Handles authentication and API interactions with Figma
 */
export class FigmaConnector {
  private accessToken: string;
  private baseUrl = FIGMA_API_BASE;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  // ============================================
  // OAuth Flow Methods (Static)
  // ============================================

  /**
   * Generate OAuth authorization URL
   */
  static getAuthorizationUrl(config: FigmaOAuthConfig, state: string): string {
    const scopes = config.scopes || ['files:read'];
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: scopes.join(','),
      state,
      response_type: 'code',
    });
    return `${FIGMA_OAUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForToken(
    code: string,
    config: FigmaOAuthConfig
  ): Promise<OAuthTokens> {
    const response = await fetch('https://www.figma.com/api/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Figma OAuth error: ${error}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(
    refreshToken: string,
    config: FigmaOAuthConfig
  ): Promise<OAuthTokens> {
    const response = await fetch('https://www.figma.com/api/oauth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh Figma token');
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'X-Figma-Token': this.accessToken,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Figma API error: ${response.status} - ${error.message || error.err || response.statusText}`
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
  async getCurrentUser(): Promise<FigmaUser> {
    return this.request<FigmaUser>('/me');
  }

  // ============================================
  // Team & Project Methods
  // ============================================

  /**
   * Get team projects
   */
  async getTeamProjects(teamId: string): Promise<FigmaProject[]> {
    const data = await this.request<{ projects: FigmaProject[] }>(
      `/teams/${teamId}/projects`
    );
    return data.projects;
  }

  /**
   * Get project files
   */
  async getProjectFiles(projectId: string): Promise<FigmaFile[]> {
    const data = await this.request<{ files: FigmaFile[] }>(
      `/projects/${projectId}/files`
    );
    return data.files;
  }

  // ============================================
  // File Methods
  // ============================================

  /**
   * Get file data
   */
  async getFile(
    fileKey: string,
    options?: {
      version?: string;
      depth?: number;
      geometry?: 'paths' | 'bounds';
      pluginData?: string;
    }
  ): Promise<{
    name: string;
    lastModified: string;
    thumbnailUrl: string;
    version: string;
    document: FigmaNode;
    components: Record<string, unknown>;
    styles: Record<string, unknown>;
  }> {
    const params = new URLSearchParams();
    if (options?.version) params.set('version', options.version);
    if (options?.depth) params.set('depth', String(options.depth));
    if (options?.geometry) params.set('geometry', options.geometry);
    if (options?.pluginData) params.set('plugin_data', options.pluginData);

    const queryString = params.toString();
    const endpoint = `/files/${fileKey}${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  }

  /**
   * Get file nodes
   */
  async getFileNodes(
    fileKey: string,
    nodeIds: string[]
  ): Promise<Record<string, { document: FigmaNode; components: Record<string, unknown> }>> {
    const params = new URLSearchParams({ ids: nodeIds.join(',') });
    const data = await this.request<{ nodes: Record<string, any> }>(
      `/files/${fileKey}/nodes?${params}`
    );
    return data.nodes;
  }

  /**
   * Get file images (export nodes as images)
   */
  async getFileImages(
    fileKey: string,
    nodeIds: string[],
    options?: FigmaImageOptions
  ): Promise<Record<string, string>> {
    const params = new URLSearchParams({
      ids: nodeIds.join(','),
      format: options?.format || 'png',
      scale: String(options?.scale || 1),
    });

    if (options?.svgIncludeId) params.set('svg_include_id', 'true');
    if (options?.svgSimplifyStroke) params.set('svg_simplify_stroke', 'true');

    const data = await this.request<{ images: Record<string, string> }>(
      `/images/${fileKey}?${params}`
    );
    return data.images;
  }

  /**
   * Get file thumbnail
   */
  async getFileThumbnail(fileKey: string): Promise<string> {
    const file = await this.getFile(fileKey, { depth: 1 });
    return file.thumbnailUrl;
  }

  // ============================================
  // Comments Methods
  // ============================================

  /**
   * Get file comments
   */
  async getComments(fileKey: string): Promise<FigmaComment[]> {
    const data = await this.request<{ comments: FigmaComment[] }>(
      `/files/${fileKey}/comments`
    );
    return data.comments;
  }

  /**
   * Post a comment
   */
  async postComment(
    fileKey: string,
    message: string,
    position?: { x: number; y: number; node_id?: string }
  ): Promise<FigmaComment> {
    const body: Record<string, unknown> = { message };
    
    if (position) {
      body.client_meta = {
        x: position.x,
        y: position.y,
        node_id: position.node_id,
      };
    }

    return this.request<FigmaComment>(`/files/${fileKey}/comments`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Delete a comment
   */
  async deleteComment(fileKey: string, commentId: string): Promise<void> {
    await this.request(`/files/${fileKey}/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // Version History Methods
  // ============================================

  /**
   * Get file version history
   */
  async getVersionHistory(fileKey: string): Promise<{
    versions: {
      id: string;
      created_at: string;
      label: string;
      description: string;
      user: FigmaUser;
    }[];
  }> {
    return this.request(`/files/${fileKey}/versions`);
  }

  // ============================================
  // Component Methods
  // ============================================

  /**
   * Get team components
   */
  async getTeamComponents(teamId: string): Promise<{
    meta: { components: any[] };
  }> {
    return this.request(`/teams/${teamId}/components`);
  }

  /**
   * Get team styles
   */
  async getTeamStyles(teamId: string): Promise<{
    meta: { styles: any[] };
  }> {
    return this.request(`/teams/${teamId}/styles`);
  }

  // ============================================
  // Flux Integration Methods
  // ============================================

  /**
   * Generate embed URL for Figma file
   */
  static generateEmbedUrl(fileUrl: string): string {
    return `https://www.figma.com/embed?embed_host=flux&url=${encodeURIComponent(fileUrl)}`;
  }

  /**
   * Parse Figma URL to extract file key and node ID
   */
  static parseFileUrl(url: string): { fileKey: string; nodeId?: string } | null {
    // Match patterns like:
    // https://www.figma.com/file/XXXXX/File-Name
    // https://www.figma.com/file/XXXXX/File-Name?node-id=123:456
    // https://www.figma.com/design/XXXXX/File-Name
    const fileMatch = url.match(/figma\.com\/(file|design)\/([a-zA-Z0-9]+)/);
    if (!fileMatch) return null;

    const fileKey = fileMatch[2];
    const nodeIdMatch = url.match(/node-id=([^&]+)/);
    const nodeId = nodeIdMatch ? decodeURIComponent(nodeIdMatch[1]) : undefined;

    return { fileKey, nodeId };
  }

  /**
   * Get file preview data for Flux asset manager
   */
  async getFilePreview(fileKey: string): Promise<{
    id: string;
    name: string;
    thumbnailUrl: string;
    embedUrl: string;
    lastModified: string;
    pageCount: number;
  }> {
    const file = await this.getFile(fileKey, { depth: 1 });
    const pages = file.document.children?.filter(c => c.type === 'CANVAS') || [];

    return {
      id: fileKey,
      name: file.name,
      thumbnailUrl: file.thumbnailUrl,
      embedUrl: FigmaConnector.generateEmbedUrl(
        `https://www.figma.com/file/${fileKey}`
      ),
      lastModified: file.lastModified,
      pageCount: pages.length,
    };
  }

  /**
   * Sync Figma files to Flux assets
   */
  async syncProjectToFlux(
    projectId: string
  ): Promise<SyncResult> {
    const errors: string[] = [];
    let itemsSynced = 0;

    try {
      const files = await this.getProjectFiles(projectId);

      for (const file of files) {
        try {
          await this.getFilePreview(file.key);
          itemsSynced++;
        } catch (err) {
          errors.push(`Failed to sync file ${file.name}: ${err}`);
        }
      }

      return {
        success: errors.length === 0,
        provider: 'figma',
        itemsSynced,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return {
        success: false,
        provider: 'figma',
        itemsSynced: 0,
        errors: [`Failed to fetch project files: ${err}`],
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Create a design review task from Figma file
   */
  async createDesignReviewTask(
    fileKey: string,
    nodeIds?: string[]
  ): Promise<{
    title: string;
    description: string;
    embedUrl: string;
    thumbnails: string[];
  }> {
    const file = await this.getFile(fileKey, { depth: 1 });
    
    let thumbnails: string[] = [];
    if (nodeIds?.length) {
      const images = await this.getFileImages(fileKey, nodeIds, { scale: 2 });
      thumbnails = Object.values(images);
    }

    return {
      title: `Design Review: ${file.name}`,
      description: `Review the design file: ${file.name}\n\nLast modified: ${file.lastModified}`,
      embedUrl: FigmaConnector.generateEmbedUrl(
        `https://www.figma.com/file/${fileKey}`
      ),
      thumbnails,
    };
  }
}

// 02:45:00 Dec 07, 2025

