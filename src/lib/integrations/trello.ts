// =====================================
// FLUX - Trello Integration Connector
// Last Updated: 02:45:00 Dec 07, 2025
// =====================================

import type {
  APIKeyCredentials,
  TrelloMember,
  TrelloBoard,
  TrelloList,
  TrelloCard,
  SyncResult,
} from './types';
import type { Task } from '@/types';

const TRELLO_API_BASE = 'https://api.trello.com/1';
const TRELLO_AUTH_URL = 'https://trello.com/1/authorize';

/**
 * Trello Authorization configuration
 */
export interface TrelloAuthConfig {
  apiKey: string;
  appName: string;
  returnUrl: string;
  scope?: string;
  expiration?: 'never' | '1hour' | '1day' | '30days';
}

/**
 * Trello webhook payload
 */
export interface TrelloWebhookPayload {
  model: {
    id: string;
    name: string;
  };
  action: {
    id: string;
    idMemberCreator: string;
    type: string;
    date: string;
    data: Record<string, unknown>;
  };
}

/**
 * Trello Integration Connector
 * Handles authentication and API interactions with Trello
 */
export class TrelloConnector {
  private apiKey: string;
  private token: string;
  private baseUrl = TRELLO_API_BASE;

  constructor(apiKey: string, token: string) {
    this.apiKey = apiKey;
    this.token = token;
  }

  // ============================================
  // Auth Flow Methods (Static)
  // ============================================

