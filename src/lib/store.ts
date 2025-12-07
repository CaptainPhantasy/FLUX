// =====================================
// FLUX - Global State Store (Zustand)
// =====================================
// The "Operating System" - Single source of truth for UI state
// All UI components read from this store, never manage critical data locally

// @ts-nocheck
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
    User,
    Task,
    TaskCreateInput,
    TaskUpdateInput,
    Notification,
    Project,
    Asset,
    Integration,
    Message,
    StorageMode,
    AppConfig,
} from '@/types';
import { getAdapter, initializeDb, isDbInitialized } from '@/lib/db';

// ==================
// State Slice Types
// ==================

interface UserSlice {
    user: User | null;
    isAuthenticated: boolean;
}

interface TaskSlice {
    tasks: Task[];
    selectedTaskId: string | null;
    isLoadingTasks: boolean;
}

interface NotificationSlice {
    notifications: Notification[];
    unreadCount: number;
    isLoadingNotifications: boolean;
}

interface ProjectSlice {
    projects: Project[];
    currentProjectId: string | null;
}

interface AssetSlice {
    assets: Asset[];
}

interface IntegrationSlice {
    integrations: Integration[];
}

interface TerminalSlice {
    isTerminalOpen: boolean;
    terminalHistory: Message[];
    isTerminalThinking: boolean;
}

interface UISlice {
    theme: 'light' | 'dark' | 'system';
    sidebarCollapsed: boolean;
    isOnboardingComplete: boolean;
    workflowMode: 'agile' | 'ccaas' | 'itsm';
}

interface AppSlice {
    config: AppConfig;
    isInitialized: boolean;
    isLoading: boolean;
    error: string | null;
}

// ==================
// Combined State
// ==================

interface FluxState extends
    UserSlice,
    TaskSlice,
    NotificationSlice,
    ProjectSlice,
    AssetSlice,
    IntegrationSlice,
    TerminalSlice,
    UISlice,
    AppSlice { }

// ==================
// Actions Types
// ==================

interface FluxActions {
    // Initialization
    initialize: (mode?: StorageMode) => Promise<void>;
    setStorageMode: (mode: StorageMode) => Promise<void>;

    // User Actions
    setUser: (user: User | null) => void;
    updateUserPreferences: (preferences: Partial<User['preferences']>) => Promise<void>;
    logout: () => void;

    // Task Actions
    fetchTasks: (projectId?: string) => Promise<void>;
    createTask: (input: TaskCreateInput) => Promise<Task | null>;
    updateTask: (id: string, data: TaskUpdateInput) => Promise<Task | null>;
    deleteTask: (id: string) => Promise<boolean>;
    updateTaskStatus: (id: string, status: Task['status']) => Promise<void>;
    moveTask: (taskId: string, newStatus: Task['status'], newOrder?: number) => Promise<void>;
    archiveTasks: (ids: string[]) => Promise<void>;
    selectTask: (id: string | null) => void;

    // Notification Actions
    fetchNotifications: () => Promise<void>;
    markNotificationRead: (id: string) => Promise<void>;
    markAllNotificationsRead: () => Promise<void>;
    archiveNotification: (id: string) => Promise<void>;
    clearAllNotifications: () => Promise<void>;

    // Project Actions
    fetchProjects: () => Promise<void>;
    setCurrentProject: (id: string | null) => void;
    createProject: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Project | null>;

    // Asset Actions
    fetchAssets: (projectId?: string) => Promise<void>;
    uploadAsset: (file: File, projectId?: string) => Promise<Asset | null>;
    deleteAsset: (id: string) => Promise<boolean>;

    // Integration Actions
    fetchIntegrations: () => Promise<void>;
    connectIntegration: (type: Integration['type'], config: Record<string, unknown>) => Promise<void>;
    disconnectIntegration: (id: string) => Promise<void>;

    // Terminal Actions
    openTerminal: () => void;
    closeTerminal: () => void;
    toggleTerminal: () => void;
    addTerminalMessage: (message: Message) => void;
    setTerminalThinking: (thinking: boolean) => void;
    clearTerminalHistory: () => void;

    // UI Actions
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    completeOnboarding: () => void;
    setWorkflowMode: (mode: 'agile' | 'ccaas' | 'itsm') => void;

