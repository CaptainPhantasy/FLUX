// @ts-nocheck
// =====================================
// FLUX - Database Provider Interface
// =====================================
// This defines the contract that all database adapters must implement.
// The Zustand store calls these methods, and the adapter handles persistence.

import type {
    User,
    Task,
    TaskCreateInput,
    TaskUpdateInput,
    Notification,
    Project,
    Asset,
    Integration,
} from '@/types';

/**
 * FluxDataProvider Interface
 * 
 * All database adapters (Supabase, Local, etc.) must implement this interface.
 * This ensures the application can seamlessly switch between backends.
 */
export interface FluxDataProvider {
    // ==================
    // User Operations
    // ==================
    getCurrentUser(): Promise<User | null>;
    updateUserPreferences(userId: string, preferences: Partial<User['preferences']>): Promise<User | null>;

    // ==================
    // Task Operations
    // ==================
    getTasks(projectId?: string): Promise<Task[]>;
    getTaskById(id: string): Promise<Task | null>;
    createTask(task: TaskCreateInput): Promise<Task>;
    updateTask(id: string, data: TaskUpdateInput): Promise<Task | null>;
    deleteTask(id: string): Promise<boolean>;

    // Bulk operations for efficiency
    updateTaskStatus(id: string, status: Task['status']): Promise<Task | null>;
    updateTaskOrder(id: string, order: number, newStatus?: Task['status']): Promise<Task | null>;
    archiveTasks(ids: string[]): Promise<boolean>;

    // ==================
    // Notification Operations
    // ==================
    getNotifications(): Promise<Notification[]>;
    getUnreadNotifications(): Promise<Notification[]>;
    markNotificationRead(id: string): Promise<boolean>;
    markAllNotificationsRead(): Promise<boolean>;
    archiveNotification(id: string): Promise<boolean>;
    clearAllNotifications(): Promise<boolean>;

    // ==================
    // Project Operations
    // ==================
    getProjects(): Promise<Project[]>;
    getProjectById(id: string): Promise<Project | null>;
    createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project>;
    updateProject(id: string, data: Partial<Project>): Promise<Project | null>;
    deleteProject(id: string): Promise<boolean>;

    // ==================
    // Asset Operations
    // ==================
    getAssets(projectId?: string): Promise<Asset[]>;
    uploadAsset(file: File, projectId?: string): Promise<Asset>;
    deleteAsset(id: string): Promise<boolean>;

    // ==================
    // Integration Operations
    // ==================
    getIntegrations(): Promise<Integration[]>;
    connectIntegration(type: Integration['type'], config: Record<string, unknown>): Promise<Integration>;
    disconnectIntegration(id: string): Promise<boolean>;
    syncIntegration(id: string): Promise<boolean>;

    // ==================
    // Lifecycle
    // ==================
    initialize(): Promise<void>;
    disconnect(): Promise<void>;

    // ==================
    // Real-time subscriptions (optional)
    // ==================
    subscribeToTasks?(callback: (tasks: Task[]) => void): () => void;
    subscribeToNotifications?(callback: (notifications: Notification[]) => void): () => void;
}

/**
 * Adapter Registry Type
 * Maps storage mode to adapter factory
 */
export type AdapterFactory = () => FluxDataProvider;

export interface AdapterRegistry {
    local: AdapterFactory;
    supabase: AdapterFactory;
}
