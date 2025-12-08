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
    Team,
    Task,
    TaskRelationship,
    TaskRelationshipType,
    Comment,
    Activity,
    CommentCreateInput,
    TaskCreateInput,
    TaskUpdateInput,
    Notification,
    Project,
    Asset,
    Integration,
    Email,
    EmailAccount,
    EmailCreateInput,
    EmailUpdateInput,
    EmailAccountCreateInput,
    EmailLabel,
    EmailFolder,
    SLAConfig,
    TimeEntry,
    TimeEntryCreateInput,
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
    story_points: number | null;
    is_vip: boolean | null;
    acceptance_criteria: string[] | null;
    affected_services: string[] | null;
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
        assignee: db.assignee_id || undefined, // Store as user ID string
        dueDate: db.due_date || undefined,
        projectId: db.project_id || undefined,
        createdAt: db.created_at,
        updatedAt: db.updated_at,
        order: db.order,
        storyPoints: db.story_points || undefined,
        isVIP: db.is_vip || undefined,
        acceptanceCriteria: db.acceptance_criteria || undefined,
        affectedServices: db.affected_services || undefined,
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
        // Team Management Operations
        // ==================
        async getUsers(): Promise<User[]> {
            const supabase = getClient();
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('name', { ascending: true });

            if (error) {
                console.error('Failed to fetch users:', error);
                return [];
            }

            return (data || []).map((p: any) => ({
                id: p.id,
                email: p.email || '',
                name: p.name || p.email || 'Unknown',
                role: (p.role || 'member') as User['role'],
                avatar: p.avatar || undefined,
                preferences: p.preferences || {},
                teamId: p.team_id || undefined,
                createdAt: p.created_at || new Date().toISOString(),
            }));
        },

        async getUserById(id: string): Promise<User | null> {
            const supabase = getClient();
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !data) return null;

            return {
                id: data.id,
                email: data.email || '',
                name: data.name || data.email || 'Unknown',
                role: (data.role || 'member') as User['role'],
                avatar: data.avatar || undefined,
                preferences: data.preferences || {},
                teamId: data.team_id || undefined,
                createdAt: data.created_at || new Date().toISOString(),
            };
        },

        async createUser(userData): Promise<User> {
            const supabase = getClient();
            const { data, error } = await supabase
                .from('profiles')
                .insert({
                    email: userData.email,
                    name: userData.name,
                    role: userData.role || 'member',
                    avatar: userData.avatar || null,
                    preferences: userData.preferences || {},
                    team_id: userData.teamId || null,
                })
                .select()
                .single();

            if (error || !data) {
                throw new Error(`Failed to create user: ${error?.message || 'Unknown error'}`);
            }

            return {
                id: data.id,
                email: data.email || '',
                name: data.name || data.email || 'Unknown',
                role: (data.role || 'member') as User['role'],
                avatar: data.avatar || undefined,
                preferences: data.preferences || {},
                teamId: data.team_id || undefined,
                createdAt: data.created_at || new Date().toISOString(),
            };
        },

        async updateUser(id: string, data: Partial<User>): Promise<User | null> {
            const supabase = getClient();
            const updateData: any = {};

            if (data.name !== undefined) updateData.name = data.name;
            if (data.email !== undefined) updateData.email = data.email;
            if (data.role !== undefined) updateData.role = data.role;
            if (data.avatar !== undefined) updateData.avatar = data.avatar;
            if (data.preferences !== undefined) updateData.preferences = data.preferences;
            if (data.teamId !== undefined) updateData.team_id = data.teamId;

            const { data: updated, error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error || !updated) {
                console.error('Failed to update user:', error);
                return null;
            }

            return {
                id: updated.id,
                email: updated.email || '',
                name: updated.name || updated.email || 'Unknown',
                role: (updated.role || 'member') as User['role'],
                avatar: updated.avatar || undefined,
                preferences: updated.preferences || {},
                teamId: updated.team_id || undefined,
                createdAt: updated.created_at || new Date().toISOString(),
            };
        },

        async deleteUser(id: string): Promise<boolean> {
            const supabase = getClient();
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Failed to delete user:', error);
                return false;
            }

            return true;
        },

        async getTeams(): Promise<Team[]> {
            const supabase = getClient();
            const { data, error } = await supabase
                .from('teams')
                .select('*')
                .order('name', { ascending: true });

            if (error) {
                console.error('Failed to fetch teams:', error);
                return [];
            }

            return (data || []).map((t: any) => ({
                id: t.id,
                name: t.name,
                description: t.description || undefined,
                memberIds: t.member_ids || [],
                createdAt: t.created_at || new Date().toISOString(),
                updatedAt: t.updated_at || new Date().toISOString(),
            }));
        },

        async getTeamById(id: string): Promise<Team | null> {
            const supabase = getClient();
            const { data, error } = await supabase
                .from('teams')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !data) return null;

            return {
                id: data.id,
                name: data.name,
                description: data.description || undefined,
                memberIds: data.member_ids || [],
                createdAt: data.created_at || new Date().toISOString(),
                updatedAt: data.updated_at || new Date().toISOString(),
            };
        },

        async createTeam(teamData): Promise<Team> {
            const supabase = getClient();
            const now = new Date().toISOString();
            const { data, error } = await supabase
                .from('teams')
                .insert({
                    name: teamData.name,
                    description: teamData.description || null,
                    member_ids: teamData.memberIds || [],
                    created_at: now,
                    updated_at: now,
                })
                .select()
                .single();

            if (error || !data) {
                throw new Error(`Failed to create team: ${error?.message || 'Unknown error'}`);
            }

            return {
                id: data.id,
                name: data.name,
                description: data.description || undefined,
                memberIds: data.member_ids || [],
                createdAt: data.created_at || now,
                updatedAt: data.updated_at || now,
            };
        },

        async updateTeam(id: string, data: Partial<Team>): Promise<Team | null> {
            const supabase = getClient();
            const updateData: any = {
                updated_at: new Date().toISOString(),
            };

            if (data.name !== undefined) updateData.name = data.name;
            if (data.description !== undefined) updateData.description = data.description;
            if (data.memberIds !== undefined) updateData.member_ids = data.memberIds;

            const { data: updated, error } = await supabase
                .from('teams')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error || !updated) {
                console.error('Failed to update team:', error);
                return null;
            }

            return {
                id: updated.id,
                name: updated.name,
                description: updated.description || undefined,
                memberIds: updated.member_ids || [],
                createdAt: updated.created_at || new Date().toISOString(),
                updatedAt: updated.updated_at || new Date().toISOString(),
            };
        },

        async deleteTeam(id: string): Promise<boolean> {
            const supabase = getClient();
            const { error } = await supabase
                .from('teams')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Failed to delete team:', error);
                return false;
            }

            return true;
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

            // Fetch user details if assignee is provided
            let assigneeName = null;
            let assigneeAvatar = null;
            if (input.assignee) {
                const user = await this.getUserById(input.assignee);
                if (user) {
                    assigneeName = user.name;
                    assigneeAvatar = user.avatar || null;
                }
            }

            const { data, error } = await supabase
                .from('tasks')
                .insert({
                    title: input.title,
                    description: input.description,
                    status: input.status || 'todo',
                    priority: input.priority || 'medium',
                    tags: input.tags || [],
                    assignee_id: input.assignee || null,
                    assignee_name: assigneeName,
                    assignee_avatar: assigneeAvatar,
                    due_date: input.dueDate,
                    project_id: input.projectId,
                    order: newOrder,
                    created_at: now,
                    updated_at: now,
                    story_points: input.storyPoints || null,
                    is_vip: input.isVIP || false,
                    acceptance_criteria: input.acceptanceCriteria || [],
                    affected_services: input.affectedServices || [],
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
            if (updateData.dueDate !== undefined) dbUpdate.due_date = updateData.dueDate;
            if (updateData.order !== undefined) dbUpdate.order = updateData.order;

            // New fields
            if (updateData.storyPoints !== undefined) dbUpdate.story_points = updateData.storyPoints;
            if (updateData.isVIP !== undefined) dbUpdate.is_vip = updateData.isVIP;
            if (updateData.acceptanceCriteria !== undefined) dbUpdate.acceptance_criteria = updateData.acceptanceCriteria;
            if (updateData.affectedServices !== undefined) dbUpdate.affected_services = updateData.affectedServices;

            // Handle assignee update
            if (updateData.assignee !== undefined) {
                if (updateData.assignee) {
                    // Fetch user details
                    const user = await this.getUserById(updateData.assignee);
                    dbUpdate.assignee_id = updateData.assignee;
                    dbUpdate.assignee_name = user?.name || null;
                    dbUpdate.assignee_avatar = user?.avatar || null;
                } else {
                    // Unassign
                    dbUpdate.assignee_id = null;
                    dbUpdate.assignee_name = null;
                    dbUpdate.assignee_avatar = null;
                }
            }

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
        // Email Account Operations
        // ==================
        async getEmailAccounts(): Promise<EmailAccount[]> {
            const supabase = getClient();

            const { data, error } = await supabase
                .from('email_accounts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('[Supabase] Failed to fetch email accounts:', error);
                return [];
            }

            return (data || []).map(account => ({
                id: account.id,
                tenantId: account.tenant_id,
                userId: account.user_id,
                provider: account.provider,
                emailAddress: account.email_address,
                displayName: account.display_name,
                smtpHost: account.smtp_host,
                smtpPort: account.smtp_port,
                smtpUsername: account.smtp_username,
                smtpUseTls: account.smtp_use_tls,
                imapHost: account.imap_host,
                imapPort: account.imap_port,
                imapUsername: account.imap_username,
                imapUseTls: account.imap_use_tls,
                oauthAccessToken: account.oauth_access_token,
                oauthRefreshToken: account.oauth_refresh_token,
                oauthTokenExpiresAt: account.oauth_token_expires_at,
                syncEnabled: account.sync_enabled,
                syncFrequencyMinutes: account.sync_frequency_minutes,
                lastSyncedAt: account.last_synced_at,
                isActive: account.is_active,
                connectionStatus: account.connection_status,
                lastError: account.last_error,
                createdAt: account.created_at,
                updatedAt: account.updated_at,
            }));
        },

        async getEmailAccountById(id: string): Promise<EmailAccount | null> {
            const supabase = getClient();

            const { data, error } = await supabase
                .from('email_accounts')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !data) return null;

            return {
                id: data.id,
                tenantId: data.tenant_id,
                userId: data.user_id,
                provider: data.provider,
                emailAddress: data.email_address,
                displayName: data.display_name,
                smtpHost: data.smtp_host,
                smtpPort: data.smtp_port,
                smtpUsername: data.smtp_username,
                smtpUseTls: data.smtp_use_tls,
                imapHost: data.imap_host,
                imapPort: data.imap_port,
                imapUsername: data.imap_username,
                imapUseTls: data.imap_use_tls,
                oauthAccessToken: data.oauth_access_token,
                oauthRefreshToken: data.oauth_refresh_token,
                oauthTokenExpiresAt: data.oauth_token_expires_at,
                syncEnabled: data.sync_enabled,
                syncFrequencyMinutes: data.sync_frequency_minutes,
                lastSyncedAt: data.last_synced_at,
                isActive: data.is_active,
                connectionStatus: data.connection_status,
                lastError: data.last_error,
                createdAt: data.created_at,
                updatedAt: data.updated_at,
            };
        },

        async createEmailAccount(input: EmailAccountCreateInput): Promise<EmailAccount> {
            const supabase = getClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Get tenant_id from user profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('tenant_id')
                .eq('id', user.id)
                .single();

            if (!profile?.tenant_id) {
                throw new Error('User tenant not found');
            }

            const { data, error } = await supabase
                .from('email_accounts')
                .insert({
                    tenant_id: profile.tenant_id,
                    user_id: user.id,
                    provider: input.provider,
                    email_address: input.emailAddress,
                    display_name: input.displayName,
                    smtp_host: input.smtpHost,
                    smtp_port: input.smtpPort,
                    smtp_username: input.smtpUsername,
                    smtp_password: input.smtpPassword, // In production, encrypt this
                    smtp_use_tls: input.smtpUseTls ?? true,
                    imap_host: input.imapHost,
                    imap_port: input.imapPort,
                    imap_username: input.imapUsername,
                    imap_password: input.imapPassword, // In production, encrypt this
                    imap_use_tls: input.imapUseTls ?? true,
                    oauth_access_token: input.oauthAccessToken,
                    oauth_refresh_token: input.oauthRefreshToken,
                    sync_enabled: input.syncEnabled ?? true,
                    sync_frequency_minutes: input.syncFrequencyMinutes ?? 15,
                })
                .select()
                .single();

            if (error || !data) {
                throw new Error(`Failed to create email account: ${error?.message}`);
            }

            return {
                id: data.id,
                tenantId: data.tenant_id,
                userId: data.user_id,
                provider: data.provider,
                emailAddress: data.email_address,
                displayName: data.display_name,
                smtpHost: data.smtp_host,
                smtpPort: data.smtp_port,
                smtpUsername: data.smtp_username,
                smtpUseTls: data.smtp_use_tls,
                imapHost: data.imap_host,
                imapPort: data.imap_port,
                imapUsername: data.imap_username,
                imapUseTls: data.imap_use_tls,
                oauthAccessToken: data.oauth_access_token,
                oauthRefreshToken: data.oauth_refresh_token,
                oauthTokenExpiresAt: data.oauth_token_expires_at,
                syncEnabled: data.sync_enabled,
                syncFrequencyMinutes: data.sync_frequency_minutes,
                lastSyncedAt: data.last_synced_at,
                isActive: data.is_active,
                connectionStatus: data.connection_status,
                lastError: data.last_error,
                createdAt: data.created_at,
                updatedAt: data.updated_at,
            };
        },

        async updateEmailAccount(id: string, data: Partial<EmailAccount>): Promise<EmailAccount | null> {
            const supabase = getClient();

            const updateData: Record<string, unknown> = {};
            if (data.provider !== undefined) updateData.provider = data.provider;
            if (data.emailAddress !== undefined) updateData.email_address = data.emailAddress;
            if (data.displayName !== undefined) updateData.display_name = data.displayName;
            if (data.syncEnabled !== undefined) updateData.sync_enabled = data.syncEnabled;
            if (data.syncFrequencyMinutes !== undefined) updateData.sync_frequency_minutes = data.syncFrequencyMinutes;
            if (data.isActive !== undefined) updateData.is_active = data.isActive;
            if (data.connectionStatus !== undefined) updateData.connection_status = data.connectionStatus;
            if (data.lastError !== undefined) updateData.last_error = data.lastError;
            if (data.lastSyncedAt !== undefined) updateData.last_synced_at = data.lastSyncedAt;
            // OAuth token updates
            if (data.oauthAccessToken !== undefined) updateData.oauth_access_token = data.oauthAccessToken;
            if (data.oauthRefreshToken !== undefined) updateData.oauth_refresh_token = data.oauthRefreshToken;
            if (data.oauthTokenExpiresAt !== undefined) updateData.oauth_token_expires_at = data.oauthTokenExpiresAt;

            const { data: updated, error } = await supabase
                .from('email_accounts')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error || !updated) return null;

            return {
                id: updated.id,
                tenantId: updated.tenant_id,
                userId: updated.user_id,
                provider: updated.provider,
                emailAddress: updated.email_address,
                displayName: updated.display_name,
                smtpHost: updated.smtp_host,
                smtpPort: updated.smtp_port,
                smtpUsername: updated.smtp_username,
                smtpUseTls: updated.smtp_use_tls,
                imapHost: updated.imap_host,
                imapPort: updated.imap_port,
                imapUsername: updated.imap_username,
                imapUseTls: updated.imap_use_tls,
                oauthAccessToken: updated.oauth_access_token,
                oauthRefreshToken: updated.oauth_refresh_token,
                oauthTokenExpiresAt: updated.oauth_token_expires_at,
                syncEnabled: updated.sync_enabled,
                syncFrequencyMinutes: updated.sync_frequency_minutes,
                lastSyncedAt: updated.last_synced_at,
                isActive: updated.is_active,
                connectionStatus: updated.connection_status,
                lastError: updated.last_error,
                createdAt: updated.created_at,
                updatedAt: updated.updated_at,
            };
        },

        async deleteEmailAccount(id: string): Promise<boolean> {
            const supabase = getClient();

            const { error } = await supabase
                .from('email_accounts')
                .delete()
                .eq('id', id);

            return !error;
        },

        async syncEmailAccount(id: string): Promise<boolean> {
            const supabase = getClient();

            const { error } = await supabase
                .from('email_accounts')
                .update({ last_synced_at: new Date().toISOString() })
                .eq('id', id);

            return !error;
        },

        async testEmailAccountConnection(id: string): Promise<{ success: boolean; error?: string }> {
            // This would test the connection using the account credentials
            // For now, return a placeholder
            return { success: true };
        },

        // ==================
        // Email Operations
        // ==================
        async getEmails(accountId?: string, folder?: EmailFolder, limit = 50, offset = 0): Promise<Email[]> {
            const supabase = getClient();

            let query = supabase
                .from('emails')
                .select('*')
                .eq('is_deleted', false)
                .order('received_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (accountId) {
                query = query.eq('account_id', accountId);
            }

            if (folder) {
                query = query.eq('folder', folder);
            }

            const { data, error } = await query;

            if (error) {
                console.error('[Supabase] Failed to fetch emails:', error);
                return [];
            }

            return (data || []).map(email => ({
                id: email.id,
                tenantId: email.tenant_id,
                accountId: email.account_id,
                messageId: email.message_id,
                inReplyTo: email.in_reply_to,
                threadId: email.thread_id,
                fromAddress: email.from_address,
                fromName: email.from_name,
                toAddresses: email.to_addresses || [],
                ccAddresses: email.cc_addresses || [],
                bccAddresses: email.bcc_addresses || [],
                subject: email.subject,
                bodyText: email.body_text,
                bodyHtml: email.body_html,
                receivedAt: email.received_at,
                sentAt: email.sent_at,
                sizeBytes: email.size_bytes,
                isRead: email.is_read,
                isStarred: email.is_starred,
                isArchived: email.is_archived,
                isDeleted: email.is_deleted,
                labels: email.labels || [],
                folder: email.folder,
                attachments: email.attachments || [],
                headers: email.headers,
                metadata: email.metadata,
                createdAt: email.created_at,
                updatedAt: email.updated_at,
            }));
        },

        async getEmailById(id: string): Promise<Email | null> {
            const supabase = getClient();

            const { data, error } = await supabase
                .from('emails')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !data) return null;

            return {
                id: data.id,
                tenantId: data.tenant_id,
                accountId: data.account_id,
                messageId: data.message_id,
                inReplyTo: data.in_reply_to,
                threadId: data.thread_id,
                fromAddress: data.from_address,
                fromName: data.from_name,
                toAddresses: data.to_addresses || [],
                ccAddresses: data.cc_addresses || [],
                bccAddresses: data.bcc_addresses || [],
                subject: data.subject,
                bodyText: data.body_text,
                bodyHtml: data.body_html,
                receivedAt: data.received_at,
                sentAt: data.sent_at,
                sizeBytes: data.size_bytes,
                isRead: data.is_read,
                isStarred: data.is_starred,
                isArchived: data.is_archived,
                isDeleted: data.is_deleted,
                labels: data.labels || [],
                folder: data.folder,
                attachments: data.attachments || [],
                headers: data.headers,
                metadata: data.metadata,
                createdAt: data.created_at,
                updatedAt: data.updated_at,
            };
        },

        async searchEmails(query: string, folder?: EmailFolder, limit = 50): Promise<Email[]> {
            const supabase = getClient();

            // Use the search_emails function from the database
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase.rpc('search_emails', {
                p_user_id: user.id,
                p_query: query,
                p_folder: folder || null,
                p_limit: limit,
            });

            if (error) {
                console.error('[Supabase] Email search failed:', error);
                // Fallback to client-side search
                const allEmails = await this.getEmails(undefined, folder, limit);
                const lowerQuery = query.toLowerCase();
                return allEmails.filter(email =>
                    email.subject.toLowerCase().includes(lowerQuery) ||
                    email.fromAddress.toLowerCase().includes(lowerQuery) ||
                    email.fromName?.toLowerCase().includes(lowerQuery) ||
                    email.bodyText?.toLowerCase().includes(lowerQuery)
                );
            }

            return (data || []).map((email: any) => ({
                id: email.id,
                tenantId: email.tenant_id,
                accountId: email.account_id,
                messageId: email.message_id,
                inReplyTo: email.in_reply_to,
                threadId: email.thread_id,
                fromAddress: email.from_address,
                fromName: email.from_name,
                toAddresses: email.to_addresses || [],
                ccAddresses: email.cc_addresses || [],
                bccAddresses: email.bcc_addresses || [],
                subject: email.subject,
                bodyText: email.body_text,
                bodyHtml: email.body_html,
                receivedAt: email.received_at,
                sentAt: email.sent_at,
                sizeBytes: email.size_bytes,
                isRead: email.is_read,
                isStarred: email.is_starred,
                isArchived: email.is_archived,
                isDeleted: email.is_deleted,
                labels: email.labels || [],
                folder: email.folder,
                attachments: email.attachments || [],
                headers: email.headers,
                metadata: email.metadata,
                createdAt: email.created_at,
                updatedAt: email.updated_at,
            }));
        },

        async createEmail(input: EmailCreateInput): Promise<Email> {
            const supabase = getClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Get tenant_id from account
            const account = await this.getEmailAccountById(input.accountId);
            if (!account) throw new Error('Email account not found');

            const { data, error } = await supabase
                .from('emails')
                .insert({
                    tenant_id: account.tenantId,
                    account_id: input.accountId,
                    message_id: input.messageId,
                    in_reply_to: input.inReplyTo,
                    thread_id: input.threadId,
                    from_address: input.fromAddress,
                    from_name: input.fromName,
                    to_addresses: input.toAddresses,
                    cc_addresses: input.ccAddresses || [],
                    bcc_addresses: input.bccAddresses || [],
                    subject: input.subject,
                    body_text: input.bodyText,
                    body_html: input.bodyHtml,
                    received_at: input.receivedAt,
                    sent_at: input.sentAt,
                    size_bytes: input.sizeBytes,
                    folder: input.folder || 'inbox',
                    attachments: input.attachments || [],
                    headers: input.headers || {},
                    metadata: input.metadata || {},
                })
                .select()
                .single();

            if (error || !data) {
                throw new Error(`Failed to create email: ${error?.message}`);
            }

            return {
                id: data.id,
                tenantId: data.tenant_id,
                accountId: data.account_id,
                messageId: data.message_id,
                inReplyTo: data.in_reply_to,
                threadId: data.thread_id,
                fromAddress: data.from_address,
                fromName: data.from_name,
                toAddresses: data.to_addresses || [],
                ccAddresses: data.cc_addresses || [],
                bccAddresses: data.bcc_addresses || [],
                subject: data.subject,
                bodyText: data.body_text,
                bodyHtml: data.body_html,
                receivedAt: data.received_at,
                sentAt: data.sent_at,
                sizeBytes: data.size_bytes,
                isRead: data.is_read,
                isStarred: data.is_starred,
                isArchived: data.is_archived,
                isDeleted: data.is_deleted,
                labels: data.labels || [],
                folder: data.folder,
                attachments: data.attachments || [],
                headers: data.headers,
                metadata: data.metadata,
                createdAt: data.created_at,
                updatedAt: data.updated_at,
            };
        },

        async updateEmail(id: string, data: EmailUpdateInput): Promise<Email | null> {
            const supabase = getClient();

            const updateData: Record<string, unknown> = {};
            if (data.isRead !== undefined) updateData.is_read = data.isRead;
            if (data.isStarred !== undefined) updateData.is_starred = data.isStarred;
            if (data.isArchived !== undefined) updateData.is_archived = data.isArchived;
            if (data.isDeleted !== undefined) updateData.is_deleted = data.isDeleted;
            if (data.labels !== undefined) updateData.labels = data.labels;
            if (data.folder !== undefined) updateData.folder = data.folder;

            const { data: updated, error } = await supabase
                .from('emails')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error || !updated) return null;

            return {
                id: updated.id,
                tenantId: updated.tenant_id,
                accountId: updated.account_id,
                messageId: updated.message_id,
                inReplyTo: updated.in_reply_to,
                threadId: updated.thread_id,
                fromAddress: updated.from_address,
                fromName: updated.from_name,
                toAddresses: updated.to_addresses || [],
                ccAddresses: updated.cc_addresses || [],
                bccAddresses: updated.bcc_addresses || [],
                subject: updated.subject,
                bodyText: updated.body_text,
                bodyHtml: updated.body_html,
                receivedAt: updated.received_at,
                sentAt: updated.sent_at,
                sizeBytes: updated.size_bytes,
                isRead: updated.is_read,
                isStarred: updated.is_starred,
                isArchived: updated.is_archived,
                isDeleted: updated.is_deleted,
                labels: updated.labels || [],
                folder: updated.folder,
                attachments: updated.attachments || [],
                headers: updated.headers,
                metadata: updated.metadata,
                createdAt: updated.created_at,
                updatedAt: updated.updated_at,
            };
        },

        async deleteEmail(id: string): Promise<boolean> {
            // Soft delete - mark as deleted locally only
            const supabase = getClient();

            const { error } = await supabase
                .from('emails')
                .update({ is_deleted: true })
                .eq('id', id);

            return !error;
        },

        async markEmailRead(id: string, isRead: boolean): Promise<Email | null> {
            return this.updateEmail(id, { isRead });
        },

        async markEmailStarred(id: string, isStarred: boolean): Promise<Email | null> {
            return this.updateEmail(id, { isStarred });
        },

        async archiveEmail(id: string, isArchived: boolean): Promise<Email | null> {
            return this.updateEmail(id, { isArchived });
        },

        async moveEmailToFolder(id: string, folder: EmailFolder): Promise<Email | null> {
            return this.updateEmail(id, { folder });
        },

        async getUnreadEmailCount(): Promise<number> {
            const supabase = getClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return 0;

            const { data, error } = await supabase.rpc('get_unread_email_count', {
                p_user_id: user.id,
            });

            if (error) {
                // Fallback to counting manually
                const emails = await this.getEmails();
                return emails.filter(e => !e.isRead && !e.isDeleted && e.folder === 'inbox').length;
            }

            return data || 0;
        },

        // ==================
        // Email Label Operations
        // ==================
        async getEmailLabels(): Promise<EmailLabel[]> {
            const supabase = getClient();

            const { data, error } = await supabase
                .from('email_labels')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('[Supabase] Failed to fetch email labels:', error);
                return [];
            }

            return (data || []).map(label => ({
                id: label.id,
                tenantId: label.tenant_id,
                userId: label.user_id,
                name: label.name,
                color: label.color,
                createdAt: label.created_at,
            }));
        },

        async createEmailLabel(name: string, color = '#6366f1'): Promise<EmailLabel> {
            const supabase = getClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data: profile } = await supabase
                .from('profiles')
                .select('tenant_id')
                .eq('id', user.id)
                .single();

            if (!profile?.tenant_id) {
                throw new Error('User tenant not found');
            }

            const { data, error } = await supabase
                .from('email_labels')
                .insert({
                    tenant_id: profile.tenant_id,
                    user_id: user.id,
                    name,
                    color,
                })
                .select()
                .single();

            if (error || !data) {
                throw new Error(`Failed to create email label: ${error?.message}`);
            }

            return {
                id: data.id,
                tenantId: data.tenant_id,
                userId: data.user_id,
                name: data.name,
                color: data.color,
                createdAt: data.created_at,
            };
        },

        async updateEmailLabel(id: string, data: Partial<EmailLabel>): Promise<EmailLabel | null> {
            const supabase = getClient();

            const updateData: Record<string, unknown> = {};
            if (data.name !== undefined) updateData.name = data.name;
            if (data.color !== undefined) updateData.color = data.color;

            const { data: updated, error } = await supabase
                .from('email_labels')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error || !updated) return null;

            return {
                id: updated.id,
                tenantId: updated.tenant_id,
                userId: updated.user_id,
                name: updated.name,
                color: updated.color,
                createdAt: updated.created_at,
            };
        },

        async deleteEmailLabel(id: string): Promise<boolean> {
            const supabase = getClient();

            const { error } = await supabase
                .from('email_labels')
                .delete()
                .eq('id', id);

            return !error;
        },

        async addLabelToEmail(emailId: string, labelId: string): Promise<boolean> {
            const email = await this.getEmailById(emailId);
            if (!email) return false;

            const label = await this.getEmailLabels().then(labels => labels.find(l => l.id === labelId));
            if (!label) return false;

            const currentLabels = email.labels || [];
            if (currentLabels.includes(label.name)) return true; // Already labeled

            return this.updateEmail(emailId, {
                labels: [...currentLabels, label.name],
            }).then(() => true).catch(() => false);
        },

        async removeLabelFromEmail(emailId: string, labelId: string): Promise<boolean> {
            const email = await this.getEmailById(emailId);
            if (!email) return false;

            const label = await this.getEmailLabels().then(labels => labels.find(l => l.id === labelId));
            if (!label) return false;

            const currentLabels = email.labels || [];
            const updatedLabels = currentLabels.filter(l => l !== label.name);

            return this.updateEmail(emailId, {
                labels: updatedLabels,
            }).then(() => true).catch(() => false);
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

        // ==================
        // Comment Operations
        // ==================
        async getComments(taskId: string): Promise<Comment[]> {
            const supabase = getClient();
            const { data, error } = await supabase
                .from('comments')
                .select('*')
                .eq('task_id', taskId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Failed to fetch comments:', error);
                return [];
            }

            return (data || []).map((c: any) => ({
                id: c.id,
                taskId: c.task_id,
                userId: c.user_id,
                userName: c.user_name,
                userAvatar: c.user_avatar || undefined,
                content: c.content,
                isInternal: c.is_internal || false,
                createdAt: c.created_at,
                updatedAt: c.updated_at || undefined,
            }));
        },

        async createComment(input): Promise<Comment> {
            const supabase = getClient();
            const now = new Date().toISOString();
            const { data, error } = await supabase
                .from('comments')
                .insert({
                    task_id: input.taskId,
                    user_id: input.userId,
                    user_name: input.userName,
                    user_avatar: input.userAvatar || null,
                    content: input.content,
                    is_internal: input.isInternal || false,
                    created_at: now,
                })
                .select()
                .single();

            if (error || !data) {
                throw new Error(`Failed to create comment: ${error?.message || 'Unknown error'}`);
            }

            return {
                id: data.id,
                taskId: data.task_id,
                userId: data.user_id,
                userName: data.user_name,
                userAvatar: data.user_avatar || undefined,
                content: data.content,
                isInternal: data.is_internal || false,
                createdAt: data.created_at,
                updatedAt: data.updated_at || undefined,
            };
        },

        async updateComment(id: string, content: string): Promise<Comment | null> {
            const supabase = getClient();
            const { data, error } = await supabase
                .from('comments')
                .update({
                    content,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single();

            if (error || !data) {
                console.error('Failed to update comment:', error);
                return null;
            }

            return {
                id: data.id,
                taskId: data.task_id,
                userId: data.user_id,
                userName: data.user_name,
                userAvatar: data.user_avatar || undefined,
                content: data.content,
                isInternal: data.is_internal || false,
                createdAt: data.created_at,
                updatedAt: data.updated_at || undefined,
            };
        },

        async deleteComment(id: string): Promise<boolean> {
            const supabase = getClient();
            const { error } = await supabase
                .from('comments')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Failed to delete comment:', error);
                return false;
            }

            return true;
        },

        // ==================
        // Activity Operations
        // ==================
        async getActivity(taskId: string): Promise<Activity[]> {
            const supabase = getClient();
            const { data, error } = await supabase
                .from('activities')
                .select('*')
                .eq('task_id', taskId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Failed to fetch activity:', error);
                return [];
            }

            return (data || []).map((a: any) => ({
                id: a.id,
                taskId: a.task_id,
                userId: a.user_id,
                userName: a.user_name,
                action: a.action as Activity['action'],
                details: a.details || undefined,
                createdAt: a.created_at,
            }));
        },

        async logActivity(activity): Promise<Activity> {
            const supabase = getClient();
            const now = new Date().toISOString();
            const { data, error } = await supabase
                .from('activities')
                .insert({
                    task_id: activity.taskId,
                    user_id: activity.userId,
                    user_name: activity.userName,
                    action: activity.action,
                    details: activity.details || null,
                    created_at: now,
                })
                .select()
                .single();

            if (error || !data) {
                throw new Error(`Failed to log activity: ${error?.message || 'Unknown error'}`);
            }

            return {
                id: data.id,
                taskId: data.task_id,
                userId: data.user_id,
                userName: data.user_name,
                action: data.action as Activity['action'],
                details: data.details || undefined,
                createdAt: data.created_at,
            };
        },

        // ==================
        // Task Relationship Operations
        // ==================
        async getTaskRelationships(taskId?: string): Promise<TaskRelationship[]> {
            const supabase = getClient();
            let query = supabase.from('task_relationships').select('*');

            if (taskId) {
                query = query.or(`source_task_id.eq.${taskId},target_task_id.eq.${taskId}`);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) {
                console.error('Failed to fetch task relationships:', error);
                return [];
            }

            return (data || []).map((r: any) => ({
                id: r.id,
                sourceTaskId: r.source_task_id,
                targetTaskId: r.target_task_id,
                relationshipType: r.relationship_type as TaskRelationshipType,
                createdAt: r.created_at,
            }));
        },

        async createTaskRelationship(input): Promise<TaskRelationship> {
            const supabase = getClient();
            const now = new Date().toISOString();
            const { data, error } = await supabase
                .from('task_relationships')
                .insert({
                    source_task_id: input.sourceTaskId,
                    target_task_id: input.targetTaskId,
                    relationship_type: input.relationshipType,
                    created_at: now,
                })
                .select()
                .single();

            if (error || !data) {
                throw new Error(`Failed to create task relationship: ${error?.message || 'Unknown error'}`);
            }

            return {
                id: data.id,
                sourceTaskId: data.source_task_id,
                targetTaskId: data.target_task_id,
                relationshipType: data.relationship_type as TaskRelationshipType,
                createdAt: data.created_at,
            };
        },

        async deleteTaskRelationship(id: string): Promise<boolean> {
            const supabase = getClient();
            const { error } = await supabase
                .from('task_relationships')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Failed to delete task relationship:', error);
                return false;
            }

            return true;
        },

        // ==================
        // SLA Configuration Operations
        // ==================
        async getSLAConfigs(): Promise<SLAConfig[]> {
            const supabase = getClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data: profile } = await supabase
                .from('profiles')
                .select('tenant_id')
                .eq('id', user.id)
                .single();

            if (!profile?.tenant_id) {
                throw new Error('User tenant not found');
            }

            const { data, error } = await supabase
                .from('sla_configs')
                .select('*')
                .eq('tenant_id', profile.tenant_id)
                .order('workflow', { ascending: true })
                .order('priority', { ascending: true });

            if (error) throw error;
            return (data || []).map(c => ({
                id: c.id,
                workflow: c.workflow,
                priority: c.priority,
                responseTimeMinutes: c.response_time_minutes,
                resolutionTimeMinutes: c.resolution_time_minutes,
                createdAt: c.created_at,
                updatedAt: c.updated_at,
            }));
        },

        async getSLAConfigById(id: string): Promise<SLAConfig | null> {
            const supabase = getClient();
            const { data, error } = await supabase
                .from('sla_configs')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !data) return null;
            return {
                id: data.id,
                workflow: data.workflow,
                priority: data.priority,
                responseTimeMinutes: data.response_time_minutes,
                resolutionTimeMinutes: data.resolution_time_minutes,
                createdAt: data.created_at,
                updatedAt: data.updated_at,
            };
        },

        async createSLAConfig(config): Promise<SLAConfig> {
            const supabase = getClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data: profile } = await supabase
                .from('profiles')
                .select('tenant_id')
                .eq('id', user.id)
                .single();

            if (!profile?.tenant_id) {
                throw new Error('User tenant not found');
            }

            const { data, error } = await supabase
                .from('sla_configs')
                .insert({
                    tenant_id: profile.tenant_id,
                    workflow: config.workflow,
                    priority: config.priority,
                    response_time_minutes: config.responseTimeMinutes,
                    resolution_time_minutes: config.resolutionTimeMinutes,
                })
                .select()
                .single();

            if (error) throw error;
            return {
                id: data.id,
                workflow: data.workflow,
                priority: data.priority,
                responseTimeMinutes: data.response_time_minutes,
                resolutionTimeMinutes: data.resolution_time_minutes,
                createdAt: data.created_at,
                updatedAt: data.updated_at,
            };
        },

        async updateSLAConfig(id: string, data): Promise<SLAConfig | null> {
            const supabase = getClient();
            const updateData: Record<string, unknown> = {
                updated_at: new Date().toISOString(),
            };

            if (data.workflow !== undefined) updateData.workflow = data.workflow;
            if (data.priority !== undefined) updateData.priority = data.priority;
            if (data.responseTimeMinutes !== undefined) updateData.response_time_minutes = data.responseTimeMinutes;
            if (data.resolutionTimeMinutes !== undefined) updateData.resolution_time_minutes = data.resolutionTimeMinutes;

            const { data: updated, error } = await supabase
                .from('sla_configs')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error || !updated) return null;
            return {
                id: updated.id,
                workflow: updated.workflow,
                priority: updated.priority,
                responseTimeMinutes: updated.response_time_minutes,
                resolutionTimeMinutes: updated.resolution_time_minutes,
                createdAt: updated.created_at,
                updatedAt: updated.updated_at,
            };
        },

        async deleteSLAConfig(id: string): Promise<boolean> {
            const supabase = getClient();
            const { error } = await supabase
                .from('sla_configs')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Failed to delete SLA config:', error);
                return false;
            }

            return true;
        },

        // ==================
        // Time Entry Operations
        // ==================
        async getTimeEntries(taskId?: string): Promise<TimeEntry[]> {
            const supabase = getClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data: profile } = await supabase
                .from('profiles')
                .select('tenant_id')
                .eq('id', user.id)
                .single();

            if (!profile?.tenant_id) {
                throw new Error('User tenant not found');
            }

            let query = supabase
                .from('time_entries')
                .select('*')
                .eq('tenant_id', profile.tenant_id);

            if (taskId) {
                query = query.eq('task_id', taskId);
            }

            const { data, error } = await query
                .order('logged_at', { ascending: false });

            if (error) throw error;
            return (data || []).map(e => ({
                id: e.id,
                taskId: e.task_id,
                userId: e.user_id,
                userName: e.user_name,
                durationMinutes: e.duration_minutes,
                description: e.description || undefined,
                loggedAt: e.logged_at,
                createdAt: e.created_at,
            }));
        },

        async getTimeEntryById(id: string): Promise<TimeEntry | null> {
            const supabase = getClient();
            const { data, error } = await supabase
                .from('time_entries')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !data) return null;
            return {
                id: data.id,
                taskId: data.task_id,
                userId: data.user_id,
                userName: data.user_name,
                durationMinutes: data.duration_minutes,
                description: data.description || undefined,
                loggedAt: data.logged_at,
                createdAt: data.created_at,
            };
        },

        async createTimeEntry(input): Promise<TimeEntry> {
            const supabase = getClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data: profile } = await supabase
                .from('profiles')
                .select('tenant_id')
                .eq('id', user.id)
                .single();

            if (!profile?.tenant_id) {
                throw new Error('User tenant not found');
            }

            const { data, error } = await supabase
                .from('time_entries')
                .insert({
                    tenant_id: profile.tenant_id,
                    task_id: input.taskId,
                    user_id: input.userId,
                    user_name: input.userName,
                    duration_minutes: input.durationMinutes,
                    description: input.description || null,
                    logged_at: input.loggedAt || new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;
            return {
                id: data.id,
                taskId: data.task_id,
                userId: data.user_id,
                userName: data.user_name,
                durationMinutes: data.duration_minutes,
                description: data.description || undefined,
                loggedAt: data.logged_at,
                createdAt: data.created_at,
            };
        },

        async updateTimeEntry(id: string, data): Promise<TimeEntry | null> {
            const supabase = getClient();
            const updateData: Record<string, unknown> = {};

            if (data.durationMinutes !== undefined) updateData.duration_minutes = data.durationMinutes;
            if (data.description !== undefined) updateData.description = data.description || null;
            if (data.loggedAt !== undefined) updateData.logged_at = data.loggedAt;

            const { data: updated, error } = await supabase
                .from('time_entries')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error || !updated) return null;
            return {
                id: updated.id,
                taskId: updated.task_id,
                userId: updated.user_id,
                userName: updated.user_name,
                durationMinutes: updated.duration_minutes,
                description: updated.description || undefined,
                loggedAt: updated.logged_at,
                createdAt: updated.created_at,
            };
        },

        async deleteTimeEntry(id: string): Promise<boolean> {
            const supabase = getClient();
            const { error } = await supabase
                .from('time_entries')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Failed to delete time entry:', error);
                return false;
            }

            return true;
        },

        // ==================
        // Agent Operations
        // ==================
        async getAgentConversation(sessionId: string) {
            const supabase = getClient();
            const { data, error } = await supabase
                .from('agent_conversations')
                .select('*')
                .eq('session_id', sessionId)
                .single();

            if (error || !data) return null;
            return {
                id: data.id,
                userId: data.user_id,
                sessionId: data.session_id,
                messages: data.messages || [],
                createdAt: data.created_at,
                updatedAt: data.updated_at,
            };
        },

        async saveAgentConversation(conversation) {
            const supabase = getClient();
            const { data, error } = await supabase
                .from('agent_conversations')
                .insert({
                    user_id: conversation.userId,
                    session_id: conversation.sessionId,
                    messages: conversation.messages,
                })
                .select()
                .single();

            if (error) throw error;
            return {
                id: data.id,
                userId: data.user_id,
                sessionId: data.session_id,
                messages: data.messages || [],
                createdAt: data.created_at,
                updatedAt: data.updated_at,
            };
        },

        async updateAgentConversation(sessionId: string, messages) {
            const supabase = getClient();
            const { data, error } = await supabase
                .from('agent_conversations')
                .update({ messages, updated_at: new Date().toISOString() })
                .eq('session_id', sessionId)
                .select()
                .single();

            if (error || !data) return null;
            return {
                id: data.id,
                userId: data.user_id,
                sessionId: data.session_id,
                messages: data.messages || [],
                createdAt: data.created_at,
                updatedAt: data.updated_at,
            };
        },

        async logAgentAction(action) {
            const supabase = getClient();
            const { data, error } = await supabase
                .from('agent_action_logs')
                .insert({
                    user_id: action.userId,
                    session_id: action.sessionId,
                    action_type: action.actionType,
                    input_params: action.inputParams,
                    result: action.result,
                    verified: action.verified,
                })
                .select()
                .single();

            if (error) throw error;
            return {
                id: data.id,
                userId: data.user_id,
                sessionId: data.session_id,
                actionType: data.action_type,
                inputParams: data.input_params,
                result: data.result,
                verified: data.verified,
                createdAt: data.created_at,
            };
        },

        async getAgentActionLog(sessionId: string, limit = 50) {
            const supabase = getClient();
            const { data, error } = await supabase
                .from('agent_action_logs')
                .select('*')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return (data || []).map(log => ({
                id: log.id,
                userId: log.user_id,
                sessionId: log.session_id,
                actionType: log.action_type,
                inputParams: log.input_params,
                result: log.result,
                verified: log.verified,
                createdAt: log.created_at,
            }));
        },

        async createEntityMapping(mapping) {
            const supabase = getClient();
            const { data, error } = await supabase
                .from('agent_entity_mappings')
                .insert({
                    user_id: mapping.userId,
                    source_type: mapping.sourceType,
                    source_id: mapping.sourceId,
                    target_type: mapping.targetType,
                    target_id: mapping.targetId,
                })
                .select()
                .single();

            if (error) throw error;
            return {
                id: data.id,
                userId: data.user_id,
                sourceType: data.source_type,
                sourceId: data.source_id,
                targetType: data.target_type,
                targetId: data.target_id,
                createdAt: data.created_at,
            };
        },

        async getEntityMappings(sourceType: string, sourceId: string) {
            const supabase = getClient();
            const { data, error } = await supabase
                .from('agent_entity_mappings')
                .select('*')
                .eq('source_type', sourceType)
                .eq('source_id', sourceId);

            if (error) throw error;
            return (data || []).map(m => ({
                id: m.id,
                userId: m.user_id,
                sourceType: m.source_type,
                sourceId: m.source_id,
                targetType: m.target_type,
                targetId: m.target_id,
                createdAt: m.created_at,
            }));
        },

        async getEntityMappingsByTarget(targetType: string, targetId: string) {
            const supabase = getClient();
            const { data, error } = await supabase
                .from('agent_entity_mappings')
                .select('*')
                .eq('target_type', targetType)
                .eq('target_id', targetId);

            if (error) throw error;
            return (data || []).map(m => ({
                id: m.id,
                userId: m.user_id,
                sourceType: m.source_type,
                sourceId: m.source_id,
                targetType: m.target_type,
                targetId: m.target_id,
                createdAt: m.created_at,
            }));
        },
    };
}