    // Error handling
    setError: (error: string | null) => void;
    clearError: () => void;
}

// ==================
// Initial State
// ==================

const initialState: FluxState = {
    // User
    user: null,
    isAuthenticated: false,

    // Tasks
    tasks: [],
    selectedTaskId: null,
    isLoadingTasks: false,

    // Notifications
    notifications: [],
    unreadCount: 0,
    isLoadingNotifications: false,

    // Projects
    projects: [],
    currentProjectId: null,

    // Assets
    assets: [],

    // Integrations
    integrations: [],

    // Terminal
    isTerminalOpen: false,
    terminalHistory: [],
    isTerminalThinking: false,

    // UI
    theme: 'dark',
    sidebarCollapsed: false,
    isOnboardingComplete: false,
    workflowMode: 'agile',

    // App
    config: {
        storageMode: 'supabase',
        isSetupComplete: true,
        version: '1.0.0',
    },
    isInitialized: false,
    isLoading: false,
    error: null,
};

// ==================
// Store Creation
// ==================

export const useFluxStore = create<FluxState & FluxActions>()(
    devtools(
        persist(
            immer((set, get) => ({
                ...initialState,

                // ==================
                // Initialization
                // ==================
                initialize: async (mode?: StorageMode) => {
                    const storageMode = mode || get().config.storageMode;

                    try {
                        set((state) => {
                            state.isLoading = true;
                            state.error = null;
                        });

                        // Initialize database adapter
                        await initializeDb(storageMode);
                        const db = getAdapter(storageMode);

                        // Fetch initial data in parallel
                        const [user, tasks, notifications, projects, integrations] = await Promise.all([
                            db.getCurrentUser(),
                            db.getTasks(),
                            db.getNotifications(),
                            db.getProjects(),
                            db.getIntegrations(),
                        ]);

                        set((state) => {
                            state.user = user;
                            state.isAuthenticated = !!user;
                            state.tasks = tasks;
                            state.notifications = notifications;
                            state.unreadCount = notifications.filter(n => !n.isRead).length;
                            state.projects = projects;
                            state.integrations = integrations;
                            state.config.storageMode = storageMode;
                            state.config.isSetupComplete = true;
                            state.isInitialized = true;
                            state.isLoading = false;
                        });

                        // Subscribe to real-time updates
                        console.log('[Store] Setting up subscriptions...');
                        if (db.subscribeToTasks) {
                            console.log('[Store] Subscribing to tasks');
                            db.subscribeToTasks((updatedTasks) => {
                                console.log('[Store] Task subscription callback fired, tasks:', updatedTasks.length);
                                set((state) => {
                                    state.tasks = updatedTasks;
                                });
                            });
                        } else {
                            console.warn('[Store] db.subscribeToTasks not available');
                        }

                        if (db.subscribeToNotifications) {
                            console.log('[Store] Subscribing to notifications');
                            db.subscribeToNotifications((updatedNotifications) => {
                                console.log('[Store] Notification subscription callback fired');
                                set((state) => {
                                    state.notifications = updatedNotifications;
                                    state.unreadCount = updatedNotifications.filter(n => !n.isRead).length;
                                });
                            });
                        }

                        console.log(`[FluxStore] Initialized with ${storageMode} adapter`);
                    } catch (error) {
                        console.error('[FluxStore] Initialization failed:', error);
                        set((state) => {
                            state.error = error instanceof Error ? error.message : 'Failed to initialize';
                            state.isLoading = false;
                        });
                    }
                },

                setStorageMode: async (mode: StorageMode) => {
                    set((state) => {
                        state.config.storageMode = mode;
                    });
                    await get().initialize(mode);
                },

                // ==================
                // User Actions
                // ==================
                setUser: (user) => {
                    set((state) => {
                        state.user = user;
                        state.isAuthenticated = !!user;
                    });
                },

                updateUserPreferences: async (preferences) => {
                    const { user, config } = get();
                    if (!user) return;

                    const db = getAdapter(config.storageMode);
                    const updated = await db.updateUserPreferences(user.id, preferences);

                    if (updated) {
                        set((state) => {
                            state.user = updated;
                        });
                    }
                },

                logout: () => {
                    set((state) => {
                        state.user = null;
                        state.isAuthenticated = false;
                    });
                },

                // ==================
                // Task Actions
                // ==================
                fetchTasks: async (projectId) => {
                    if (!isDbInitialized()) return;

                    set((state) => { state.isLoadingTasks = true; });

                    const db = getAdapter(get().config.storageMode);
                    const tasks = await db.getTasks(projectId);

                    set((state) => {
                        state.tasks = tasks;
                        state.isLoadingTasks = false;
                    });
                },

                createTask: async (input) => {
                    const db = getAdapter(get().config.storageMode);

                    try {
                        const task = await db.createTask(input);
                        // Subscription will update state automatically
                        return task;
                    } catch (error) {
                        console.error('Failed to create task:', error);
                        return null;
                    }
                },

                updateTask: async (id, data) => {
                    const db = getAdapter(get().config.storageMode);

                    // Optimistic update
                    set((state) => {
                        const index = state.tasks.findIndex(t => t.id === id);
                        if (index !== -1) {
                            state.tasks[index] = { ...state.tasks[index], ...data, updatedAt: new Date().toISOString() };
                        }
                    });

                    const updated = await db.updateTask(id, data);

                    if (!updated) {
                        // Rollback on failure
                        await get().fetchTasks();
                    }

                    return updated;
                },

                deleteTask: async (id) => {
                    const db = getAdapter(get().config.storageMode);

                    // Optimistic update
                    const previousTasks = get().tasks;
                    set((state) => {
                        state.tasks = state.tasks.filter(t => t.id !== id);
                    });

                    const success = await db.deleteTask(id);

                    if (!success) {
                        // Rollback
                        set((state) => {
                            state.tasks = previousTasks;
                        });
                    }

                    return success;
                },

                updateTaskStatus: async (id, status) => {
                    await get().updateTask(id, { status });
                },

                moveTask: async (taskId, newStatus, newOrder) => {
                    const db = getAdapter(get().config.storageMode);

                    // Optimistic update
                    set((state) => {
                        const task = state.tasks.find(t => t.id === taskId);
                        if (task) {
                            task.status = newStatus;
                            if (newOrder !== undefined) task.order = newOrder;
                            task.updatedAt = new Date().toISOString();
                        }
                    });

                    await db.updateTaskOrder(taskId, newOrder || 0, newStatus);
                },

                archiveTasks: async (ids) => {
                    const db = getAdapter(get().config.storageMode);

                    // Optimistic update
                    set((state) => {
                        state.tasks.forEach(task => {
                            if (ids.includes(task.id)) {
                                task.status = 'archived';
                            }
                        });
                    });

                    await db.archiveTasks(ids);
                },

                selectTask: (id) => {
                    set((state) => {
                        state.selectedTaskId = id;
                    });
                },

                // ==================
                // Notification Actions
                // ==================
                fetchNotifications: async () => {
                    if (!isDbInitialized()) return;

                    set((state) => { state.isLoadingNotifications = true; });

                    const db = getAdapter(get().config.storageMode);
                    const notifications = await db.getNotifications();

                    set((state) => {
                        state.notifications = notifications;
                        state.unreadCount = notifications.filter(n => !n.isRead).length;
                        state.isLoadingNotifications = false;
                    });
                },

                markNotificationRead: async (id) => {
                    const db = getAdapter(get().config.storageMode);

                    // Optimistic update
                    set((state) => {
                        const notification = state.notifications.find(n => n.id === id);
                        if (notification && !notification.isRead) {
                            notification.isRead = true;
                            state.unreadCount = Math.max(0, state.unreadCount - 1);
                        }
                    });

                    await db.markNotificationRead(id);
                },

                markAllNotificationsRead: async () => {
                    const db = getAdapter(get().config.storageMode);

                    // Optimistic update
                    set((state) => {
                        state.notifications.forEach(n => { n.isRead = true; });
                        state.unreadCount = 0;
                    });

                    await db.markAllNotificationsRead();
                },

                archiveNotification: async (id) => {
                    const db = getAdapter(get().config.storageMode);

                    // Optimistic update
                    set((state) => {
                        const notification = state.notifications.find(n => n.id === id);
                        if (notification && !notification.isRead) {
                            state.unreadCount = Math.max(0, state.unreadCount - 1);
                        }
                        state.notifications = state.notifications.filter(n => n.id !== id);
                    });

                    await db.archiveNotification(id);
                },

                clearAllNotifications: async () => {
                    const db = getAdapter(get().config.storageMode);

                    // Optimistic update
                    set((state) => {
                        state.notifications = [];
                        state.unreadCount = 0;
                    });

                    await db.clearAllNotifications();
                },

                // ==================
                // Project Actions
                // ==================
                fetchProjects: async () => {
                    if (!isDbInitialized()) return;

                    const db = getAdapter(get().config.storageMode);
                    const projects = await db.getProjects();

                    set((state) => {
                        state.projects = projects;
                    });
                },

                setCurrentProject: (id) => {
                    set((state) => {
                        state.currentProjectId = id;
                    });
                },

                createProject: async (data) => {
                    const db = getAdapter(get().config.storageMode);

                    try {
                        const project = await db.createProject(data);

                        set((state) => {
                            state.projects.push(project);
                        });

                        return project;
                    } catch (error) {
                        console.error('Failed to create project:', error);
                        return null;
                    }
                },

                // ==================
                // Asset Actions
                // ==================
                fetchAssets: async (projectId) => {
                    if (!isDbInitialized()) return;

                    const db = getAdapter(get().config.storageMode);
                    const assets = await db.getAssets(projectId);

                    set((state) => {
                        state.assets = assets;
                    });
                },

                uploadAsset: async (file, projectId) => {
                    const db = getAdapter(get().config.storageMode);

                    try {
                        const asset = await db.uploadAsset(file, projectId);

                        set((state) => {
                            state.assets.push(asset);
                        });

                        return asset;
                    } catch (error) {
                        console.error('Failed to upload asset:', error);
                        return null;
                    }
                },

                deleteAsset: async (id) => {
                    const db = getAdapter(get().config.storageMode);

                    const success = await db.deleteAsset(id);

                    if (success) {
                        set((state) => {
                            state.assets = state.assets.filter(a => a.id !== id);
                        });
                    }

                    return success;
                },

                // ==================
                // Integration Actions
                // ==================
                fetchIntegrations: async () => {
                    if (!isDbInitialized()) return;

                    const db = getAdapter(get().config.storageMode);
                    const integrations = await db.getIntegrations();

                    set((state) => {
                        state.integrations = integrations;
                    });
                },

                connectIntegration: async (type, config) => {
                    const db = getAdapter(get().config.storageMode);

                    try {
                        const integration = await db.connectIntegration(type, config);

                        set((state) => {
                            const index = state.integrations.findIndex(i => i.type === type);
                            if (index !== -1) {
                                state.integrations[index] = integration;
                            } else {
                                state.integrations.push(integration);
                            }
                        });
                    } catch (error) {
                        console.error('Failed to connect integration:', error);
                    }
                },

                disconnectIntegration: async (id) => {
                    const db = getAdapter(get().config.storageMode);

                    await db.disconnectIntegration(id);

                    set((state) => {
                        const integration = state.integrations.find(i => i.id === id);
                        if (integration) {
                            integration.isConnected = false;
                        }
                    });
                },

                // ==================
                // Terminal Actions
                // ==================
                openTerminal: () => {
                    set((state) => {
                        state.isTerminalOpen = true;
                    });
                },

                closeTerminal: () => {
                    set((state) => {
                        state.isTerminalOpen = false;
                    });
                },

                toggleTerminal: () => {
                    set((state) => {
                        state.isTerminalOpen = !state.isTerminalOpen;
                    });
                },

                addTerminalMessage: (message) => {
                    set((state) => {
                        state.terminalHistory.push(message);
                    });
                },

                setTerminalThinking: (thinking) => {
                    set((state) => {
                        state.isTerminalThinking = thinking;
                    });
                },

                clearTerminalHistory: () => {
                    set((state) => {
                        state.terminalHistory = [];
                    });
                },

                // ==================
                // UI Actions
                // ==================
                setTheme: (theme) => {
                    console.log('[Store] setTheme called with:', theme);
                    set((state) => {
                        state.theme = theme;
                    });

                    // Apply theme to document
                    console.log('[Store] Current classList:', document.documentElement.classList.toString());
                    if (theme === 'dark') {
                        console.log('[Store] Adding dark class');
                        document.documentElement.classList.add('dark');
                    } else if (theme === 'light') {
                        console.log('[Store] Removing dark class');
                        document.documentElement.classList.remove('dark');
                    } else {
                        // System preference
                        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                        console.log('[Store] System preference dark:', prefersDark);
                        if (prefersDark) {
                            document.documentElement.classList.add('dark');
                        } else {
                            document.documentElement.classList.remove('dark');
                        }
                    }
                    console.log('[Store] After update classList:', document.documentElement.classList.toString());
                },

                toggleSidebar: () => {
                    set((state) => {
                        state.sidebarCollapsed = !state.sidebarCollapsed;
                    });
                },

                setSidebarCollapsed: (collapsed) => {
                    set((state) => {
                        state.sidebarCollapsed = collapsed;
                    });
                },

                completeOnboarding: () => {
                    set((state) => {
                        state.isOnboardingComplete = true;
                        state.config.isSetupComplete = true;
                    });
                },

                setWorkflowMode: (mode) => {
                    console.log('[Store] setWorkflowMode called with:', mode);
                    set((state) => {
                        state.workflowMode = mode;
                    });
                },

                // ==================
                // Error Handling
                // ==================
                setError: (error) => {
                    set((state) => {
                        state.error = error;
                    });
                },

                clearError: () => {
                    set((state) => {
                        state.error = null;
                    });
                },
            })),
            {
                name: 'flux-store',
                version: 2,
                partialize: (state) => ({
                    // Only persist UI preferences and config
                    theme: state.theme,
                    sidebarCollapsed: state.sidebarCollapsed,
                    isOnboardingComplete: state.isOnboardingComplete,
                    workflowMode: state.workflowMode,
                    config: state.config,
                }),
            }
        ),
        { name: 'FluxStore' }
    )
);