  /**
   * Generate authorization URL for user token
   */
  static getAuthorizationUrl(config: TrelloAuthConfig): string {
    const params = new URLSearchParams({
      key: config.apiKey,
      name: config.appName,
      scope: config.scope || 'read,write',
      expiration: config.expiration || 'never',
      response_type: 'token',
      return_url: config.returnUrl,
    });
    return `${TRELLO_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Get API key page URL
   */
  static getAPIKeyUrl(): string {
    return 'https://trello.com/app-key';
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private buildUrl(endpoint: string, params: Record<string, string> = {}): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.set('key', this.apiKey);
    url.searchParams.set('token', this.token);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    return url.toString();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    params: Record<string, string> = {}
  ): Promise<T> {
    const url = this.buildUrl(endpoint, params);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Trello API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // ============================================
  // Member Methods
  // ============================================

  /**
   * Get current member info
   */
  async getCurrentMember(): Promise<TrelloMember> {
    return this.request<TrelloMember>('/members/me');
  }

  /**
   * Get member by ID
   */
  async getMember(memberId: string): Promise<TrelloMember> {
    return this.request<TrelloMember>(`/members/${memberId}`);
  }

  // ============================================
  // Board Methods
  // ============================================

  /**
   * Get member's boards
   */
  async getBoards(options?: {
    filter?: 'all' | 'open' | 'closed' | 'members' | 'organization' | 'public' | 'starred';
  }): Promise<TrelloBoard[]> {
    return this.request<TrelloBoard[]>('/members/me/boards', {}, {
      filter: options?.filter || 'open',
    });
  }

  /**
   * Get a single board
   */
  async getBoard(boardId: string): Promise<TrelloBoard> {
    return this.request<TrelloBoard>(`/boards/${boardId}`);
  }

  /**
   * Create a new board
   */
  async createBoard(name: string, options?: {
    desc?: string;
    defaultLists?: boolean;
    defaultLabels?: boolean;
    prefs_background?: string;
  }): Promise<TrelloBoard> {
    return this.request<TrelloBoard>('/boards', {
      method: 'POST',
    }, {
      name,
      desc: options?.desc || '',
      defaultLists: String(options?.defaultLists ?? true),
      defaultLabels: String(options?.defaultLabels ?? true),
      prefs_background: options?.prefs_background || 'blue',
    });
  }

  // ============================================
  // List Methods
  // ============================================

  /**
   * Get lists for a board
   */
  async getLists(boardId: string, options?: {
    filter?: 'all' | 'open' | 'closed';
  }): Promise<TrelloList[]> {
    return this.request<TrelloList[]>(`/boards/${boardId}/lists`, {}, {
      filter: options?.filter || 'open',
    });
  }

  /**
   * Create a new list
   */
  async createList(boardId: string, name: string, pos?: 'top' | 'bottom' | number): Promise<TrelloList> {
    return this.request<TrelloList>('/lists', {
      method: 'POST',
    }, {
      name,
      idBoard: boardId,
      pos: String(pos || 'bottom'),
    });
  }

  /**
   * Update a list
   */
  async updateList(listId: string, updates: {
    name?: string;
    closed?: boolean;
    pos?: 'top' | 'bottom' | number;
  }): Promise<TrelloList> {
    const params: Record<string, string> = {};
    if (updates.name) params.name = updates.name;
    if (updates.closed !== undefined) params.closed = String(updates.closed);
    if (updates.pos !== undefined) params.pos = String(updates.pos);

    return this.request<TrelloList>(`/lists/${listId}`, {
      method: 'PUT',
    }, params);
  }

  // ============================================
  // Card Methods
  // ============================================

  /**
   * Get cards for a board
   */
  async getBoardCards(boardId: string, options?: {
    filter?: 'all' | 'open' | 'closed' | 'visible';
  }): Promise<TrelloCard[]> {
    return this.request<TrelloCard[]>(`/boards/${boardId}/cards`, {}, {
      filter: options?.filter || 'open',
    });
  }

  /**
   * Get cards for a list
   */
  async getListCards(listId: string): Promise<TrelloCard[]> {
    return this.request<TrelloCard[]>(`/lists/${listId}/cards`);
  }

  /**
   * Get a single card
   */
  async getCard(cardId: string): Promise<TrelloCard> {
    return this.request<TrelloCard>(`/cards/${cardId}`);
  }

  /**
   * Create a new card
   */
  async createCard(listId: string, data: {
    name: string;
    desc?: string;
    pos?: 'top' | 'bottom' | number;
    due?: string;
    dueComplete?: boolean;
    idMembers?: string[];
    idLabels?: string[];
  }): Promise<TrelloCard> {
    const params: Record<string, string> = {
      idList: listId,
      name: data.name,
    };
    if (data.desc) params.desc = data.desc;
    if (data.pos) params.pos = String(data.pos);
    if (data.due) params.due = data.due;
    if (data.dueComplete !== undefined) params.dueComplete = String(data.dueComplete);
    if (data.idMembers?.length) params.idMembers = data.idMembers.join(',');
    if (data.idLabels?.length) params.idLabels = data.idLabels.join(',');

    return this.request<TrelloCard>('/cards', {
      method: 'POST',
    }, params);
  }

  /**
   * Update a card
   */
  async updateCard(cardId: string, updates: {
    name?: string;
    desc?: string;
    closed?: boolean;
    idList?: string;
    pos?: 'top' | 'bottom' | number;
    due?: string | null;
    dueComplete?: boolean;
    idMembers?: string[];
    idLabels?: string[];
  }): Promise<TrelloCard> {
    const params: Record<string, string> = {};
    if (updates.name) params.name = updates.name;
    if (updates.desc !== undefined) params.desc = updates.desc;
    if (updates.closed !== undefined) params.closed = String(updates.closed);
    if (updates.idList) params.idList = updates.idList;
    if (updates.pos !== undefined) params.pos = String(updates.pos);
    if (updates.due !== undefined) params.due = updates.due || '';
    if (updates.dueComplete !== undefined) params.dueComplete = String(updates.dueComplete);
    if (updates.idMembers) params.idMembers = updates.idMembers.join(',');
    if (updates.idLabels) params.idLabels = updates.idLabels.join(',');

    return this.request<TrelloCard>(`/cards/${cardId}`, {
      method: 'PUT',
    }, params);
  }

  /**
   * Delete a card
   */
  async deleteCard(cardId: string): Promise<void> {
    await this.request(`/cards/${cardId}`, { method: 'DELETE' });
  }

  /**
   * Move card to another list
   */
  async moveCard(cardId: string, listId: string, pos?: 'top' | 'bottom' | number): Promise<TrelloCard> {
    return this.updateCard(cardId, { idList: listId, pos });
  }

  // ============================================
  // Webhook Methods
  // ============================================

  /**
   * Create a webhook
   */
  async createWebhook(
    callbackURL: string,
    modelId: string,
    description?: string
  ): Promise<{ id: string; active: boolean }> {
    return this.request('/webhooks', {
      method: 'POST',
    }, {
      callbackURL,
      idModel: modelId,
      description: description || 'Flux integration webhook',
    });
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    await this.request(`/webhooks/${webhookId}`, { method: 'DELETE' });
  }

  /**
   * List webhooks
   */
  async listWebhooks(): Promise<{ id: string; callbackURL: string; idModel: string; active: boolean }[]> {
    return this.request('/members/me/tokens', {}, {
      webhooks: 'true',
    });
  }

  // ============================================
  // Flux Integration Methods
  // ============================================

  /**
   * Map Trello list to Flux status
   */
  private mapListToStatus(listName: string): Task['status'] {
    const name = listName.toLowerCase();
    if (name.includes('done') || name.includes('complete') || name.includes('finished')) {
      return 'done';
    }
    if (name.includes('progress') || name.includes('doing') || name.includes('working')) {
      return 'in-progress';
    }
    if (name.includes('review') || name.includes('testing') || name.includes('qa')) {
      return 'code-review';
    }
    return 'todo';
  }

  /**
   * Map Flux status to Trello list name
   */
  private mapStatusToListName(status: Task['status']): string {
    // Map common Agile statuses to Trello list names
    const mapping: Partial<Record<Task['status'], string>> = {
      'backlog': 'Backlog',
      'ready': 'Ready',
      'todo': 'To Do',
      'in-progress': 'In Progress',
      'code-review': 'Review',
      'testing': 'Testing',
      'done': 'Done',
      'archived': 'Archived',
      // CCaaS/ITSM statuses
      'new': 'To Do',
      'queued': 'To Do',
      'assigned': 'In Progress',
      'pending-customer': 'In Progress',
      'escalated': 'In Progress',
      'resolved': 'Done',
      'closed': 'Done',
      'triaged': 'To Do',
      'investigating': 'In Progress',
      'pending-vendor': 'In Progress',
      'pending-approval': 'Review',
      'implementing': 'In Progress',
    };
    return mapping[status] || 'To Do';
  }

  /**
   * Convert Trello card to Flux task
   */
  cardToFluxTask(card: TrelloCard, lists: TrelloList[]): Partial<Task> {
    const list = lists.find(l => l.id === card.idList);
    const listName = list?.name || 'Unknown';

    // Determine priority from labels
    let priority: Task['priority'] = 'medium';
    const labelColors = card.labels.map(l => l.color.toLowerCase());
    if (labelColors.includes('red') || labelColors.includes('purple')) {
      priority = 'high';
    } else if (labelColors.includes('green') || labelColors.includes('blue')) {
      priority = 'low';
    }

    return {
      id: `trello-${card.id}`,
      title: card.name,
      description: `${card.desc || ''}\n\n---\n[View on Trello](${card.url})`,
      status: this.mapListToStatus(listName),
      priority,
      tags: card.labels.map(l => l.name),
      dueDate: card.due || undefined,
    };
  }

  /**
   * Convert Flux task to Trello card data
   */
  fluxTaskToCardData(task: Task): {
    name: string;
    desc: string;
    due: string | null;
  } {
    return {
      name: task.title,
      desc: task.description || '',
      due: task.dueDate || null,
    };
  }

  /**
   * Import entire Trello board to Flux
   */
  async importBoardToFlux(boardId: string): Promise<{
    tasks: Partial<Task>[];
    syncResult: SyncResult;
  }> {
    const errors: string[] = [];
    const tasks: Partial<Task>[] = [];

    try {
      const [cards, lists] = await Promise.all([
        this.getBoardCards(boardId),
        this.getLists(boardId),
      ]);

      for (const card of cards) {
        try {
          const task = this.cardToFluxTask(card, lists);
          tasks.push(task);
        } catch (err) {
          errors.push(`Failed to convert card "${card.name}": ${err}`);
        }
      }

      return {
        tasks,
        syncResult: {
          success: errors.length === 0,
          provider: 'trello',
          itemsSynced: tasks.length,
          errors: errors.length > 0 ? errors : undefined,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (err) {
      return {
        tasks: [],
        syncResult: {
          success: false,
          provider: 'trello',
          itemsSynced: 0,
          errors: [`Failed to import board: ${err}`],
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Sync Flux task to Trello card (two-way)
   */
  async syncTaskToTrello(
    task: Task,
    boardId: string,
    existingCardId?: string
  ): Promise<TrelloCard> {
    // Get lists to find appropriate one
    const lists = await this.getLists(boardId);
    const targetListName = this.mapStatusToListName(task.status);
    let targetList = lists.find(l => 
      l.name.toLowerCase().includes(targetListName.toLowerCase())
    );

    // Create list if it doesn't exist
    if (!targetList) {
      targetList = await this.createList(boardId, targetListName);
    }

    const cardData = this.fluxTaskToCardData(task);

    if (existingCardId) {
      // Update existing card
      return this.updateCard(existingCardId, {
        ...cardData,
        idList: targetList.id,
      });
    } else {
      // Create new card
      return this.createCard(targetList.id, cardData);
    }
  }
}

// 02:45:00 Dec 07, 2025

