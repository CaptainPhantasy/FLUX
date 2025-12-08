// =====================================
// FLUX - Local Storage Adapter
// =====================================
// Implements FluxDataProvider using localStorage/IndexedDB
// Perfect for offline use or quick demos without backend setup

// @ts-nocheck
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
    AgentConversation,
    AgentActionLog,
    AgentEntityMapping,
    SLAConfig,
    TimeEntry,
    TimeEntryCreateInput,
} from '@/types';

const STORAGE_KEYS = {
    user: 'flux_user',
    users: 'flux_users',
    teams: 'flux_teams',
    tasks: 'flux_tasks',
    notifications: 'flux_notifications',
    projects: 'flux_projects',
    assets: 'flux_assets',
    integrations: 'flux_integrations',
    comments: 'flux_comments',
    activities: 'flux_activities',
    taskRelationships: 'flux_task_relationships',
    agentConversations: 'flux_agent_conversations',
    agentActionLogs: 'flux_agent_action_logs',
    agentEntityMappings: 'flux_agent_entity_mappings',
    slaConfigs: 'flux_sla_configs',
    timeEntries: 'flux_time_entries',
} as const;

// Utility functions
function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function getFromStorage<T>(key: string, defaultValue: T): T {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : defaultValue;
    } catch {
        return defaultValue;
    }
}

function saveToStorage<T>(key: string, value: T): void {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
    }
}

// Mock initial data
const INITIAL_USER: User = {
    id: 'local-user-1',
    name: 'Flux User',
    email: 'user@flux.local',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=flux',
    role: 'admin',
    preferences: {
        theme: 'dark',
        sidebarCollapsed: false,
        notificationsEnabled: true,
    },
    createdAt: new Date().toISOString(),
};

const INITIAL_USERS: User[] = [
    {
        id: 'u1',
        name: 'Alice Chen',
        email: 'alice@flux.local',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
        role: 'member',
        createdAt: new Date().toISOString(),
    },
    {
        id: 'u2',
        name: 'Bob Rivera',
        email: 'bob@flux.local',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
        role: 'member',
        createdAt: new Date().toISOString(),
    },
    {
        id: 'u3',
        name: 'Sarah Johnson',
        email: 'sarah@flux.local',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
        role: 'member',
        createdAt: new Date().toISOString(),
    },
    {
        id: 'u4',
        name: 'Mike Chen',
        email: 'mike@flux.local',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
        role: 'member',
        createdAt: new Date().toISOString(),
    },
];

