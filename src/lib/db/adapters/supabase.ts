// =====================================
// FLUX - Supabase Database Adapter
// =====================================
// Production-grade adapter for Supabase backend
// Handles real-time subscriptions and optimistic updates

// @ts-nocheck
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type { FluxDataProvider } from '../types';
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

// Environment variables (Vite-style)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Database table type definitions (maps to Supabase schema)
interface DbTask {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    tags: string[];
    assignee_id: string | null;
    assignee_name: string | null;
    assignee_avatar: string | null;
    due_date: string | null;
    project_id: string | null;
    created_at: string;
    updated_at: string;
    order: number;
}

interface DbNotification {
    id: string;
    type: string;
    title: string;
    description: string;
    is_read: boolean;
    created_at: string;
    user_id: string | null;
    user_name: string | null;
    user_avatar: string | null;
    context: Record<string, unknown> | null;
}

interface DbProject {
    id: string;
    name: string;
    description: string | null;
    color: string;
    icon: string | null;
    created_at: string;
    updated_at: string;
    owner_id: string;
    members: string[];
}

// Transform functions: DB -> App types
function dbTaskToTask(db: DbTask): Task {
    return {
        id: db.id,
        title: db.title,
        description: db.description || undefined,
        status: db.status as Task['status'],
        priority: db.priority as Task['priority'],
        tags: db.tags || [],
        assignee: db.assignee_id ? {
            id: db.assignee_id,
            name: db.assignee_name || 'Unknown',
            avatar: db.assignee_avatar || undefined,
        } : undefined,
        dueDate: db.due_date || undefined,
        projectId: db.project_id || undefined,
        createdAt: db.created_at,
        updatedAt: db.updated_at,
        order: db.order,
    };
}

function dbNotificationToNotification(db: DbNotification): Notification {
    return {
        id: db.id,
        type: db.type as Notification['type'],
        title: db.title,
        description: db.description,
        isRead: db.is_read,
        createdAt: db.created_at,
        user: db.user_id ? {
            id: db.user_id,
            name: db.user_name || 'Unknown',
            avatar: db.user_avatar || undefined,
        } : undefined,
        context: db.context as Notification['context'],
    };
}

function dbProjectToProject(db: DbProject): Project {
    return {
        id: db.id,
        name: db.name,
        description: db.description || undefined,
        color: db.color,
        icon: db.icon || undefined,
        createdAt: db.created_at,
        updatedAt: db.updated_at,
        ownerId: db.owner_id,
        members: db.members || [],
    };
}

/**
 * Supabase Adapter Factory
 */
