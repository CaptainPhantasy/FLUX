// =====================================
// FLUX - Local Storage Adapter
// =====================================
// Implements FluxDataProvider using localStorage/IndexedDB
// Perfect for offline use or quick demos without backend setup

// @ts-nocheck
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

const STORAGE_KEYS = {
    user: 'flux_user',
    tasks: 'flux_tasks',
    notifications: 'flux_notifications',
    projects: 'flux_projects',
    assets: 'flux_assets',
    integrations: 'flux_integrations',
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
};

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
        // Lifecycle
        // ==================
        async initialize(): Promise<void> {
            // Check if this is first run and seed initial data
            const user = getFromStorage<User | null>(STORAGE_KEYS.user, null);

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
    };
}