const INITIAL_TEAMS: Team[] = [
    {
        id: 'team-1',
        name: 'Engineering',
        description: 'Software engineering team',
        memberIds: ['u1', 'u2'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'team-2',
        name: 'Support',
        description: 'Customer support team',
        memberIds: ['u3', 'u4'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];

const INITIAL_TASKS: Task[] = [
    {
        id: 't1',
        title: 'Design System Audit',
        description: 'Review and audit current design system tokens and ensure consistency across all components.',
        status: 'todo',
        priority: 'high',
        tags: ['Design', 'Audit'],
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignee: { id: 'u1', name: 'Alice Chen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice' },
        order: 0,
    },
    {
        id: 't2',
        title: 'Integrate Gemini API',
        description: 'Connect the Gemini AI service to power the Flux Command Terminal with intelligent responses.',
        status: 'todo',
        priority: 'high',
        tags: ['Dev', 'AI'],
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignee: { id: 'u2', name: 'Bob Rivera', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob' },
        order: 1,
    },
    {
        id: 't3',
        title: 'Fix Navigation Bug on Mobile',
        description: 'Sidebar collapses incorrectly on mobile viewport widths below 768px.',
        status: 'in-progress',
        priority: 'medium',
        tags: ['Bug', 'Mobile'],
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        assignee: { id: 'u3', name: 'Charlie Kim', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie' },
        order: 0,
    },
    {
        id: 't4',
        title: 'Optimize React Rendering',
        description: 'Implement React.memo and useMemo where beneficial, reduce unnecessary re-renders in Kanban board.',
        status: 'in-progress',
        priority: 'high',
        tags: ['Performance', 'React'],
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        assignee: { id: 'u1', name: 'Alice Chen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice' },
        order: 1,
    },
    {
        id: 't5',
        title: 'Setup CI/CD Pipeline',
        description: 'Configure GitHub Actions for automated testing and deployment to staging environment.',
        status: 'done',
        priority: 'low',
        tags: ['DevOps'],
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        assignee: { id: 'u4', name: 'David Park', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david' },
        order: 0,
    },
    {
        id: 't6',
        title: 'User Interviews Round 1',
        description: 'Completed 5 user interviews for the core workflow. Synthesized findings into actionable insights.',
        status: 'done',
        priority: 'medium',
        tags: ['Research', 'UX'],
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        assignee: { id: 'u5', name: 'Eve Johnson', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=eve' },
        order: 1,
    },
];

const INITIAL_NOTIFICATIONS: Notification[] = [
    {
        id: 'n1',
        type: 'mention',
        title: 'New Comment',
        description: 'mentioned you in "Q3 Design System Refresh"',
        isRead: false,
        createdAt: new Date().toISOString(),
        user: { id: 'u1', name: 'Sarah Chen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah' },
    },
    {
        id: 'n2',
        type: 'task_update',
        title: 'Task Completed',
        description: 'marked "Setup CI/CD Pipeline" as done',
        isRead: false,
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        user: { id: 'u4', name: 'David Park', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david' },
        context: {
            taskId: 't5',
            taskTitle: 'Setup CI/CD Pipeline',
            status: 'done',
        },
    },
    {
        id: 'n3',
        type: 'ai_suggestion',
        title: 'AI Insight Available',
        description: 'Flux has identified 3 tasks that could be automated. Review suggestions?',
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'n4',
        type: 'system',
        title: 'Welcome to Flux',
        description: 'Your AI-native project management workspace is ready. Press ⌘K to summon the command terminal.',
        isRead: true,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
];

const INITIAL_PROJECTS: Project[] = [
    {
        id: 'p1',
        name: 'Legacy AI',
        description: 'AI-powered workflow automation',
        color: '#10B981',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        ownerId: 'local-user-1',
        members: ['u1', 'u2', 'u3', 'u4', 'u5'],
    },
];

/**
 * Local Storage Adapter Implementation
 */
export function createLocalAdapter(): FluxDataProvider {
    // Track subscription callbacks for real-time simulation
    let taskSubscribers: ((tasks: Task[]) => void)[] = [];
    let notificationSubscribers: ((notifications: Notification[]) => void)[] = [];

    // Notify task subscribers
    const notifyTaskChange = () => {
        const tasks = getFromStorage<Task[]>(STORAGE_KEYS.tasks, []);
        console.log('[LocalAdapter] notifyTaskChange - tasks in storage:', tasks.length);
        console.log('[LocalAdapter] notifyTaskChange - subscribers:', taskSubscribers.length);
        taskSubscribers.forEach(cb => {
            console.log('[LocalAdapter] Calling subscriber callback');
            cb(tasks);
        });
    };

    // Notify notification subscribers
    const notifyNotificationChange = () => {
        const notifications = getFromStorage<Notification[]>(STORAGE_KEYS.notifications, []);
        notificationSubscribers.forEach(cb => cb(notifications));
    };

    return {
        // ==================
        // User Operations
        // ==================
        async getCurrentUser(): Promise<User | null> {
            return getFromStorage<User | null>(STORAGE_KEYS.user, null);
        },

        async updateUserPreferences(userId, preferences): Promise<User | null> {
            const user = getFromStorage<User | null>(STORAGE_KEYS.user, null);
            if (!user || user.id !== userId) return null;

            const updated = {
                ...user,
                preferences: { ...user.preferences, ...preferences },
            };
            saveToStorage(STORAGE_KEYS.user, updated);
            return updated;
        },

        // ==================
        // Team Management Operations
        // ==================
        async getUsers(): Promise<User[]> {
            return getFromStorage<User[]>(STORAGE_KEYS.users, INITIAL_USERS);
        },

        async getUserById(id: string): Promise<User | null> {
            const users = await this.getUsers();
            return users.find(u => u.id === id) || null;
        },

        async createUser(userData): Promise<User> {
            const users = await this.getUsers();
            const newUser: User = {
                ...userData,
                id: generateId(),
                createdAt: new Date().toISOString(),
            };
            users.push(newUser);
            saveToStorage(STORAGE_KEYS.users, users);
            return newUser;
        },

        async updateUser(id: string, data: Partial<User>): Promise<User | null> {
            const users = await this.getUsers();
            const index = users.findIndex(u => u.id === id);
            if (index === -1) return null;

            users[index] = {
                ...users[index],
                ...data,
            };
            saveToStorage(STORAGE_KEYS.users, users);
            return users[index];
        },

        async deleteUser(id: string): Promise<boolean> {
            const users = await this.getUsers();
            const filtered = users.filter(u => u.id !== id);
            if (filtered.length === users.length) return false;

            saveToStorage(STORAGE_KEYS.users, filtered);
            return true;
        },

        async getTeams(): Promise<Team[]> {
            return getFromStorage<Team[]>(STORAGE_KEYS.teams, INITIAL_TEAMS);
        },

        async getTeamById(id: string): Promise<Team | null> {
            const teams = await this.getTeams();
            return teams.find(t => t.id === id) || null;
        },

        async createTeam(teamData): Promise<Team> {
            const teams = await this.getTeams();
            const now = new Date().toISOString();
            const newTeam: Team = {
                ...teamData,
                id: generateId(),
                createdAt: now,
                updatedAt: now,
            };
            teams.push(newTeam);
            saveToStorage(STORAGE_KEYS.teams, teams);
            return newTeam;
        },

        async updateTeam(id: string, data: Partial<Team>): Promise<Team | null> {
            const teams = await this.getTeams();
            const index = teams.findIndex(t => t.id === id);
            if (index === -1) return null;

            teams[index] = {
                ...teams[index],
                ...data,
                updatedAt: new Date().toISOString(),
            };
            saveToStorage(STORAGE_KEYS.teams, teams);
            return teams[index];
        },

        async deleteTeam(id: string): Promise<boolean> {
            const teams = await this.getTeams();
            const filtered = teams.filter(t => t.id !== id);
            if (filtered.length === teams.length) return false;

            saveToStorage(STORAGE_KEYS.teams, filtered);
            return true;
        },

        // ==================
        // Task Operations
        // ==================
        async getTasks(projectId?): Promise<Task[]> {
            const tasks = getFromStorage<Task[]>(STORAGE_KEYS.tasks, []);
            return projectId ? tasks.filter(t => t.projectId === projectId) : tasks;
        },

        async getTaskById(id): Promise<Task | null> {
            const tasks = getFromStorage<Task[]>(STORAGE_KEYS.tasks, []);
            return tasks.find(t => t.id === id) || null;
        },

        async createTask(input): Promise<Task> {
            console.log('[LocalAdapter] createTask called with:', input);
            const tasks = getFromStorage<Task[]>(STORAGE_KEYS.tasks, []);
            console.log('[LocalAdapter] Current tasks in storage:', tasks.length);
            const now = new Date().toISOString();

            const newTask: Task = {
                id: generateId(),
                title: input.title,
                description: input.description || '',
                status: input.status || 'todo',
                priority: input.priority || 'medium',
                tags: input.tags || [],
                dueDate: input.dueDate,
                projectId: input.projectId,
                storyPoints: input.storyPoints,
                isVIP: input.isVIP,
                acceptanceCriteria: input.acceptanceCriteria,
                affectedServices: input.affectedServices,
                createdAt: now,
                updatedAt: now,
                order: tasks.filter(t => t.status === (input.status || 'todo')).length,
            };

            console.log('[LocalAdapter] Created task:', newTask);
            tasks.push(newTask);
            console.log('[LocalAdapter] Tasks after push:', tasks.length);
            saveToStorage(STORAGE_KEYS.tasks, tasks);
            console.log('[LocalAdapter] Saved to storage, calling notifyTaskChange');
            notifyTaskChange();

            return newTask;
        },

        async updateTask(id, data): Promise<Task | null> {
            const tasks = getFromStorage<Task[]>(STORAGE_KEYS.tasks, []);
            const index = tasks.findIndex(t => t.id === id);

            if (index === -1) return null;

            tasks[index] = {
                ...tasks[index],
                ...data,
                updatedAt: new Date().toISOString(),
            };

            saveToStorage(STORAGE_KEYS.tasks, tasks);
            notifyTaskChange();

            return tasks[index];
        },

        async deleteTask(id): Promise<boolean> {
            const tasks = getFromStorage<Task[]>(STORAGE_KEYS.tasks, []);
            const filtered = tasks.filter(t => t.id !== id);

            if (filtered.length === tasks.length) return false;

            saveToStorage(STORAGE_KEYS.tasks, filtered);
            notifyTaskChange();

            return true;
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
            const tasks = getFromStorage<Task[]>(STORAGE_KEYS.tasks, []);
            let updated = false;

            tasks.forEach(task => {
                if (ids.includes(task.id)) {
                    task.status = 'archived';
                    task.updatedAt = new Date().toISOString();
                    updated = true;
                }
            });

            if (updated) {
                saveToStorage(STORAGE_KEYS.tasks, tasks);
                notifyTaskChange();
            }

            return updated;
        },

        // ==================
        // Notification Operations
        // ==================
        async getNotifications(): Promise<Notification[]> {
            return getFromStorage<Notification[]>(STORAGE_KEYS.notifications, []);
        },

        async getUnreadNotifications(): Promise<Notification[]> {
            const notifications = getFromStorage<Notification[]>(STORAGE_KEYS.notifications, []);
            return notifications.filter(n => !n.isRead);
        },

        async markNotificationRead(id): Promise<boolean> {
            const notifications = getFromStorage<Notification[]>(STORAGE_KEYS.notifications, []);
            const notification = notifications.find(n => n.id === id);

            if (!notification) return false;

            notification.isRead = true;
            saveToStorage(STORAGE_KEYS.notifications, notifications);
            notifyNotificationChange();

            return true;
        },

        async markAllNotificationsRead(): Promise<boolean> {
            const notifications = getFromStorage<Notification[]>(STORAGE_KEYS.notifications, []);
            notifications.forEach(n => (n.isRead = true));
            saveToStorage(STORAGE_KEYS.notifications, notifications);
            notifyNotificationChange();

            return true;
        },

        async archiveNotification(id): Promise<boolean> {
            const notifications = getFromStorage<Notification[]>(STORAGE_KEYS.notifications, []);
            const filtered = notifications.filter(n => n.id !== id);

            if (filtered.length === notifications.length) return false;

            saveToStorage(STORAGE_KEYS.notifications, filtered);
            notifyNotificationChange();

            return true;
        },

        async clearAllNotifications(): Promise<boolean> {
            saveToStorage(STORAGE_KEYS.notifications, []);
            notifyNotificationChange();
            return true;
        },

        // ==================
        // Project Operations
        // ==================
        async getProjects(): Promise<Project[]> {
            return getFromStorage<Project[]>(STORAGE_KEYS.projects, []);
        },

        async getProjectById(id): Promise<Project | null> {
            const projects = getFromStorage<Project[]>(STORAGE_KEYS.projects, []);
            return projects.find(p => p.id === id) || null;
        },

        async createProject(input): Promise<Project> {
            const projects = getFromStorage<Project[]>(STORAGE_KEYS.projects, []);
            const now = new Date().toISOString();

            const newProject: Project = {
                id: generateId(),
                ...input,
                createdAt: now,
                updatedAt: now,
            };

            projects.push(newProject);
            saveToStorage(STORAGE_KEYS.projects, projects);

            return newProject;
        },

        async updateProject(id, data): Promise<Project | null> {
            const projects = getFromStorage<Project[]>(STORAGE_KEYS.projects, []);
            const index = projects.findIndex(p => p.id === id);

            if (index === -1) return null;

            projects[index] = {
                ...projects[index],
                ...data,
                updatedAt: new Date().toISOString(),
            };

            saveToStorage(STORAGE_KEYS.projects, projects);
            return projects[index];
        },

        async deleteProject(id): Promise<boolean> {
            const projects = getFromStorage<Project[]>(STORAGE_KEYS.projects, []);
            const filtered = projects.filter(p => p.id !== id);

            if (filtered.length === projects.length) return false;

            saveToStorage(STORAGE_KEYS.projects, filtered);
            return true;
        },

        // ==================
        // Asset Operations
        // ==================
        async getAssets(projectId?): Promise<Asset[]> {
            const assets = getFromStorage<Asset[]>(STORAGE_KEYS.assets, []);
            return projectId ? assets.filter(a => a.projectId === projectId) : assets;
        },

        async uploadAsset(file, projectId): Promise<Asset> {
            const assets = getFromStorage<Asset[]>(STORAGE_KEYS.assets, []);

            // Create a local URL for the file (blob URL)
            const url = URL.createObjectURL(file);

            const newAsset: Asset = {
                id: generateId(),
                name: file.name,
                type: file.type.startsWith('image/') ? 'image' :
                    file.type.startsWith('video/') ? 'video' :
                        file.type.startsWith('audio/') ? 'audio' :
                            file.type.includes('document') || file.type.includes('pdf') ? 'document' : 'other',
                url,
                size: file.size,
                mimeType: file.type,
                uploadedAt: new Date().toISOString(),
                uploadedBy: 'local-user-1',
                projectId,
                tags: [],
            };

            assets.push(newAsset);
            saveToStorage(STORAGE_KEYS.assets, assets);

            return newAsset;
        },

        async deleteAsset(id): Promise<boolean> {
            const assets = getFromStorage<Asset[]>(STORAGE_KEYS.assets, []);
            const filtered = assets.filter(a => a.id !== id);

            if (filtered.length === assets.length) return false;

            saveToStorage(STORAGE_KEYS.assets, filtered);
            return true;
        },

        // ==================
        // Integration Operations
        // ==================
        async getIntegrations(): Promise<Integration[]> {
            return getFromStorage<Integration[]>(STORAGE_KEYS.integrations, [
                { id: 'i1', type: 'github', name: 'GitHub', isConnected: false },
                { id: 'i2', type: 'figma', name: 'Figma', isConnected: false },
                { id: 'i3', type: 'slack', name: 'Slack', isConnected: false },
                { id: 'i4', type: 'notion', name: 'Notion', isConnected: false },
            ]);
        },

        async connectIntegration(type, config): Promise<Integration> {
            const integrations = await this.getIntegrations();
            const existing = integrations.find(i => i.type === type);

            if (existing) {
                existing.isConnected = true;
                existing.config = config;
                existing.lastSyncAt = new Date().toISOString();
                saveToStorage(STORAGE_KEYS.integrations, integrations);
                return existing;
            }

            const newIntegration: Integration = {
                id: generateId(),
                type,
                name: type.charAt(0).toUpperCase() + type.slice(1),
                isConnected: true,
                config,
                lastSyncAt: new Date().toISOString(),
            };

            integrations.push(newIntegration);
            saveToStorage(STORAGE_KEYS.integrations, integrations);

            return newIntegration;
        },

        async disconnectIntegration(id): Promise<boolean> {
            const integrations = await this.getIntegrations();
            const integration = integrations.find(i => i.id === id);

            if (!integration) return false;

            integration.isConnected = false;
            integration.config = undefined;
            saveToStorage(STORAGE_KEYS.integrations, integrations);

            return true;
        },

        async syncIntegration(id): Promise<boolean> {
            const integrations = await this.getIntegrations();
            const integration = integrations.find(i => i.id === id);

            if (!integration || !integration.isConnected) return false;

            integration.lastSyncAt = new Date().toISOString();
            saveToStorage(STORAGE_KEYS.integrations, integrations);

            return true;
        },

        // ==================
        // Email Account Operations (stub implementation for local mode)
        // ==================
        async getEmailAccounts() {
            // Local mode doesn't support email accounts - return empty array
            return [];
        },

        async getEmailAccountById(_id: string) {
            return null;
        },

        async createEmailAccount(_input: unknown) {
            throw new Error('Email accounts not supported in local storage mode');
        },

        async updateEmailAccount(_id: string, _data: unknown) {
            return null;
        },

        async deleteEmailAccount(_id: string) {
            return false;
        },

        async syncEmailAccount(_id: string) {
            return false;
        },

        async testEmailAccountConnection(_id: string) {
            return { success: false, error: 'Email not supported in local mode' };
        },

        // ==================
        // Email Operations (stub implementation for local mode)
        // ==================
        async getEmails(_accountId?: string, _folder?: unknown, _limit?: number, _offset?: number) {
            // Local mode doesn't support emails - return empty array
            return [];
        },

        async getEmailById(_id: string) {
            return null;
        },

        async searchEmails(_query: string, _folder?: unknown, _limit?: number) {
            return [];
        },

        async createEmail(_input: unknown) {
            throw new Error('Email not supported in local storage mode');
        },

        async updateEmail(_id: string, _data: unknown) {
            return null;
        },

        async deleteEmail(_id: string) {
            return false;
        },

        async markEmailRead(_id: string, _isRead: boolean) {
            return null;
        },

        async markEmailStarred(_id: string, _isStarred: boolean) {
            return null;
        },

        async archiveEmail(_id: string, _isArchived: boolean) {
            return null;
        },

        async moveEmailToFolder(_id: string, _folder: unknown) {
            return null;
        },

        async getUnreadEmailCount() {
            return 0;
        },

        // ==================
        // Email Label Operations (stub implementation for local mode)
        // ==================
        async getEmailLabels() {
            return [];
        },

        async createEmailLabel(_name: string, _color?: string) {
            throw new Error('Email labels not supported in local storage mode');
        },

        async updateEmailLabel(_id: string, _data: unknown) {
            return null;
        },

        async deleteEmailLabel(_id: string) {
            return false;
        },

        async addLabelToEmail(_emailId: string, _labelId: string) {
            return false;
        },

        async removeLabelFromEmail(_emailId: string, _labelId: string) {
            return false;
        },

        // ==================
        // Lifecycle
        // ==================
        async initialize(): Promise<void> {
            // Check if this is first run and seed initial data
            const user = getFromStorage<User | null>(STORAGE_KEYS.user, null);
            const users = getFromStorage<User[]>(STORAGE_KEYS.users, []);
            const teams = getFromStorage<Team[]>(STORAGE_KEYS.teams, []);

            if (!user) {
                // First run - seed with initial data
                saveToStorage(STORAGE_KEYS.user, INITIAL_USER);
                saveToStorage(STORAGE_KEYS.tasks, INITIAL_TASKS);
                saveToStorage(STORAGE_KEYS.notifications, INITIAL_NOTIFICATIONS);
                saveToStorage(STORAGE_KEYS.projects, INITIAL_PROJECTS);
                saveToStorage(STORAGE_KEYS.assets, []);
                console.log('[LocalAdapter] Initialized with seed data');
            } else {
                console.log('[LocalAdapter] Loaded existing data');
            }

            // Always seed users and teams if they don't exist
            if (users.length === 0) {
                saveToStorage(STORAGE_KEYS.users, INITIAL_USERS);
                console.log('[LocalAdapter] Seeded initial users');
            }
            if (teams.length === 0) {
                saveToStorage(STORAGE_KEYS.teams, INITIAL_TEAMS);
                console.log('[LocalAdapter] Seeded initial teams');
            }
        },

        async disconnect(): Promise<void> {
            taskSubscribers = [];
            notificationSubscribers = [];
            console.log('[LocalAdapter] Disconnected');
        },

        // ==================
        // Real-time subscriptions
        // ==================
        subscribeToTasks(callback) {
            taskSubscribers.push(callback);
            return () => {
                taskSubscribers = taskSubscribers.filter(cb => cb !== callback);
            };
        },

        subscribeToNotifications(callback) {
            notificationSubscribers.push(callback);
            return () => {
                notificationSubscribers = notificationSubscribers.filter(cb => cb !== callback);
            };
        },

        // ==================
        // Comment Operations
        // ==================
        async getComments(taskId: string): Promise<Comment[]> {
            const comments = getFromStorage<Comment[]>(STORAGE_KEYS.comments, []);
            return comments.filter(c => c.taskId === taskId).sort((a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
        },

        async createComment(input): Promise<Comment> {
            const comments = getFromStorage<Comment[]>(STORAGE_KEYS.comments, []);
            const now = new Date().toISOString();
            const comment: Comment = {
                id: generateId(),
                taskId: input.taskId,
                userId: input.userId,
                userName: input.userName,
                userAvatar: input.userAvatar,
                content: input.content,
                isInternal: input.isInternal || false,
                createdAt: now,
            };
            comments.push(comment);
            saveToStorage(STORAGE_KEYS.comments, comments);
            return comment;
        },

        async updateComment(id: string, content: string): Promise<Comment | null> {
            const comments = getFromStorage<Comment[]>(STORAGE_KEYS.comments, []);
            const index = comments.findIndex(c => c.id === id);
            if (index === -1) return null;

            comments[index] = {
                ...comments[index],
                content,
                updatedAt: new Date().toISOString(),
            };
            saveToStorage(STORAGE_KEYS.comments, comments);
            return comments[index];
        },

        async deleteComment(id: string): Promise<boolean> {
            const comments = getFromStorage<Comment[]>(STORAGE_KEYS.comments, []);
            const filtered = comments.filter(c => c.id !== id);
            if (filtered.length === comments.length) return false;

            saveToStorage(STORAGE_KEYS.comments, filtered);
            return true;
        },

        // ==================
        // Activity Operations
        // ==================
        async getActivity(taskId: string): Promise<Activity[]> {
            const activities = getFromStorage<Activity[]>(STORAGE_KEYS.activities, []);
            return activities.filter(a => a.taskId === taskId).sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        },

        async logActivity(activity): Promise<Activity> {
            const activities = getFromStorage<Activity[]>(STORAGE_KEYS.activities, []);
            const now = new Date().toISOString();
            const newActivity: Activity = {
                ...activity,
                id: generateId(),
                createdAt: now,
            };
            activities.push(newActivity);
            saveToStorage(STORAGE_KEYS.activities, activities);
            return newActivity;
        },

        // ==================
        // Task Relationship Operations
        // ==================
        async getTaskRelationships(taskId?: string): Promise<TaskRelationship[]> {
            const relationships = getFromStorage<TaskRelationship[]>(STORAGE_KEYS.taskRelationships, []);
            if (taskId) {
                return relationships.filter(r =>
                    r.sourceTaskId === taskId || r.targetTaskId === taskId
                );
            }
            return relationships;
        },

        async createTaskRelationship(input): Promise<TaskRelationship> {
            const relationships = getFromStorage<TaskRelationship[]>(STORAGE_KEYS.taskRelationships, []);
            const now = new Date().toISOString();
            const relationship: TaskRelationship = {
                ...input,
                id: generateId(),
                createdAt: now,
            };
            relationships.push(relationship);
            saveToStorage(STORAGE_KEYS.taskRelationships, relationships);
            return relationship;
        },

        async deleteTaskRelationship(id: string): Promise<boolean> {
            const relationships = getFromStorage<TaskRelationship[]>(STORAGE_KEYS.taskRelationships, []);
            const filtered = relationships.filter(r => r.id !== id);
            if (filtered.length === relationships.length) return false;

            saveToStorage(STORAGE_KEYS.taskRelationships, filtered);
            return true;
        },

        // ==================
        // SLA Configuration Operations
        // ==================
        async getSLAConfigs(): Promise<SLAConfig[]> {
            return getFromStorage<SLAConfig[]>(STORAGE_KEYS.slaConfigs, []);
        },

        async getSLAConfigById(id: string): Promise<SLAConfig | null> {
            const configs = getFromStorage<SLAConfig[]>(STORAGE_KEYS.slaConfigs, []);
            return configs.find(c => c.id === id) || null;
        },

        async createSLAConfig(config): Promise<SLAConfig> {
            const configs = getFromStorage<SLAConfig[]>(STORAGE_KEYS.slaConfigs, []);
            const now = new Date().toISOString();
            const newConfig: SLAConfig = {
                ...config,
                id: generateId(),
                createdAt: now,
                updatedAt: now,
            };
            configs.push(newConfig);
            saveToStorage(STORAGE_KEYS.slaConfigs, configs);
            return newConfig;
        },

        async updateSLAConfig(id: string, data): Promise<SLAConfig | null> {
            const configs = getFromStorage<SLAConfig[]>(STORAGE_KEYS.slaConfigs, []);
            const index = configs.findIndex(c => c.id === id);
            if (index === -1) return null;

            configs[index] = {
                ...configs[index],
                ...data,
                updatedAt: new Date().toISOString(),
            };
            saveToStorage(STORAGE_KEYS.slaConfigs, configs);
            return configs[index];
        },

        async deleteSLAConfig(id: string): Promise<boolean> {
            const configs = getFromStorage<SLAConfig[]>(STORAGE_KEYS.slaConfigs, []);
            const filtered = configs.filter(c => c.id !== id);
            if (filtered.length === configs.length) return false;

            saveToStorage(STORAGE_KEYS.slaConfigs, filtered);
            return true;
        },

        // ==================
        // Time Entry Operations
        // ==================
        async getTimeEntries(taskId?: string): Promise<TimeEntry[]> {
            const entries = getFromStorage<TimeEntry[]>(STORAGE_KEYS.timeEntries, []);
            if (taskId) {
                return entries.filter(e => e.taskId === taskId).sort((a, b) =>
                    new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
                );
            }
            return entries.sort((a, b) =>
                new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
            );
        },

        async getTimeEntryById(id: string): Promise<TimeEntry | null> {
            const entries = getFromStorage<TimeEntry[]>(STORAGE_KEYS.timeEntries, []);
            return entries.find(e => e.id === id) || null;
        },

        async createTimeEntry(input): Promise<TimeEntry> {
            const entries = getFromStorage<TimeEntry[]>(STORAGE_KEYS.timeEntries, []);
            const now = new Date().toISOString();
            const entry: TimeEntry = {
                id: generateId(),
                taskId: input.taskId,
                userId: input.userId,
                userName: input.userName,
                durationMinutes: input.durationMinutes,
                description: input.description,
                loggedAt: input.loggedAt || now,
                createdAt: now,
            };
            entries.push(entry);
            saveToStorage(STORAGE_KEYS.timeEntries, entries);
            return entry;
        },

        async updateTimeEntry(id: string, data): Promise<TimeEntry | null> {
            const entries = getFromStorage<TimeEntry[]>(STORAGE_KEYS.timeEntries, []);
            const index = entries.findIndex(e => e.id === id);
            if (index === -1) return null;

            entries[index] = {
                ...entries[index],
                ...data,
            };
            saveToStorage(STORAGE_KEYS.timeEntries, entries);
            return entries[index];
        },

        async deleteTimeEntry(id: string): Promise<boolean> {
            const entries = getFromStorage<TimeEntry[]>(STORAGE_KEYS.timeEntries, []);
            const filtered = entries.filter(e => e.id !== id);
            if (filtered.length === entries.length) return false;

            saveToStorage(STORAGE_KEYS.timeEntries, filtered);
            return true;
        },

        // ==================
        // Agent Operations
        // ==================
        async getAgentConversation(sessionId: string) {
            const conversations = getFromStorage<AgentConversation[]>(STORAGE_KEYS.agentConversations, []);
            return conversations.find(c => c.sessionId === sessionId) || null;
        },

        async saveAgentConversation(conversation) {
            const conversations = getFromStorage<AgentConversation[]>(STORAGE_KEYS.agentConversations, []);
            const now = new Date().toISOString();
            const newConversation: AgentConversation = {
                ...conversation,
                id: generateId(),
                createdAt: now,
                updatedAt: now,
            };
            conversations.push(newConversation);
            saveToStorage(STORAGE_KEYS.agentConversations, conversations);
            return newConversation;
        },

        async updateAgentConversation(sessionId: string, messages) {
            const conversations = getFromStorage<AgentConversation[]>(STORAGE_KEYS.agentConversations, []);
            const index = conversations.findIndex(c => c.sessionId === sessionId);
            if (index === -1) return null;

            conversations[index] = {
                ...conversations[index],
                messages,
                updatedAt: new Date().toISOString(),
            };
            saveToStorage(STORAGE_KEYS.agentConversations, conversations);
            return conversations[index];
        },

        async logAgentAction(action) {
            const logs = getFromStorage<AgentActionLog[]>(STORAGE_KEYS.agentActionLogs, []);
            const now = new Date().toISOString();
            const newLog: AgentActionLog = {
                ...action,
                id: generateId(),
                createdAt: now,
            };
            logs.push(newLog);
            // Keep only last 1000 logs
            if (logs.length > 1000) {
                logs.shift();
            }
            saveToStorage(STORAGE_KEYS.agentActionLogs, logs);
            return newLog;
        },

        async getAgentActionLog(sessionId: string, limit = 50) {
            const logs = getFromStorage<AgentActionLog[]>(STORAGE_KEYS.agentActionLogs, []);
            return logs
                .filter(log => log.sessionId === sessionId)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, limit);
        },

        async createEntityMapping(mapping) {
            const mappings = getFromStorage<AgentEntityMapping[]>(STORAGE_KEYS.agentEntityMappings, []);
            const now = new Date().toISOString();
            const newMapping: AgentEntityMapping = {
                ...mapping,
                id: generateId(),
                createdAt: now,
            };
            mappings.push(newMapping);
            saveToStorage(STORAGE_KEYS.agentEntityMappings, mappings);
            return newMapping;
        },

        async getEntityMappings(sourceType: string, sourceId: string) {
            const mappings = getFromStorage<AgentEntityMapping[]>(STORAGE_KEYS.agentEntityMappings, []);
            return mappings.filter(m => m.sourceType === sourceType && m.sourceId === sourceId);
        },

        async getEntityMappingsByTarget(targetType: string, targetId: string) {
            const mappings = getFromStorage<AgentEntityMapping[]>(STORAGE_KEYS.agentEntityMappings, []);
            return mappings.filter(m => m.targetType === targetType && m.targetId === targetId);
        },
    };
}