export function createSupabaseAdapter(): FluxDataProvider {
    let client: SupabaseClient | null = null;
    let tasksChannel: RealtimeChannel | null = null;
    let notificationsChannel: RealtimeChannel | null = null;

    // Ensure client is initialized
    function getClient(): SupabaseClient {
        if (!client) {
            throw new Error('Supabase adapter not initialized. Call initialize() first.');
        }
        return client;
    }

    return {
        // ==================
        // User Operations
        // ==================
        async getCurrentUser(): Promise<User | null> {
            const supabase = getClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) return null;

            // Fetch user profile from profiles table
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (!profile) {
                // Return basic user from auth
                return {
                    id: user.id,
                    name: user.user_metadata?.name || 'Flux User',
                    email: user.email || '',
                    avatar: user.user_metadata?.avatar_url,
                    role: 'member',
                };
            }

            return {
                id: profile.id,
                name: profile.name || 'Flux User',
                email: profile.email || user.email || '',
                avatar: profile.avatar_url,
                role: profile.role || 'member',
                preferences: profile.preferences,
            };
        },

        async updateUserPreferences(userId, preferences): Promise<User | null> {
            const supabase = getClient();

            const { data, error } = await supabase
                .from('profiles')
                .update({ preferences })
                .eq('id', userId)
                .select()
                .single();

            if (error || !data) {
                console.error('Failed to update preferences:', error);
                return null;
            }

            return this.getCurrentUser();
        },

        // ==================
        // Task Operations
        // ==================
        async getTasks(projectId?): Promise<Task[]> {
            const supabase = getClient();

            let query = supabase
                .from('tasks')
                .select('*')
                .order('order', { ascending: true })
                .order('created_at', { ascending: false });

            if (projectId) {
                query = query.eq('project_id', projectId);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Failed to fetch tasks:', error);
                return [];
            }

            return (data as DbTask[]).map(dbTaskToTask);
        },

        async getTaskById(id): Promise<Task | null> {
            const supabase = getClient();

            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !data) return null;

            return dbTaskToTask(data as DbTask);
        },

        async createTask(input): Promise<Task> {
            const supabase = getClient();

            // Get current max order for the status
            const { data: maxOrderData } = await supabase
                .from('tasks')
                .select('order')
                .eq('status', input.status || 'todo')
                .order('order', { ascending: false })
                .limit(1)
                .single();

            const newOrder = (maxOrderData?.order ?? -1) + 1;
            const now = new Date().toISOString();

            const { data, error } = await supabase
                .from('tasks')
                .insert({
                    title: input.title,
                    description: input.description,
                    status: input.status || 'todo',
                    priority: input.priority || 'medium',
                    tags: input.tags || [],
                    due_date: input.dueDate,
                    project_id: input.projectId,
                    order: newOrder,
                    created_at: now,
                    updated_at: now,
                })
                .select()
                .single();

            if (error || !data) {
                throw new Error(`Failed to create task: ${error?.message}`);
            }

            return dbTaskToTask(data as DbTask);
        },

        async updateTask(id, updateData): Promise<Task | null> {
            const supabase = getClient();

            // Map app types to DB column names
            const dbUpdate: Record<string, unknown> = {
                updated_at: new Date().toISOString(),
            };

            if (updateData.title !== undefined) dbUpdate.title = updateData.title;
            if (updateData.description !== undefined) dbUpdate.description = updateData.description;
            if (updateData.status !== undefined) dbUpdate.status = updateData.status;
            if (updateData.priority !== undefined) dbUpdate.priority = updateData.priority;
            if (updateData.tags !== undefined) dbUpdate.tags = updateData.tags;
            if (updateData.dueDate !== undefined) dbUpdate.due_date = updateData.dueDate;
            if (updateData.order !== undefined) dbUpdate.order = updateData.order;

            const { data, error } = await supabase
                .from('tasks')
                .update(dbUpdate)
                .eq('id', id)
                .select()
                .single();

            if (error || !data) {
                console.error('Failed to update task:', error);
                return null;
            }

            return dbTaskToTask(data as DbTask);
        },

        async deleteTask(id): Promise<boolean> {
            const supabase = getClient();

            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', id);

            return !error;
        },

        async updateTaskStatus(id, status): Promise<Task | null> {
            return this.updateTask(id, { status });
        },

        async updateTaskOrder(id, order, newStatus): Promise<Task | null> {
            const update: TaskUpdateInput = { order };
            if (newStatus) update.status = newStatus;
            return this.updateTask(id, update);
        },

        async archiveTasks(ids): Promise<boolean> {
            const supabase = getClient();

            const { error } = await supabase
                .from('tasks')
                .update({ status: 'archived', updated_at: new Date().toISOString() })
                .in('id', ids);

            return !error;
        },

        // ==================
        // Notification Operations
        // ==================
        async getNotifications(): Promise<Notification[]> {
            const supabase = getClient();

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Failed to fetch notifications:', error);
                return [];
            }

            return (data as DbNotification[]).map(dbNotificationToNotification);
        },

        async getUnreadNotifications(): Promise<Notification[]> {
            const supabase = getClient();

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('is_read', false)
                .order('created_at', { ascending: false });

            if (error) return [];

            return (data as DbNotification[]).map(dbNotificationToNotification);
        },

        async markNotificationRead(id): Promise<boolean> {
            const supabase = getClient();

            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            return !error;
        },

        async markAllNotificationsRead(): Promise<boolean> {
            const supabase = getClient();

            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('is_read', false);

            return !error;
        },

        async archiveNotification(id): Promise<boolean> {
            const supabase = getClient();

            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', id);

            return !error;
        },

        async clearAllNotifications(): Promise<boolean> {
            const supabase = getClient();

            const { error } = await supabase
                .from('notifications')
                .delete()
                .neq('id', ''); // Delete all

            return !error;
        },

        // ==================
        // Project Operations
        // ==================
        async getProjects(): Promise<Project[]> {
            const supabase = getClient();

            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Failed to fetch projects:', error);
                return [];
            }

            return (data as DbProject[]).map(dbProjectToProject);
        },

        async getProjectById(id): Promise<Project | null> {
            const supabase = getClient();

            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !data) return null;

            return dbProjectToProject(data as DbProject);
        },

        async createProject(input): Promise<Project> {
            const supabase = getClient();
            const now = new Date().toISOString();

            const { data, error } = await supabase
                .from('projects')
                .insert({
                    name: input.name,
                    description: input.description,
                    color: input.color,
                    icon: input.icon,
                    owner_id: input.ownerId,
                    members: input.members,
                    created_at: now,
                    updated_at: now,
                })
                .select()
                .single();

            if (error || !data) {
                throw new Error(`Failed to create project: ${error?.message}`);
            }

            return dbProjectToProject(data as DbProject);
        },

        async updateProject(id, updateData): Promise<Project | null> {
            const supabase = getClient();

            const dbUpdate: Record<string, unknown> = {
                updated_at: new Date().toISOString(),
            };

            if (updateData.name !== undefined) dbUpdate.name = updateData.name;
            if (updateData.description !== undefined) dbUpdate.description = updateData.description;
            if (updateData.color !== undefined) dbUpdate.color = updateData.color;
            if (updateData.icon !== undefined) dbUpdate.icon = updateData.icon;
            if (updateData.members !== undefined) dbUpdate.members = updateData.members;

            const { data, error } = await supabase
                .from('projects')
                .update(dbUpdate)
                .eq('id', id)
                .select()
                .single();

            if (error || !data) return null;

            return dbProjectToProject(data as DbProject);
        },

        async deleteProject(id): Promise<boolean> {
            const supabase = getClient();

            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', id);

            return !error;
        },

        // ==================
        // Asset Operations
        // ==================
        async getAssets(projectId?): Promise<Asset[]> {
            const supabase = getClient();

            let query = supabase
                .from('assets')
                .select('*')
                .order('uploaded_at', { ascending: false });

            if (projectId) {
                query = query.eq('project_id', projectId);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Failed to fetch assets:', error);
                return [];
            }

            return data as Asset[];
        },

        async uploadAsset(file, projectId): Promise<Asset> {
            const supabase = getClient();

            // Upload file to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `assets/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('flux-assets')
                .upload(filePath, file);

            if (uploadError) {
                throw new Error(`Failed to upload file: ${uploadError.message}`);
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('flux-assets')
                .getPublicUrl(filePath);

            // Create asset record
            const assetType = file.type.startsWith('image/') ? 'image' :
                file.type.startsWith('video/') ? 'video' :
                    file.type.startsWith('audio/') ? 'audio' :
                        file.type.includes('document') || file.type.includes('pdf') ? 'document' : 'other';

            const { data, error } = await supabase
                .from('assets')
                .insert({
                    name: file.name,
                    type: assetType,
                    url: publicUrl,
                    size: file.size,
                    mime_type: file.type,
                    project_id: projectId,
                    uploaded_at: new Date().toISOString(),
                    tags: [],
                })
                .select()
                .single();

            if (error || !data) {
                throw new Error(`Failed to create asset record: ${error?.message}`);
            }

            return data as Asset;
        },

        async deleteAsset(id): Promise<boolean> {
            const supabase = getClient();

            // Get asset info first to delete from storage
            const { data: asset } = await supabase
                .from('assets')
                .select('url')
                .eq('id', id)
                .single();

            if (asset?.url) {
                // Extract path from URL and delete from storage
                const path = asset.url.split('/flux-assets/')[1];
                if (path) {
                    await supabase.storage.from('flux-assets').remove([path]);
                }
            }

            // Delete record
            const { error } = await supabase
                .from('assets')
                .delete()
                .eq('id', id);

            return !error;
        },

        // ==================
        // Integration Operations
        // ==================
        async getIntegrations(): Promise<Integration[]> {
            const supabase = getClient();

            const { data, error } = await supabase
                .from('integrations')
                .select('*');

            if (error) {
                // Return default integrations if table doesn't exist
                return [
                    { id: 'i1', type: 'github', name: 'GitHub', isConnected: false },
                    { id: 'i2', type: 'figma', name: 'Figma', isConnected: false },
                    { id: 'i3', type: 'slack', name: 'Slack', isConnected: false },
                    { id: 'i4', type: 'notion', name: 'Notion', isConnected: false },
                ];
            }

            return (data || []).map(i => ({
                id: i.id,
                type: i.type,
                name: i.name,
                isConnected: i.is_connected,
                config: i.config,
                lastSyncAt: i.last_sync_at,
            }));
        },

        async connectIntegration(type, config): Promise<Integration> {
            const supabase = getClient();

            const { data, error } = await supabase
                .from('integrations')
                .upsert({
                    type,
                    name: type.charAt(0).toUpperCase() + type.slice(1),
                    is_connected: true,
                    config,
                    last_sync_at: new Date().toISOString(),
                }, { onConflict: 'type' })
                .select()
                .single();

            if (error || !data) {
                throw new Error(`Failed to connect integration: ${error?.message}`);
            }

            return {
                id: data.id,
                type: data.type,
                name: data.name,
                isConnected: data.is_connected,
                config: data.config,
                lastSyncAt: data.last_sync_at,
            };
        },

        async disconnectIntegration(id): Promise<boolean> {
            const supabase = getClient();

            const { error } = await supabase
                .from('integrations')
                .update({ is_connected: false, config: null })
                .eq('id', id);

            return !error;
        },

        async syncIntegration(id): Promise<boolean> {
            const supabase = getClient();

            const { error } = await supabase
                .from('integrations')
                .update({ last_sync_at: new Date().toISOString() })
                .eq('id', id);

            return !error;
        },

        // ==================
        // Lifecycle
        // ==================
        async initialize(): Promise<void> {
            if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
                throw new Error('Supabase credentials not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
            }

            client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                },
            });

            console.log('[SupabaseAdapter] Initialized');
        },

        async disconnect(): Promise<void> {
            if (tasksChannel) {
                tasksChannel.unsubscribe();
                tasksChannel = null;
            }
            if (notificationsChannel) {
                notificationsChannel.unsubscribe();
                notificationsChannel = null;
            }
            client = null;
            console.log('[SupabaseAdapter] Disconnected');
        },

        // ==================
        // Real-time subscriptions
        // ==================
        subscribeToTasks(callback) {
            const supabase = getClient();

            tasksChannel = supabase
                .channel('tasks-changes')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'tasks' },
                    () => {
                        // Refetch all tasks on any change
                        this.getTasks().then(callback);
                    }
                )
                .subscribe();

            // Return unsubscribe function
            return () => {
                if (tasksChannel) {
                    tasksChannel.unsubscribe();
                    tasksChannel = null;
                }
            };
        },

        subscribeToNotifications(callback) {
            const supabase = getClient();

            notificationsChannel = supabase
                .channel('notifications-changes')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'notifications' },
                    () => {
                        this.getNotifications().then(callback);
                    }
                )
                .subscribe();

            return () => {
                if (notificationsChannel) {
                    notificationsChannel.unsubscribe();
                    notificationsChannel = null;
                }
            };
        },
    };
}