// ==================
// Selectors (Memoized)
// ==================

export const selectTasks = (state: FluxState & FluxActions) => state.tasks;
export const selectTasksByStatus = (status: Task['status']) => (state: FluxState & FluxActions) =>
    state.tasks.filter(t => t.status === status);
export const selectNotifications = (state: FluxState & FluxActions) => state.notifications;
export const selectUnreadNotifications = (state: FluxState & FluxActions) =>
    state.notifications.filter(n => !n.isRead);
export const selectUnreadCount = (state: FluxState & FluxActions) => state.unreadCount;
export const selectProjects = (state: FluxState & FluxActions) => state.projects;
export const selectCurrentProject = (state: FluxState & FluxActions) =>
    state.projects.find(p => p.id === state.currentProjectId);
export const selectIsTerminalOpen = (state: FluxState & FluxActions) => state.isTerminalOpen;
export const selectTerminalHistory = (state: FluxState & FluxActions) => state.terminalHistory;
export const selectTheme = (state: FluxState & FluxActions) => state.theme;

// ==================
// Hook Shortcuts
// ==================

export function useTasks() {
    return useFluxStore((state) => ({
        tasks: state.tasks,
        isLoading: state.isLoadingTasks,
        createTask: state.createTask,
        updateTask: state.updateTask,
        deleteTask: state.deleteTask,
        moveTask: state.moveTask,
    }));
}

export function useNotifications() {
    return useFluxStore((state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
        markRead: state.markNotificationRead,
        markAllRead: state.markAllNotificationsRead,
        archive: state.archiveNotification,
        clearAll: state.clearAllNotifications,
    }));
}

export function useTerminal() {
    return useFluxStore((state) => ({
        isOpen: state.isTerminalOpen,
        history: state.terminalHistory,
        isThinking: state.isTerminalThinking,
        open: state.openTerminal,
        close: state.closeTerminal,
        toggle: state.toggleTerminal,
        addMessage: state.addTerminalMessage,
        setThinking: state.setTerminalThinking,
        clearHistory: state.clearTerminalHistory,
    }));
}

export function useUI() {
    return useFluxStore((state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        workflowMode: state.workflowMode,
        setTheme: state.setTheme,
        toggleSidebar: state.toggleSidebar,
        setSidebarCollapsed: state.setSidebarCollapsed,
        setWorkflowMode: state.setWorkflowMode,
    }));
}
