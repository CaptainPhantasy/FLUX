// @ts-nocheck
// =====================================
// FLUX - Database Provider Interface
// =====================================
// This defines the contract that all database adapters must implement.
// The Zustand store calls these methods, and the adapter handles persistence.

import type {
    User,
    Team,
    Task,
    TaskRelationship,
    TaskRelationshipType,
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
    AgentConversation,
    AgentActionLog,
    AgentEntityMapping,
    Comment,
    Activity,
    CommentCreateInput,
    SLAConfig,
    TimeEntry,
    TimeEntryCreateInput,
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
    
    // Team Management Operations
    getUsers(): Promise<User[]>;
    getUserById(id: string): Promise<User | null>;
    createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User>;
    updateUser(id: string, data: Partial<User>): Promise<User | null>;
    deleteUser(id: string): Promise<boolean>;
    
    getTeams(): Promise<Team[]>;
    getTeamById(id: string): Promise<Team | null>;
    createTeam(team: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<Team>;
    updateTeam(id: string, data: Partial<Team>): Promise<Team | null>;
    deleteTeam(id: string): Promise<boolean>;

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
    // Email Account Operations
    // ==================
    getEmailAccounts(): Promise<EmailAccount[]>;
    getEmailAccountById(id: string): Promise<EmailAccount | null>;
    createEmailAccount(input: EmailAccountCreateInput): Promise<EmailAccount>;
    updateEmailAccount(id: string, data: Partial<EmailAccount>): Promise<EmailAccount | null>;
    deleteEmailAccount(id: string): Promise<boolean>;
    syncEmailAccount(id: string): Promise<boolean>;
    testEmailAccountConnection(id: string): Promise<{ success: boolean; error?: string }>;

    // ==================
    // Email Operations
    // ==================
    getEmails(accountId?: string, folder?: EmailFolder, limit?: number, offset?: number): Promise<Email[]>;
    getEmailById(id: string): Promise<Email | null>;
    searchEmails(query: string, folder?: EmailFolder, limit?: number): Promise<Email[]>;
    createEmail(input: EmailCreateInput): Promise<Email>;
    updateEmail(id: string, data: EmailUpdateInput): Promise<Email | null>;
    deleteEmail(id: string): Promise<boolean>; // Local delete only
    markEmailRead(id: string, isRead: boolean): Promise<Email | null>;
    markEmailStarred(id: string, isStarred: boolean): Promise<Email | null>;
    archiveEmail(id: string, isArchived: boolean): Promise<Email | null>;
    moveEmailToFolder(id: string, folder: EmailFolder): Promise<Email | null>;
    getUnreadEmailCount(): Promise<number>;

    // ==================
    // Email Label Operations
    // ==================
    getEmailLabels(): Promise<EmailLabel[]>;
    createEmailLabel(name: string, color?: string): Promise<EmailLabel>;
    updateEmailLabel(id: string, data: Partial<EmailLabel>): Promise<EmailLabel | null>;
    deleteEmailLabel(id: string): Promise<boolean>;
    addLabelToEmail(emailId: string, labelId: string): Promise<boolean>;
    removeLabelFromEmail(emailId: string, labelId: string): Promise<boolean>;

    // ==================
    // Lifecycle
    // ==================
    initialize(): Promise<void>;
    disconnect(): Promise<void>;

    // ==================
    // Agent Operations
    // ==================
    // Conversation Memory
    getAgentConversation(sessionId: string): Promise<AgentConversation | null>;
    saveAgentConversation(conversation: Omit<AgentConversation, 'id' | 'createdAt' | 'updatedAt'>): Promise<AgentConversation>;
    updateAgentConversation(sessionId: string, messages: AgentConversation['messages']): Promise<AgentConversation | null>;
    
    // Action Logging
    logAgentAction(action: Omit<AgentActionLog, 'id' | 'createdAt'>): Promise<AgentActionLog>;
    getAgentActionLog(sessionId: string, limit?: number): Promise<AgentActionLog[]>;
    
    // Entity Mappings
    createEntityMapping(mapping: Omit<AgentEntityMapping, 'id' | 'createdAt'>): Promise<AgentEntityMapping>;
    getEntityMappings(sourceType: string, sourceId: string): Promise<AgentEntityMapping[]>;
    getEntityMappingsByTarget(targetType: string, targetId: string): Promise<AgentEntityMapping[]>;

    // ==================
    // Comment Operations
    // ==================
    getComments(taskId: string): Promise<Comment[]>;
    createComment(input: CommentCreateInput & { userId: string; userName: string; userAvatar?: string }): Promise<Comment>;
    updateComment(id: string, content: string): Promise<Comment | null>;
    deleteComment(id: string): Promise<boolean>;
    
    // ==================
    // Activity Operations
    // ==================
    getActivity(taskId: string): Promise<Activity[]>;
    logActivity(activity: Omit<Activity, 'id' | 'createdAt'>): Promise<Activity>;

    // ==================
    // Task Relationship Operations
    // ==================
    getTaskRelationships(taskId?: string): Promise<TaskRelationship[]>;
    createTaskRelationship(input: Omit<TaskRelationship, 'id' | 'createdAt'>): Promise<TaskRelationship>;
    deleteTaskRelationship(id: string): Promise<boolean>;

    // ==================
    // SLA Configuration Operations
    // ==================
    getSLAConfigs(): Promise<SLAConfig[]>;
    getSLAConfigById(id: string): Promise<SLAConfig | null>;
    createSLAConfig(config: Omit<SLAConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<SLAConfig>;
    updateSLAConfig(id: string, data: Partial<SLAConfig>): Promise<SLAConfig | null>;
    deleteSLAConfig(id: string): Promise<boolean>;

    // ==================
    // Time Entry Operations
    // ==================
    getTimeEntries(taskId?: string): Promise<TimeEntry[]>;
    getTimeEntryById(id: string): Promise<TimeEntry | null>;
    createTimeEntry(input: TimeEntryCreateInput & { userId: string; userName: string }): Promise<TimeEntry>;
    updateTimeEntry(id: string, data: Partial<TimeEntry>): Promise<TimeEntry | null>;
    deleteTimeEntry(id: string): Promise<boolean>;

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
