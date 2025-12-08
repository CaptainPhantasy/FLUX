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
    Message,
    StorageMode,
    AppConfig,
    Email,
    EmailAccount,
    EmailCreateInput,
    EmailUpdateInput,
    EmailAccountCreateInput,
    EmailLabel,
    EmailFolder,
    Comment,
    Activity,
    CommentCreateInput,
    SLAConfig,
    TimeEntry,
    TimeEntryCreateInput,
    ActiveTimer,
} from '@/types';
import { applyAutoTriage, recordCorrection, type TriageResult } from '@/features/nanocoder/autotriage';
import { getAdapter, initializeDb, isDbInitialized } from '@/lib/db';

// ==================
// State Slice Types
// ==================

interface UserSlice {
    user: User | null;
    isAuthenticated: boolean;
    // Team management
    users: User[];
    teams: Team[];
}

interface TaskSlice {
    tasks: Task[];
    selectedTaskId: string | null;
    isLoadingTasks: boolean;
    taskRelationships: TaskRelationship[];
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

interface EmailSlice {
    emails: Email[];
    emailAccounts: EmailAccount[];
    emailLabels: EmailLabel[];
    selectedEmailId: string | null;
    selectedAccountId: string | null;
    currentFolder: EmailFolder;
    searchQuery: string;
    isLoadingEmails: boolean;
    unreadEmailCount: number;
}

interface CommentSlice {
    comments: Comment[];
    activities: Activity[];
}

interface SLASlice {
    slaConfigs: SLAConfig[];
    timeEntries: TimeEntry[];
    activeTimer: ActiveTimer | null;
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
    // Agent selection tracking
    selectedIncidentId: string | null;
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
    EmailSlice,
    TerminalSlice,
    UISlice,
    AppSlice,
    CommentSlice,
    SLASlice { }

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
    
    // Team Management Actions
    fetchUsers: () => Promise<void>;
    createUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<User | null>;
    updateUser: (id: string, data: Partial<User>) => Promise<User | null>;
    deleteUser: (id: string) => Promise<boolean>;
    fetchTeams: () => Promise<void>;
    createTeam: (team: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Team | null>;
    updateTeam: (id: string, data: Partial<Team>) => Promise<Team | null>;
    deleteTeam: (id: string) => Promise<boolean>;

    // Task Actions
    fetchTasks: (projectId?: string) => Promise<void>;
    createTask: (input: TaskCreateInput) => Promise<Task | null>;
    updateTask: (id: string, data: TaskUpdateInput) => Promise<Task | null>;
    deleteTask: (id: string) => Promise<boolean>;
    updateTaskStatus: (id: string, status: Task['status']) => Promise<void>;
    moveTask: (taskId: string, newStatus: Task['status'], newOrder?: number) => Promise<void>;
    archiveTasks: (ids: string[]) => Promise<void>;
    selectTask: (id: string | null) => void;
    
    // Task Relationship Actions
    fetchTaskRelationships: (taskId?: string) => Promise<void>;
    linkTasks: (sourceTaskId: string, targetTaskId: string, relationshipType: TaskRelationshipType) => Promise<TaskRelationship | null>;
    unlinkTasks: (relationshipId: string) => Promise<boolean>;
    getBlockers: (taskId: string) => Promise<Task[]>;
    getBlockedBy: (taskId: string) => Promise<Task[]>;
    getSubtasks: (taskId: string) => Promise<Task[]>;
    createSubtask: (parentTaskId: string, input: TaskCreateInput) => Promise<Task | null>;

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

    // Email Account Actions
    fetchEmailAccounts: () => Promise<void>;
    createEmailAccount: (input: EmailAccountCreateInput) => Promise<EmailAccount | null>;
    updateEmailAccount: (id: string, data: Partial<EmailAccount>) => Promise<EmailAccount | null>;
    deleteEmailAccount: (id: string) => Promise<boolean>;
    syncEmailAccount: (id: string) => Promise<boolean>;
    testEmailAccountConnection: (id: string) => Promise<{ success: boolean; error?: string }>;
    setSelectedAccount: (id: string | null) => void;

    // Email Actions
    fetchEmails: (accountId?: string, folder?: EmailFolder) => Promise<void>;
    searchEmails: (query: string, folder?: EmailFolder) => Promise<void>;
    getEmailById: (id: string) => Promise<Email | null>;
    markEmailRead: (id: string, isRead: boolean) => Promise<void>;
    markEmailStarred: (id: string, isStarred: boolean) => Promise<void>;
    archiveEmail: (id: string, isArchived: boolean) => Promise<void>;
    deleteEmail: (id: string) => Promise<boolean>;
    moveEmailToFolder: (id: string, folder: EmailFolder) => Promise<void>;
    setSelectedEmail: (id: string | null) => void;
    setCurrentFolder: (folder: EmailFolder) => void;
    setSearchQuery: (query: string) => void;
    fetchUnreadEmailCount: () => Promise<void>;

    // Email Label Actions
    fetchEmailLabels: () => Promise<void>;
    createEmailLabel: (name: string, color?: string) => Promise<EmailLabel | null>;
    updateEmailLabel: (id: string, data: Partial<EmailLabel>) => Promise<EmailLabel | null>;
    deleteEmailLabel: (id: string) => Promise<boolean>;
    addLabelToEmail: (emailId: string, labelId: string) => Promise<void>;
    removeLabelFromEmail: (emailId: string, labelId: string) => Promise<void>;

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
    setSelectedIncidentId: (id: string | null) => void;

    // Comment Actions
    fetchComments: (taskId: string) => Promise<void>;
    addComment: (input: CommentCreateInput) => Promise<Comment | null>;
    updateComment: (id: string, content: string) => Promise<Comment | null>;
    deleteComment: (id: string) => Promise<boolean>;
    getActivity: (taskId: string) => Promise<Activity[]>;

    // SLA and Time Tracking Actions
    fetchSLAConfigs: () => Promise<void>;
    createSLAConfig: (config: Omit<SLAConfig, 'id' | 'createdAt' | 'updatedAt'>) => Promise<SLAConfig | null>;
    updateSLAConfig: (id: string, data: Partial<SLAConfig>) => Promise<SLAConfig | null>;
    deleteSLAConfig: (id: string) => Promise<boolean>;
    
    fetchTimeEntries: (taskId?: string) => Promise<void>;
    logTime: (input: TimeEntryCreateInput) => Promise<TimeEntry | null>;
    updateTimeEntry: (id: string, data: Partial<TimeEntry>) => Promise<TimeEntry | null>;
    deleteTimeEntry: (id: string) => Promise<boolean>;
    startTimer: (taskId: string) => Promise<void>;
    stopTimer: () => Promise<TimeEntry | null>;
    getActiveTimer: () => ActiveTimer | null;

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
    users: [],
    teams: [],

    // Tasks
    tasks: [],
    selectedTaskId: null,
    isLoadingTasks: false,
    taskRelationships: [],

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

    // Emails
    emails: [],
    emailAccounts: [],
    emailLabels: [],
    selectedEmailId: null,
    selectedAccountId: null,
    currentFolder: 'inbox',
    searchQuery: '',
    isLoadingEmails: false,
    unreadEmailCount: 0,

    // Terminal
    isTerminalOpen: false,
    terminalHistory: [],
    isTerminalThinking: false,

    // UI
    theme: 'light',
    sidebarCollapsed: false,
    isOnboardingComplete: false,
    workflowMode: 'agile',
    selectedIncidentId: null,

    // App
    config: {
        storageMode: 'supabase',
        isSetupComplete: true,
        version: '1.0.0',
    },
    isInitialized: false,
    isLoading: false,
    error: null,

    // Comments
    comments: [],
    activities: [],

    // SLA and Time Tracking
    slaConfigs: [],
    timeEntries: [],
    activeTimer: null,
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
                        const [user, tasks, notifications, projects, integrations, emailAccounts, unreadEmailCount, users, teams] = await Promise.all([
                            db.getCurrentUser(),
                            db.getTasks(),
                            db.getNotifications(),
                            db.getProjects(),
                            db.getIntegrations(),
                            db.getEmailAccounts().catch(() => []),
                            db.getUnreadEmailCount().catch(() => 0),
                            db.getUsers().catch(() => []),
                            db.getTeams().catch(() => []),
                        ]);

                        set((state) => {
                            state.user = user;
                            state.isAuthenticated = !!user;
                            state.tasks = tasks;
                            state.notifications = notifications;
                            state.unreadCount = notifications.filter(n => !n.isRead).length;
                            state.projects = projects;
                            state.integrations = integrations;
                            state.emailAccounts = emailAccounts;
                            state.unreadEmailCount = unreadEmailCount;
                            state.users = users;
                            state.teams = teams;
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
                // Team Management Actions
                // ==================
                fetchUsers: async () => {
                    if (!isDbInitialized()) return;
                    
                    const db = getAdapter(get().config.storageMode);
                    if (db.getUsers) {
                        const users = await db.getUsers();
                        set((state) => {
                            state.users = users;
                        });
                    }
                },

                createUser: async (userData) => {
                    if (!isDbInitialized()) return null;
                    
                    const db = getAdapter(get().config.storageMode);
                    if (db.createUser) {
                        const user = await db.createUser(userData);
                        if (user) {
                            set((state) => {
                                state.users.push(user);
                            });
                        }
                        return user;
                    }
                    return null;
                },

                updateUser: async (id, data) => {
                    if (!isDbInitialized()) return null;
                    
                    const db = getAdapter(get().config.storageMode);
                    if (db.updateUser) {
                        const updated = await db.updateUser(id, data);
                        if (updated) {
                            set((state) => {
                                const index = state.users.findIndex(u => u.id === id);
                                if (index !== -1) {
                                    state.users[index] = updated;
                                }
                                // Update current user if it's the same
                                if (state.user?.id === id) {
                                    state.user = updated;
                                }
                            });
                        }
                        return updated;
                    }
                    return null;
                },

                deleteUser: async (id) => {
                    if (!isDbInitialized()) return false;
                    
                    const db = getAdapter(get().config.storageMode);
                    if (db.deleteUser) {
                        const success = await db.deleteUser(id);
                        if (success) {
                            set((state) => {
                                state.users = state.users.filter(u => u.id !== id);
                                // Logout if deleting current user
                                if (state.user?.id === id) {
                                    state.user = null;
                                    state.isAuthenticated = false;
                                }
                            });
                        }
                        return success;
                    }
                    return false;
                },

                fetchTeams: async () => {
                    if (!isDbInitialized()) return;
                    
                    const db = getAdapter(get().config.storageMode);
                    if (db.getTeams) {
                        const teams = await db.getTeams();
                        set((state) => {
                            state.teams = teams;
                        });
                    }
                },

                createTeam: async (teamData) => {
                    if (!isDbInitialized()) return null;
                    
                    const db = getAdapter(get().config.storageMode);
                    if (db.createTeam) {
                        const team = await db.createTeam(teamData);
                        if (team) {
                            set((state) => {
                                state.teams.push(team);
                            });
                        }
                        return team;
                    }
                    return null;
                },

                updateTeam: async (id, data) => {
                    if (!isDbInitialized()) return null;
                    
                    const db = getAdapter(get().config.storageMode);
                    if (db.updateTeam) {
                        const updated = await db.updateTeam(id, data);
                        if (updated) {
                            set((state) => {
                                const index = state.teams.findIndex(t => t.id === id);
                                if (index !== -1) {
                                    state.teams[index] = updated;
                                }
                            });
                        }
                        return updated;
                    }
                    return null;
                },

                deleteTeam: async (id) => {
                    if (!isDbInitialized()) return false;
                    
                    const db = getAdapter(get().config.storageMode);
                    if (db.deleteTeam) {
                        const success = await db.deleteTeam(id);
                        if (success) {
                            set((state) => {
                                state.teams = state.teams.filter(t => t.id !== id);
                            });
                        }
                        return success;
                    }
                    return false;
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
                    if (!isDbInitialized()) {
                        console.error('[FluxStore] Cannot create task: Database not initialized');
                        return null;
                    }

                    // Defensive check: Verify authentication for Supabase storage mode
                    // Note: Routes should be protected, but this handles session expiration during use
                    const { config, isAuthenticated, workflowMode } = get();
                    if (config.storageMode === 'supabase' && !isAuthenticated) {
                        console.error('[FluxStore] Cannot create task: User not authenticated (required for Supabase). Session may have expired.');
                        return null;
                    }

                    // Apply auto-triage if enabled
                    const triagedInput = applyAutoTriage(
                        input,
                        (workflowMode as 'agile' | 'ccaas' | 'itsm') || 'agile'
                    );

                    const db = getAdapter(config.storageMode);

                    try {
                        const task = await db.createTask(triagedInput);
                        // Subscription will update state automatically
                        return task;
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                        console.error('[FluxStore] Failed to create task:', errorMessage);
                        
                        // Check for authentication errors
                        if (errorMessage.includes('JWT') || errorMessage.includes('auth') || errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
                            console.error('[FluxStore] Authentication error detected - user may need to log in');
                        }
                        
                        return null;
                    }
                },

                updateTask: async (id, data) => {
                    if (!isDbInitialized()) {
                        console.error('[FluxStore] Cannot update task: Database not initialized');
                        return null;
                    }

                    // Defensive check: Verify authentication for Supabase storage mode
                    // Handles session expiration during use
                    const { config, isAuthenticated } = get();
                    if (config.storageMode === 'supabase' && !isAuthenticated) {
                        console.error('[FluxStore] Cannot update task: User not authenticated (required for Supabase). Session may have expired.');
                        return null;
                    }

                    const db = getAdapter(config.storageMode);

                    // Optimistic update
                    set((state) => {
                        const index = state.tasks.findIndex(t => t.id === id);
                        if (index !== -1) {
                            state.tasks[index] = { ...state.tasks[index], ...data, updatedAt: new Date().toISOString() };
                        }
                    });

                    try {
                    const updated = await db.updateTask(id, data);

                    if (!updated) {
                        // Rollback on failure
                        await get().fetchTasks();
                    }

                    return updated;
                    } catch (error) {
                        console.error('[FluxStore] Failed to update task:', error);
                        // Rollback on failure
                        await get().fetchTasks();
                        return null;
                    }
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
                    if (!isDbInitialized()) {
                        console.error('[FluxStore] Cannot move task: Database not initialized');
                        return;
                    }

                    // Defensive check: Verify authentication for Supabase storage mode
                    // Handles session expiration during use
                    const { config, isAuthenticated } = get();
                    if (config.storageMode === 'supabase' && !isAuthenticated) {
                        console.error('[FluxStore] Cannot move task: User not authenticated (required for Supabase). Session may have expired.');
                        return;
                    }

                    const db = getAdapter(config.storageMode);

                    // Optimistic update
                    set((state) => {
                        const task = state.tasks.find(t => t.id === taskId);
                        if (task) {
                            task.status = newStatus;
                            if (newOrder !== undefined) task.order = newOrder;
                            task.updatedAt = new Date().toISOString();
                        }
                    });

                    try {
                    await db.updateTaskOrder(taskId, newOrder || 0, newStatus);
                    } catch (error) {
                        console.error('[FluxStore] Failed to move task:', error);
                        // Rollback on failure
                        await get().fetchTasks();
                    }
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
                // Email Account Actions
                // ==================
                fetchEmailAccounts: async () => {
                    if (!isDbInitialized()) return;

                    const db = getAdapter(get().config.storageMode);
                    const accounts = await db.getEmailAccounts();

                    set((state) => {
                        state.emailAccounts = accounts;
                    });
                },

                createEmailAccount: async (input) => {
                    const db = getAdapter(get().config.storageMode);

                    try {
                        const account = await db.createEmailAccount(input);

                        set((state) => {
                            state.emailAccounts.push(account);
                        });

                        return account;
                    } catch (error) {
                        console.error('Failed to create email account:', error);
                        return null;
                    }
                },

                updateEmailAccount: async (id, data) => {
                    const db = getAdapter(get().config.storageMode);

                    const updated = await db.updateEmailAccount(id, data);

                    if (updated) {
                        set((state) => {
                            const index = state.emailAccounts.findIndex(a => a.id === id);
                            if (index !== -1) {
                                state.emailAccounts[index] = updated;
                            }
                        });
                    }

                    return updated;
                },

                deleteEmailAccount: async (id) => {
                    const db = getAdapter(get().config.storageMode);

                    const success = await db.deleteEmailAccount(id);

                    if (success) {
                        set((state) => {
                            state.emailAccounts = state.emailAccounts.filter(a => a.id !== id);
                        });
                    }

                    return success;
                },

                syncEmailAccount: async (id) => {
                    const db = getAdapter(get().config.storageMode);
                    await db.syncEmailAccount(id);
                    // Refresh emails after sync
                    await get().fetchEmails(id);
                },

                testEmailAccountConnection: async (id) => {
                    const db = getAdapter(get().config.storageMode);
                    return await db.testEmailAccountConnection(id);
                },

                setSelectedAccount: (id) => {
                    set((state) => {
                        state.selectedAccountId = id;
                    });
                    // Refresh emails when account changes
                    get().fetchEmails(id);
                },

                // ==================
                // Email Actions
                // ==================
                fetchEmails: async (accountId, folder) => {
                    if (!isDbInitialized()) return;

                    set((state) => { state.isLoadingEmails = true; });

                    const db = getAdapter(get().config.storageMode);
                    const currentFolder = folder || get().currentFolder;
                    const emails = await db.getEmails(accountId, currentFolder);

                    set((state) => {
                        state.emails = emails;
                        state.isLoadingEmails = false;
                    });
                },

                searchEmails: async (query, folder) => {
                    if (!isDbInitialized()) return;

                    set((state) => {
                        state.isLoadingEmails = true;
                        state.searchQuery = query;
                    });

                    const db = getAdapter(get().config.storageMode);
                    const currentFolder = folder || get().currentFolder;
                    const emails = await db.searchEmails(query, currentFolder);

                    set((state) => {
                        state.emails = emails;
                        state.isLoadingEmails = false;
                    });
                },

                getEmailById: async (id) => {
                    const db = getAdapter(get().config.storageMode);
                    return await db.getEmailById(id);
                },

                markEmailRead: async (id, isRead) => {
                    const db = getAdapter(get().config.storageMode);

                    // Optimistic update
                    set((state) => {
                        const email = state.emails.find(e => e.id === id);
                        if (email) {
                            email.isRead = isRead;
                            if (isRead && !email.isRead) {
                                state.unreadEmailCount = Math.max(0, state.unreadEmailCount - 1);
                            } else if (!isRead && email.isRead) {
                                state.unreadEmailCount += 1;
                            }
                        }
                    });

                    await db.markEmailRead(id, isRead);
                    await get().fetchUnreadEmailCount();
                },

                markEmailStarred: async (id, isStarred) => {
                    const db = getAdapter(get().config.storageMode);

                    // Optimistic update
                    set((state) => {
                        const email = state.emails.find(e => e.id === id);
                        if (email) {
                            email.isStarred = isStarred;
                        }
                    });

                    await db.markEmailStarred(id, isStarred);
                },

                archiveEmail: async (id, isArchived) => {
                    const db = getAdapter(get().config.storageMode);

                    // Optimistic update
                    set((state) => {
                        const email = state.emails.find(e => e.id === id);
                        if (email) {
                            email.isArchived = isArchived;
                        }
                    });

                    await db.archiveEmail(id, isArchived);
                },

                deleteEmail: async (id) => {
                    const db = getAdapter(get().config.storageMode);

                    // Optimistic update
                    const previousEmails = get().emails;
                    set((state) => {
                        state.emails = state.emails.filter(e => e.id !== id);
                    });

                    const success = await db.deleteEmail(id);

                    if (!success) {
                        // Rollback
                        set((state) => {
                            state.emails = previousEmails;
                        });
                    }

                    return success;
                },

                moveEmailToFolder: async (id, folder) => {
                    const db = getAdapter(get().config.storageMode);

                    // Optimistic update
                    set((state) => {
                        const email = state.emails.find(e => e.id === id);
                        if (email) {
                            email.folder = folder;
                        }
                    });

                    await db.moveEmailToFolder(id, folder);
                },

                setSelectedEmail: (id) => {
                    set((state) => {
                        state.selectedEmailId = id;
                    });
                },

                setCurrentFolder: (folder) => {
                    set((state) => {
                        state.currentFolder = folder;
                    });
                    // Refresh emails when folder changes
                    get().fetchEmails(get().selectedAccountId || undefined, folder);
                },

                setSearchQuery: (query) => {
                    set((state) => {
                        state.searchQuery = query;
                    });
                    if (query) {
                        get().searchEmails(query);
                    } else {
                        get().fetchEmails();
                    }
                },

                fetchUnreadEmailCount: async () => {
                    if (!isDbInitialized()) return;

                    const db = getAdapter(get().config.storageMode);
                    const count = await db.getUnreadEmailCount();

                    set((state) => {
                        state.unreadEmailCount = count;
                    });
                },

                // ==================
                // Email Label Actions
                // ==================
                fetchEmailLabels: async () => {
                    if (!isDbInitialized()) return;

                    const db = getAdapter(get().config.storageMode);
                    const labels = await db.getEmailLabels();

                    set((state) => {
                        state.emailLabels = labels;
                    });
                },

                createEmailLabel: async (name, color) => {
                    const db = getAdapter(get().config.storageMode);

                    try {
                        const label = await db.createEmailLabel(name, color);

                        set((state) => {
                            state.emailLabels.push(label);
                        });

                        return label;
                    } catch (error) {
                        console.error('Failed to create email label:', error);
                        return null;
                    }
                },

                updateEmailLabel: async (id, data) => {
                    const db = getAdapter(get().config.storageMode);

                    const updated = await db.updateEmailLabel(id, data);

                    if (updated) {
                        set((state) => {
                            const index = state.emailLabels.findIndex(l => l.id === id);
                            if (index !== -1) {
                                state.emailLabels[index] = updated;
                            }
                        });
                    }

                    return updated;
                },

                deleteEmailLabel: async (id) => {
                    const db = getAdapter(get().config.storageMode);

                    const success = await db.deleteEmailLabel(id);

                    if (success) {
                        set((state) => {
                            state.emailLabels = state.emailLabels.filter(l => l.id !== id);
                        });
                    }

                    return success;
                },

                addLabelToEmail: async (emailId, labelId) => {
                    const db = getAdapter(get().config.storageMode);

                    // Optimistic update
                    const label = get().emailLabels.find(l => l.id === labelId);
                    if (label) {
                        set((state) => {
                            const email = state.emails.find(e => e.id === emailId);
                            if (email && !email.labels?.includes(label.name)) {
                                email.labels = [...(email.labels || []), label.name];
                            }
                        });
                    }

                    await db.addLabelToEmail(emailId, labelId);
                },

                removeLabelFromEmail: async (emailId, labelId) => {
                    const db = getAdapter(get().config.storageMode);

                    // Optimistic update
                    const label = get().emailLabels.find(l => l.id === labelId);
                    if (label) {
                        set((state) => {
                            const email = state.emails.find(e => e.id === emailId);
                            if (email) {
                                email.labels = email.labels?.filter(l => l !== label.name) || [];
                            }
                        });
                    }

                    await db.removeLabelFromEmail(emailId, labelId);
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
                // Comment Actions
                // ==================
                fetchComments: async (taskId) => {
                    if (!isDbInitialized()) return;
                    
                    const db = getAdapter(get().config.storageMode);
                    if (db.getComments) {
                        const comments = await db.getComments(taskId);
                        set((state) => {
                            // Update comments for this task
                            state.comments = [
                                ...state.comments.filter(c => c.taskId !== taskId),
                                ...comments,
                            ];
                        });
                    }
                },

                addComment: async (input) => {
                    if (!isDbInitialized()) return null;
                    
                    const { user } = get();
                    if (!user) {
                        console.error('[FluxStore] Cannot add comment: No user logged in');
                        return null;
                    }

                    const db = getAdapter(get().config.storageMode);
                    if (db.createComment) {
                        const comment = await db.createComment({
                            ...input,
                            userId: user.id,
                            userName: user.name,
                            userAvatar: user.avatar,
                        });
                        
                        if (comment) {
                            set((state) => {
                                state.comments.push(comment);
                            });
                            
                            // Log activity
                            if (db.logActivity) {
                                await db.logActivity({
                                    taskId: input.taskId,
                                    userId: user.id,
                                    userName: user.name,
                                    action: 'commented',
                                    details: { commentId: comment.id, isInternal: input.isInternal || false },
                                });
                            }
                        }
                        
                        return comment;
                    }
                    return null;
                },

                updateComment: async (id, content) => {
                    if (!isDbInitialized()) return null;
                    
                    const db = getAdapter(get().config.storageMode);
                    if (db.updateComment) {
                        const updated = await db.updateComment(id, content);
                        if (updated) {
                            set((state) => {
                                const index = state.comments.findIndex(c => c.id === id);
                                if (index !== -1) {
                                    state.comments[index] = updated;
                                }
                            });
                        }
                        return updated;
                    }
                    return null;
                },

                deleteComment: async (id) => {
                    if (!isDbInitialized()) return false;
                    
                    const db = getAdapter(get().config.storageMode);
                    if (db.deleteComment) {
                        const success = await db.deleteComment(id);
                        if (success) {
                            set((state) => {
                                state.comments = state.comments.filter(c => c.id !== id);
                            });
                        }
                        return success;
                    }
                    return false;
                },

                getActivity: async (taskId) => {
                    if (!isDbInitialized()) return [];
                    
                    const db = getAdapter(get().config.storageMode);
                    if (db.getActivity) {
                        const activities = await db.getActivity(taskId);
                        set((state) => {
                            // Update activities for this task
                            state.activities = [
                                ...state.activities.filter(a => a.taskId !== taskId),
                                ...activities,
                            ];
                        });
                        return activities;
                    }
                    return [];
                },

                // ==================
                // Task Relationship Actions
                // ==================
                fetchTaskRelationships: async (taskId) => {
                    if (!isDbInitialized()) return;
                    
                    const db = getAdapter(get().config.storageMode);
                    if (db.getTaskRelationships) {
                        const relationships = await db.getTaskRelationships(taskId);
                        set((state) => {
                            if (taskId) {
                                // Update relationships for specific task
                                state.taskRelationships = [
                                    ...state.taskRelationships.filter(r => 
                                        r.sourceTaskId !== taskId && r.targetTaskId !== taskId
                                    ),
                                    ...relationships,
                                ];
                            } else {
                                // Update all relationships
                                state.taskRelationships = relationships;
                            }
                        });
                    }
                },

                linkTasks: async (sourceTaskId, targetTaskId, relationshipType) => {
                    if (!isDbInitialized()) return null;
                    
                    const db = getAdapter(get().config.storageMode);
                    if (db.createTaskRelationship) {
                        const relationship = await db.createTaskRelationship({
                            sourceTaskId,
                            targetTaskId,
                            relationshipType,
                        });
                        
                        if (relationship) {
                            set((state) => {
                                state.taskRelationships.push(relationship);
                            });
                        }
                        
                        return relationship;
                    }
                    return null;
                },

                unlinkTasks: async (relationshipId) => {
                    if (!isDbInitialized()) return false;
                    
                    const db = getAdapter(get().config.storageMode);
                    if (db.deleteTaskRelationship) {
                        const success = await db.deleteTaskRelationship(relationshipId);
                        if (success) {
                            set((state) => {
                                state.taskRelationships = state.taskRelationships.filter(r => r.id !== relationshipId);
                            });
                        }
                        return success;
                    }
                    return false;
                },

                getBlockers: async (taskId) => {
                    const relationships = get().taskRelationships;
                    const blockers = relationships
                        .filter(r => r.targetTaskId === taskId && r.relationshipType === 'blocks')
                        .map(r => get().tasks.find(t => t.id === r.sourceTaskId))
                        .filter((t): t is Task => t !== undefined);
                    return blockers;
                },

                getBlockedBy: async (taskId) => {
                    const relationships = get().taskRelationships;
                    const blockedBy = relationships
                        .filter(r => r.sourceTaskId === taskId && r.relationshipType === 'blocks')
                        .map(r => get().tasks.find(t => t.id === r.targetTaskId))
                        .filter((t): t is Task => t !== undefined);
                    return blockedBy;
                },

                getSubtasks: async (taskId) => {
                    return get().tasks.filter(t => t.parentTaskId === taskId);
                },

                createSubtask: async (parentTaskId, input) => {
                    if (!isDbInitialized()) return null;
                    
                    const subtask = await get().createTask({
                        ...input,
                        parentTaskId,
                    });
                    
                    return subtask;
                },

                // ==================
                // SLA and Time Tracking Actions
                // ==================
                fetchSLAConfigs: async () => {
                    if (!isDbInitialized()) return;
                    
                    const db = getAdapter(get().config.storageMode);
                    if (db.getSLAConfigs) {
                        const configs = await db.getSLAConfigs();
                        set((state) => {
                            state.slaConfigs = configs;
                        });
                    }
                },

                createSLAConfig: async (configData) => {
                    if (!isDbInitialized()) return null;
                    
                    const db = getAdapter(get().config.storageMode);
                    if (db.createSLAConfig) {
                        const config = await db.createSLAConfig(configData);
                        if (config) {
                            set((state) => {
                                state.slaConfigs.push(config);
                            });
                        }
                        return config;
                    }
                    return null;
                },

                updateSLAConfig: async (id, data) => {
                    if (!isDbInitialized()) return null;
                    
                    const db = getAdapter(get().config.storageMode);
                    if (db.updateSLAConfig) {
                        const updated = await db.updateSLAConfig(id, data);
                        if (updated) {
                            set((state) => {
                                const index = state.slaConfigs.findIndex(c => c.id === id);
                                if (index !== -1) {
                                    state.slaConfigs[index] = updated;
                                }
                            });
                        }
                        return updated;
                    }
                    return null;
                },

                deleteSLAConfig: async (id) => {
                    if (!isDbInitialized()) return false;
                    
                    const db = getAdapter(get().config.storageMode);
                    if (db.deleteSLAConfig) {
                        const success = await db.deleteSLAConfig(id);
                        if (success) {
                            set((state) => {
                                state.slaConfigs = state.slaConfigs.filter(c => c.id !== id);
                            });
                        }
                        return success;
                    }
                    return false;
                },

                fetchTimeEntries: async (taskId) => {
                    if (!isDbInitialized()) return;
                    
                    const db = getAdapter(get().config.storageMode);
                    if (db.getTimeEntries) {
                        const entries = await db.getTimeEntries(taskId);
                        set((state) => {
                            if (taskId) {
                                // Update entries for specific task
                                state.timeEntries = [
                                    ...state.timeEntries.filter(e => e.taskId !== taskId),
                                    ...entries,
                                ];
                            } else {
                                // Update all entries
                                state.timeEntries = entries;
                            }
                        });
                    }
                },

                logTime: async (input) => {
                    if (!isDbInitialized()) return null;
                    
                    const { user } = get();
                    if (!user) {
                        console.error('[FluxStore] Cannot log time: No user logged in');
                        return null;
                    }

                    const db = getAdapter(get().config.storageMode);
                    if (db.createTimeEntry) {
                        const entry = await db.createTimeEntry({
                            ...input,
                            userId: user.id,
                            userName: user.name,
                            loggedAt: input.loggedAt || new Date().toISOString(),
                        });
                        
                        if (entry) {
                            set((state) => {
                                state.timeEntries.push(entry);
                            });
                        }
                        
                        return entry;
                    }
                    return null;
                },

                updateTimeEntry: async (id, data) => {
                    if (!isDbInitialized()) return null;
                    
                    const db = getAdapter(get().config.storageMode);
                    if (db.updateTimeEntry) {
                        const updated = await db.updateTimeEntry(id, data);
                        if (updated) {
                            set((state) => {
                                const index = state.timeEntries.findIndex(e => e.id === id);
                                if (index !== -1) {
                                    state.timeEntries[index] = updated;
                                }
                            });
                        }
                        return updated;
                    }
                    return null;
                },

                deleteTimeEntry: async (id) => {
                    if (!isDbInitialized()) return false;
                    
                    const db = getAdapter(get().config.storageMode);
                    if (db.deleteTimeEntry) {
                        const success = await db.deleteTimeEntry(id);
                        if (success) {
                            set((state) => {
                                state.timeEntries = state.timeEntries.filter(e => e.id !== id);
                            });
                        }
                        return success;
                    }
                    return false;
                },

                startTimer: async (taskId) => {
                    const { user, activeTimer } = get();
                    if (!user) {
                        console.error('[FluxStore] Cannot start timer: No user logged in');
                        return;
                    }

                    // Stop existing timer if any
                    if (activeTimer) {
                        await get().stopTimer();
                    }

                    set((state) => {
                        state.activeTimer = {
                            taskId,
                            userId: user.id,
                            startTime: new Date().toISOString(),
                        };
                    });
                },

                stopTimer: async () => {
                    const { activeTimer, user } = get();
                    if (!activeTimer || !user) {
                        return null;
                    }

                    const startTime = new Date(activeTimer.startTime);
                    const endTime = new Date();
                    const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));

                    if (durationMinutes > 0) {
                        const entry = await get().logTime({
                            taskId: activeTimer.taskId,
                            durationMinutes,
                            description: 'Timer session',
                            loggedAt: startTime.toISOString(),
                        });

                        set((state) => {
                            state.activeTimer = null;
                        });

                        return entry;
                    }

                    set((state) => {
                        state.activeTimer = null;
                    });

                    return null;
                },

                getActiveTimer: () => {
                    return get().activeTimer;
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

                setSelectedIncidentId: (id) => {
                    set((state) => {
                        state.selectedIncidentId = id;
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
