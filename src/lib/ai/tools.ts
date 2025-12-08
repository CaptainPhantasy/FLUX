// @ts-nocheck
// =====================================
// FLUX - AI Tool Registry
// =====================================
// Defines executable tools that the AI can call to control the UI

import { useFluxStore } from '@/lib/store';
import type { Task, TaskCreateInput, ToolCall } from '@/types';
import { getWorkflow, getActiveColumns, type WorkflowMode } from '@/lib/workflows';
import { dispatchNanocoderAction } from '@/features/nanocoder/dispatcher';
import { isDbInitialized, getAdapter } from '@/lib/db';

/**
 * Tool Definition
 */
export interface ToolDefinition {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, {
            type: string;
            description: string;
            enum?: string[];
        }>;
        required?: string[];
    };
    execute: (args: Record<string, unknown>) => Promise<ToolResult>;
}

export interface ToolResult {
    success: boolean;
    message: string;
    data?: unknown;
}

// ToolCall is now imported from @/types

/**
 * Tool Registry - Maps tool names to their implementations
 */
export const toolRegistry: ToolDefinition[] = [
    // ==================
    // Task Tools
    // ==================
    {
        name: 'create_task',
        description: 'Create a new task in the project. Use this when the user wants to add a new task or todo item. You can optionally specify which column/status to place it in.',
        parameters: {
            type: 'object',
            properties: {
                title: {
                    type: 'string',
                    description: 'The title/name of the task',
                },
                description: {
                    type: 'string',
                    description: 'Optional detailed description of the task',
                },
                priority: {
                    type: 'string',
                    description: 'Priority level of the task',
                    enum: ['low', 'medium', 'high', 'urgent'],
                },
                status: {
                    type: 'string',
                    description: 'Initial column/status for the task. For Agile workflow: backlog, ready, todo, in-progress, code-review, testing, done. For CCaaS: new, queued, assigned, in-progress, pending-customer, escalated, resolved, closed. For ITSM: new, triaged, assigned, investigating, pending-vendor, pending-approval, implementing, resolved, closed. If not specified, defaults to the first column of the current workflow.',
                },
                tags: {
                    type: 'string',
                    description: 'Comma-separated tags for the task',
                },
            },
            required: ['title'],
        },
        execute: async (args) => {
            const store = useFluxStore.getState();
            const workflowMode = store.workflowMode || 'agile';
            const workflow = getWorkflow(workflowMode);
            const columns = getActiveColumns(workflowMode);
            
            // Default to first column if status not provided
            const defaultStatus = columns[0]?.id || 'backlog';
            const requestedStatus = (args.status as string) || defaultStatus;
            
            // Validate status exists in current workflow
            const requestedColumn = workflow.columns.find(c => c.id === requestedStatus);
            if (requestedStatus && !requestedColumn) {
                // Invalid column requested - report error with available options
                const availableColumns = workflow.columns.map(c => `"${c.title}" (${c.id})`).join(', ');
                return {
                    success: false,
                    message: `Cannot create task: The column "${requestedStatus}" does not exist in the ${workflow.name} workflow. Available columns are: ${availableColumns}. Please use one of these column names or IDs.`
                };
            }
            const validStatus = requestedColumn?.id || defaultStatus;

            const input: TaskCreateInput = {
                title: args.title as string,
                description: args.description as string | undefined,
                priority: (args.priority as Task['priority']) || 'medium',
                status: validStatus as Task['status'],
                tags: args.tags ? (args.tags as string).split(',').map(t => t.trim()) : [],
            };

            try {
                // Defensive check: Verify authentication for Supabase storage mode
                // Note: Users should be authenticated to access /app routes, but this handles:
                // - Session expiration during use
                // - Token refresh failures
                // - Edge cases where auth state desyncs
                if (store.config?.storageMode === 'supabase' && !store.isAuthenticated) {
                    return {
                        success: false,
                        message: 'Cannot create task: Your session may have expired. Please refresh the page or log in again via Supabase authentication.'
                    };
                }
                
                const task = await store.createTask(input);

                if (task) {
                    const columnName = workflow.columns.find(c => c.id === validStatus)?.title || validStatus;
                    
                    // Dispatch action for visual feedback
                    dispatchNanocoderAction('create_task', {
                        title: task.title,
                        description: task.description,
                        priority: task.priority,
                        status: validStatus,
                    }, 'internal');
                    
                    return {
                        success: true,
                        message: `Created task "${task.title}" in ${columnName} column with ${task.priority} priority`,
                        data: task,
                    };
                }
                
                // Check if database is initialized
                if (!isDbInitialized()) {
                    return { 
                        success: false, 
                        message: 'Failed to create task: Database not initialized. Please wait for the application to finish loading, or refresh the page.' 
                    };
                }
                
                return { 
                    success: false, 
                    message: 'Failed to create task: Unknown error occurred. Please check the browser console for details.' 
                };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error('[create_task tool] Error:', error);
                return { 
                    success: false, 
                    message: `Failed to create task: ${errorMessage}` 
                };
            }
        },
    },

    {
        name: 'update_task_status',
        description: 'Update the status/column of an existing task. Use when user wants to move a task to a different column or mark it as done. This tool finds tasks by partial title match.',
        parameters: {
            type: 'object',
            properties: {
                task_title: {
                    type: 'string',
                    description: 'The title of the task to update (partial match supported - e.g., "fix bug" will match "Fix the bug in login")',
                },
                new_status: {
                    type: 'string',
                    description: 'The new column/status. For Agile: backlog, ready, todo, in-progress, code-review, testing, done. For CCaaS: new, queued, assigned, in-progress, pending-customer, escalated, resolved, closed. For ITSM: new, triaged, assigned, investigating, pending-vendor, pending-approval, implementing, resolved, closed.',
                },
            },
            required: ['task_title', 'new_status'],
        },
        execute: async (args) => {
            try {
                if (!isDbInitialized()) {
                    return {
                        success: false,
                        message: 'Cannot update task: Database not initialized. Please wait for the application to finish loading, or refresh the page.'
                    };
                }

                const store = useFluxStore.getState();
                
                // Defensive check: Verify authentication for Supabase storage mode
                // Handles session expiration and token refresh failures
                if (store.config?.storageMode === 'supabase' && !store.isAuthenticated) {
                    return {
                        success: false,
                        message: 'Cannot update task: Your session may have expired. Please refresh the page or log in again.'
                    };
                }
                const workflowMode = store.workflowMode || 'agile';
                const workflow = getWorkflow(workflowMode);
                const tasks = store.tasks;
                const searchTitle = (args.task_title as string).toLowerCase();

                // Find task by partial title match
                const task = tasks.find(t =>
                    t.title.toLowerCase().includes(searchTitle)
                );

                if (!task) {
                    return {
                        success: false,
                        message: `Could not find a task matching "${args.task_title}". Available tasks: ${tasks.slice(0, 5).map(t => t.title).join(', ')}${tasks.length > 5 ? '...' : ''}`
                    };
                }

                const requestedStatus = args.new_status as string;
                // Validate status exists in current workflow
                const requestedColumn = workflow.columns.find(c => c.id === requestedStatus);
                if (!requestedColumn) {
                    // Invalid column requested - report error with available options
                    const availableColumns = workflow.columns.map(c => `"${c.title}" (${c.id})`).join(', ');
                    return {
                        success: false,
                        message: `Cannot move task: The column "${requestedStatus}" does not exist in the ${workflow.name} workflow. Available columns are: ${availableColumns}. Please use one of these column names or IDs.`
                    };
                }
                const validStatus = requestedColumn.id;

                await store.updateTaskStatus(task.id, validStatus as Task['status']);

                // Dispatch action for visual feedback
                dispatchNanocoderAction('move_task', {
                    taskId: task.id,
                    toColumn: validStatus,
                }, 'internal');

                const columnName = workflow.columns.find(c => c.id === validStatus)?.title || validStatus;
                return {
                    success: true,
                    message: `Moved "${task.title}" to ${columnName} column`,
                    data: { taskId: task.id, newStatus: validStatus },
                };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error('[update_task_status tool] Error:', error);
                return {
                    success: false,
                    message: `Failed to update task status: ${errorMessage}`
                };
            }
        },
    },

    {
        name: 'list_tasks',
        description: 'List all tasks, optionally filtered by status or priority. Use when user asks about their tasks, workload, or wants to see what tasks exist. This is a READ operation - use it to check state before making changes.',
        parameters: {
            type: 'object',
            properties: {
                status: {
                    type: 'string',
                    description: 'Optional status filter. Can be any valid status from the current workflow, or "all" for all tasks, or "high-priority" for urgent/high priority tasks.',
                },
                priority: {
                    type: 'string',
                    description: 'Optional priority filter',
                    enum: ['low', 'medium', 'high', 'urgent'],
                },
                limit: {
                    type: 'number',
                    description: 'Maximum number of tasks to return (default: 50)',
                },
            },
        },
        execute: async (args) => {
            const store = useFluxStore.getState();
            const workflowMode = store.workflowMode || 'agile';
            const workflow = getWorkflow(workflowMode);
            let tasks = store.tasks.filter(t => t.status !== 'archived');
            
            const status = args.status as string;
            const priority = args.priority as string;
            const limit = (args.limit as number) || 50;

            // Filter by status
            if (status && status !== 'all') {
                if (status === 'high-priority') {
                    tasks = tasks.filter(t => t.priority === 'high' || t.priority === 'urgent');
                } else {
                    // Validate status exists in workflow
                    const validStatus = workflow.columns.find(c => c.id === status)?.id;
                    if (validStatus) {
                        tasks = tasks.filter(t => t.status === validStatus);
                    }
                }
            }
            
            // Filter by priority
            if (priority) {
                tasks = tasks.filter(t => t.priority === priority);
            }
            
            // Apply limit
            tasks = tasks.slice(0, limit);

            const summary = tasks.map(t => {
                const col = workflow.columns.find(c => c.id === t.status);
                return `• "${t.title}" [${col?.title || t.status}] - ${t.priority} priority`;
            }).join('\n');

            return {
                success: true,
                message: tasks.length > 0
                    ? `Found ${tasks.length} task(s):\n${summary}`
                    : 'No tasks found matching your criteria',
                data: { tasks, count: tasks.length },
            };
        },
    },

    {
        name: 'get_task_details',
        description: 'Get detailed information about a specific task by title (partial match supported). Use when user asks about a specific task or you need to check task details before updating it.',
        parameters: {
            type: 'object',
            properties: {
                task_title: {
                    type: 'string',
                    description: 'The title of the task (partial match supported)',
                },
            },
            required: ['task_title'],
        },
        execute: async (args) => {
            const store = useFluxStore.getState();
            const workflowMode = store.workflowMode || 'agile';
            const workflow = getWorkflow(workflowMode);
            const tasks = store.tasks;
            const searchTitle = (args.task_title as string).toLowerCase();

            const task = tasks.find(t =>
                t.title.toLowerCase().includes(searchTitle)
            );

            if (!task) {
                const similar = tasks
                    .filter(t => t.title.toLowerCase().includes(searchTitle.slice(0, 3)))
                    .slice(0, 5)
                    .map(t => t.title);
                
                return {
                    success: false,
                    message: `Could not find task "${args.task_title}". Similar tasks: ${similar.join(', ') || 'none'}`,
                };
            }

            const col = workflow.columns.find(c => c.id === task.status);
            const details = [
                `Title: ${task.title}`,
                `Status: ${col?.title || task.status}`,
                `Priority: ${task.priority}`,
                task.description ? `Description: ${task.description}` : 'No description',
                `Created: ${new Date(task.createdAt).toLocaleDateString()}`,
            ].filter(Boolean).join('\n');

            return {
                success: true,
                message: `Task Details:\n${details}`,
                data: task,
            };
        },
    },

    {
        name: 'archive_completed_tasks',
        description: 'Archive all tasks that are marked as done. Use for cleanup operations.',
        parameters: {
            type: 'object',
            properties: {},
        },
        execute: async () => {
            const store = useFluxStore.getState();
            const doneTasks = store.tasks.filter(t => t.status === 'done');

            if (doneTasks.length === 0) {
                return { success: true, message: 'No completed tasks to archive' };
            }

            await store.archiveTasks(doneTasks.map(t => t.id));

            return {
                success: true,
                message: `Archived ${doneTasks.length} completed task(s)`,
                data: { archivedCount: doneTasks.length },
            };
        },
    },

    // ==================
    // Notification Tools
    // ==================
    {
        name: 'clear_notifications',
        description: 'Clear or mark all notifications as read. Use when user wants to clean up their inbox.',
        parameters: {
            type: 'object',
            properties: {
                action: {
                    type: 'string',
                    description: 'Whether to mark as read or delete all',
                    enum: ['mark_read', 'delete_all'],
                },
            },
        },
        execute: async (args) => {
            const store = useFluxStore.getState();
            const action = args.action as string || 'mark_read';

            if (action === 'delete_all') {
                await store.clearAllNotifications();
                return { success: true, message: 'Cleared all notifications' };
            } else {
                await store.markAllNotificationsRead();
                return { success: true, message: 'Marked all notifications as read' };
            }
        },
    },

    {
        name: 'get_unread_count',
        description: 'Get the count of unread notifications. Use when user asks about pending notifications.',
        parameters: {
            type: 'object',
            properties: {},
        },
        execute: async () => {
            const count = useFluxStore.getState().unreadCount;
            return {
                success: true,
                message: count > 0
                    ? `You have ${count} unread notification(s)`
                    : 'Your inbox is clear!',
                data: { unreadCount: count },
            };
        },
    },

    // ==================
    // UI Control Tools
    // ==================
    {
        name: 'set_theme',
        description: 'Change the application theme. Use when user wants to switch between light and dark mode.',
        parameters: {
            type: 'object',
            properties: {
                theme: {
                    type: 'string',
                    description: 'The theme to set',
                    enum: ['light', 'dark', 'system'],
                },
            },
            required: ['theme'],
        },
        execute: async (args) => {
            const theme = args.theme as 'light' | 'dark' | 'system';
            useFluxStore.getState().setTheme(theme);
            return {
                success: true,
                message: `Theme set to ${theme} mode`,
            };
        },
    },

    {
        name: 'toggle_sidebar',
        description: 'Toggle the sidebar visibility. Use when user wants to collapse or expand the sidebar.',
        parameters: {
            type: 'object',
            properties: {},
        },
        execute: async () => {
            useFluxStore.getState().toggleSidebar();
            const collapsed = useFluxStore.getState().sidebarCollapsed;
            return {
                success: true,
                message: collapsed ? 'Sidebar collapsed' : 'Sidebar expanded',
            };
        },
    },

    // ==================
    // Navigation Tools (Nanocoder)
    // ==================
    {
        name: 'navigate_to_page',
        description: 'Navigate to a specific page in the application. Use when user wants to go to a different section like dashboard, board, sprints, inbox, etc.',
        parameters: {
            type: 'object',
            properties: {
                page: {
                    type: 'string',
                    description: 'The page to navigate to',
                    enum: [
                        'dashboard', 'board', 'sprints', 'inbox', 'documents',
                        'assets', 'analytics', 'service-desk', 'automation',
                        'integrations', 'import', 'ai', 'appearance', 'settings', 'editor'
                    ],
                },
            },
            required: ['page'],
        },
        execute: async (args) => {
            // This tool dispatches a navigation event that NanocoderBridge handles
            // The actual navigation happens in the bridge component
            const page = args.page as string;
            return {
                success: true,
                message: `Navigating to ${page}`,
                data: { page },
            };
        },
    },

    {
        name: 'go_back',
        description: 'Navigate back to the previous page. Use when user wants to go back.',
        parameters: {
            type: 'object',
            properties: {},
        },
        execute: async () => {
            return {
                success: true,
                message: 'Navigating back',
            };
        },
    },

    {
        name: 'open_terminal',
        description: 'Open the command terminal (Ctrl+K). Use when user wants to access the AI terminal.',
        parameters: {
            type: 'object',
            properties: {},
        },
        execute: async () => {
            return {
                success: true,
                message: 'Opening terminal',
            };
        },
    },

    {
        name: 'close_terminal',
        description: 'Close the command terminal. Use when user wants to dismiss the terminal.',
        parameters: {
            type: 'object',
            properties: {},
        },
        execute: async () => {
            return {
                success: true,
                message: 'Closing terminal',
            };
        },
    },

    // ==================
    // Board Control Tools (Nanocoder)
    // ==================
    {
        name: 'move_task_to_column',
        description: 'Move a task to a different column/status on the board. Use when user wants to drag a task to another column. This is an alias for update_task_status - use that tool instead for consistency.',
        parameters: {
            type: 'object',
            properties: {
                task_title: {
                    type: 'string',
                    description: 'The title of the task to move (partial match supported)',
                },
                column: {
                    type: 'string',
                    description: 'The target column/status. For Agile: backlog, ready, todo, in-progress, code-review, testing, done. For CCaaS: new, queued, assigned, in-progress, pending-customer, escalated, resolved, closed. For ITSM: new, triaged, assigned, investigating, pending-vendor, pending-approval, implementing, resolved, closed.',
                },
            },
            required: ['task_title', 'column'],
        },
        execute: async (args) => {
            const store = useFluxStore.getState();
            const workflowMode = store.workflowMode || 'agile';
            const workflow = getWorkflow(workflowMode);
            const tasks = store.tasks;
            const searchTitle = (args.task_title as string).toLowerCase();
            const targetColumn = args.column as string;

            const task = tasks.find(t =>
                t.title.toLowerCase().includes(searchTitle)
            );

            if (!task) {
                return {
                    success: false,
                    message: `Could not find a task matching "${args.task_title}". Available tasks: ${tasks.slice(0, 5).map(t => t.title).join(', ')}${tasks.length > 5 ? '...' : ''}`,
                };
            }

            // Validate status exists in current workflow
            const requestedColumn = workflow.columns.find(c => c.id === targetColumn);
            if (!requestedColumn) {
                // Invalid column requested - report error with available options
                const availableColumns = workflow.columns.map(c => `"${c.title}" (${c.id})`).join(', ');
                return {
                    success: false,
                    message: `Cannot move task: The column "${targetColumn}" does not exist in the ${workflow.name} workflow. Available columns are: ${availableColumns}. Please use one of these column names or IDs.`
                };
            }
            const validStatus = requestedColumn.id;
            await store.updateTaskStatus(task.id, validStatus as Task['status']);

            // Dispatch action for visual feedback (bridge will handle task ID resolution)
            dispatchNanocoderAction('move_task', {
                taskId: task.id,
                toColumn: validStatus,
            }, 'internal');

            const columnName = workflow.columns.find(c => c.id === validStatus)?.title || validStatus;
            return {
                success: true,
                message: `Moved "${task.title}" to ${columnName} column`,
                data: { taskId: task.id, column: validStatus },
            };
        },
    },

    {
        name: 'change_workflow_mode',
        description: 'Switch the board workflow mode between Agile, CCaaS, and ITSM. Use when user wants to change the workflow type.',
        parameters: {
            type: 'object',
            properties: {
                workflow: {
                    type: 'string',
                    description: 'The workflow mode to switch to',
                    enum: ['agile', 'ccaas', 'itsm'],
                },
            },
            required: ['workflow'],
        },
        execute: async (args) => {
            const workflow = args.workflow as 'agile' | 'ccaas' | 'itsm';
            useFluxStore.getState().setWorkflowMode(workflow);
            
            const workflowNames = {
                agile: 'Agile (Scrum/Kanban)',
                ccaas: 'Contact Center (CCaaS)',
                itsm: 'IT Service Management',
            };

            return {
                success: true,
                message: `Switched to ${workflowNames[workflow]} workflow`,
                data: { workflow },
            };
        },
    },

    {
        name: 'scroll_to_task',
        description: 'Scroll the board to show a specific task and highlight it. Use when user wants to find and focus on a task.',
        parameters: {
            type: 'object',
            properties: {
                task_title: {
                    type: 'string',
                    description: 'The title of the task to find (partial match supported)',
                },
            },
            required: ['task_title'],
        },
        execute: async (args) => {
            const tasks = useFluxStore.getState().tasks;
            const searchTitle = (args.task_title as string).toLowerCase();

            const task = tasks.find(t =>
                t.title.toLowerCase().includes(searchTitle)
            );

            if (!task) {
                return {
                    success: false,
                    message: `Could not find a task matching "${args.task_title}"`,
                };
            }

            return {
                success: true,
                message: `Scrolling to "${task.title}"`,
                data: { taskId: task.id, taskTitle: task.title },
            };
        },
    },

    // ==================
    // Project Tools
    // ==================
    {
        name: 'list_projects',
        description: 'List all available projects. Use when user asks about projects or wants to see what projects exist.',
        parameters: {
            type: 'object',
            properties: {},
        },
        execute: async () => {
            const projects = useFluxStore.getState().projects;
            const summary = projects.map(p => `• ${p.name} (${p.id})`).join('\n');
            
            return {
                success: true,
                message: projects.length > 0
                    ? `Found ${projects.length} project(s):\n${summary}`
                    : 'No projects found',
                data: { projects, count: projects.length },
            };
        },
    },

    {
        name: 'create_project',
        description: 'Create a new project. Use when user wants to start a new project.',
        parameters: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    description: 'The name of the project',
                },
                description: {
                    type: 'string',
                    description: 'Optional description of the project',
                },
            },
            required: ['name'],
        },
        execute: async (args) => {
            const store = useFluxStore.getState();
            const project = await store.createProject({
                name: args.name as string,
                description: args.description as string | undefined,
                color: '#8B5CF6', // Default purple
            });

            if (project) {
                return {
                    success: true,
                    message: `Created project "${project.name}"`,
                    data: project,
                };
            }
            return { success: false, message: 'Failed to create project' };
        },
    },

    {
        name: 'set_current_project',
        description: 'Switch to a different project. Use when user wants to work on a different project.',
        parameters: {
            type: 'object',
            properties: {
                project_name: {
                    type: 'string',
                    description: 'The name of the project to switch to (partial match supported)',
                },
            },
            required: ['project_name'],
        },
        execute: async (args) => {
            const store = useFluxStore.getState();
            const searchName = (args.project_name as string).toLowerCase();
            
            const project = store.projects.find(p =>
                p.name.toLowerCase().includes(searchName)
            );

            if (!project) {
                const available = store.projects.map(p => p.name).join(', ');
                return {
                    success: false,
                    message: `Could not find project "${args.project_name}". Available projects: ${available || 'none'}`,
                };
            }

            store.setCurrentProject(project.id);
            return {
                success: true,
                message: `Switched to project "${project.name}"`,
                data: { projectId: project.id },
            };
        },
    },

    // ==================
    // Batch Operations
    // ==================
    {
        name: 'bulk_update_tasks',
        description: 'Update multiple tasks at once. Use when user wants to change status or priority for multiple tasks.',
        parameters: {
            type: 'object',
            properties: {
                task_titles: {
                    type: 'string',
                    description: 'Comma-separated list of task titles (partial match supported)',
                },
                new_status: {
                    type: 'string',
                    description: 'New status to set for all tasks (optional)',
                },
                new_priority: {
                    type: 'string',
                    description: 'New priority to set for all tasks (optional)',
                    enum: ['low', 'medium', 'high', 'urgent'],
                },
            },
            required: ['task_titles'],
        },
        execute: async (args) => {
            const store = useFluxStore.getState();
            const workflowMode = store.workflowMode || 'agile';
            const workflow = getWorkflow(workflowMode);
            const tasks = store.tasks;
            
            const titles = (args.task_titles as string).split(',').map(t => t.trim().toLowerCase());
            const matchedTasks: Task[] = [];

            for (const searchTitle of titles) {
                const task = tasks.find(t =>
                    t.title.toLowerCase().includes(searchTitle)
                );
                if (task) matchedTasks.push(task);
            }

            if (matchedTasks.length === 0) {
                return {
                    success: false,
                    message: `Could not find any matching tasks`,
                };
            }

            const updates: Promise<void>[] = [];
            const newStatus = args.new_status as string | undefined;
            const newPriority = args.new_priority as string | undefined;

            for (const task of matchedTasks) {
                if (newStatus) {
                    const validStatus = workflow.columns.find(c => c.id === newStatus)?.id || newStatus;
                    updates.push(store.updateTaskStatus(task.id, validStatus as any));
                }
                if (newPriority) {
                    updates.push(store.updateTask(task.id, { priority: newPriority as any }));
                }
            }

            await Promise.all(updates);

            return {
                success: true,
                message: `Updated ${matchedTasks.length} task(s)`,
                data: { updatedCount: matchedTasks.length, tasks: matchedTasks.map(t => t.title) },
            };
        },
    },

    // ==================
    // Summary Tools
    // ==================
    {
        name: 'summarize_project',
        description: 'Get a comprehensive summary of the current project status including task counts by status, priorities, and notifications. Use when user asks "what\'s going on" or wants an overview.',
        parameters: {
            type: 'object',
            properties: {},
        },
        execute: async () => {
            const store = useFluxStore.getState();
            const workflowMode = store.workflowMode || 'agile';
            const workflow = getWorkflow(workflowMode);
            const { tasks, notifications, projects } = store;

            const activeTasks = tasks.filter(t => t.status !== 'archived');
            const statusCounts: Record<string, number> = {};
            
            workflow.columns.forEach(col => {
                statusCounts[col.id] = activeTasks.filter(t => t.status === col.id).length;
            });

            const highPriority = activeTasks.filter(t =>
                t.priority === 'high' || t.priority === 'urgent'
            ).length;

            const summary = [
                `📊 Project Summary`,
                ``,
                `Tasks: ${activeTasks.length} total`,
                ...workflow.columns.map(col => `  • ${col.title}: ${statusCounts[col.id] || 0}`),
                ``,
                `High Priority: ${highPriority} task(s)`,
                `Notifications: ${notifications.filter(n => !n.isRead).length} unread`,
                `Projects: ${projects.length}`,
                `Current Workflow: ${workflow.name}`,
            ].join('\n');

            return {
                success: true,
                message: summary,
                data: { statusCounts, highPriority, totalTasks: activeTasks.length, workflowMode },
            };
        },
    },

    // ==================
    // Data Extraction Tools
    // ==================
    {
        name: 'read_selected_email',
        description: 'Read the currently selected email in the inbox. Returns from, subject, body, and metadata. Use when user wants to see email content or create a task from an email.',
        parameters: {
            type: 'object',
            properties: {
                emailId: {
                    type: 'string',
                    description: 'Optional email ID. If not provided, reads the currently selected email.',
                },
            },
        },
        execute: async (args) => {
            const store = useFluxStore.getState();
            const emailId = (args.emailId as string) || store.selectedEmailId;
            
            if (!emailId) {
                return {
                    success: false,
                    message: 'No email selected. Please select an email first or provide an emailId.',
                };
            }

            const email = store.emails.find(e => e.id === emailId);
            if (!email) {
                return {
                    success: false,
                    message: `Email not found with ID: ${emailId}`,
                };
            }

            return {
                success: true,
                message: `Email from ${email.fromName || email.fromAddress}:\nSubject: ${email.subject}\n\n${email.bodyText || '(No body)'}`,
                data: {
                    id: email.id,
                    from: email.fromAddress,
                    fromName: email.fromName,
                    to: email.toAddresses,
                    subject: email.subject,
                    body: email.bodyText,
                    receivedAt: email.receivedAt,
                    isRead: email.isRead,
                    isStarred: email.isStarred,
                    attachments: email.attachments?.length || 0,
                    labels: email.labels,
                },
            };
        },
    },

    {
        name: 'read_selected_incident',
        description: 'Read the currently selected incident in the service desk. Returns title, description, severity, and status.',
        parameters: {
            type: 'object',
            properties: {
                incidentId: {
                    type: 'string',
                    description: 'Optional incident ID. If not provided, reads the currently selected incident.',
                },
            },
        },
        execute: async (args) => {
            const store = useFluxStore.getState();
            const incidentId = (args.incidentId as string) || store.selectedIncidentId;
            
            if (!incidentId) {
                return {
                    success: false,
                    message: 'No incident selected. Please select an incident first or provide an incidentId.',
                };
            }

            // Incidents are stored in localStorage by IncidentManagement component
            const incidents = JSON.parse(localStorage.getItem('flux_incidents') || '[]');
            const incident = incidents.find((i: any) => i.id === incidentId);
            
            if (!incident) {
                return {
                    success: false,
                    message: `Incident not found with ID: ${incidentId}`,
                };
            }

            return {
                success: true,
                message: `Incident ${incident.number}: ${incident.title}\nSeverity: ${incident.severity}\nStatus: ${incident.status}\n\n${incident.description || '(No description)'}`,
                data: incident,
            };
        },
    },

    {
        name: 'read_selected_task',
        description: 'Read details of a specific task by ID or the currently selected task. Returns full task information.',
        parameters: {
            type: 'object',
            properties: {
                taskId: {
                    type: 'string',
                    description: 'Optional task ID. If not provided, reads the currently selected task.',
                },
            },
        },
        execute: async (args) => {
            const store = useFluxStore.getState();
            const taskId = (args.taskId as string) || store.selectedTaskId;
            
            if (!taskId) {
                return {
                    success: false,
                    message: 'No task selected. Please select a task first or provide a taskId.',
                };
            }

            const task = store.tasks.find(t => t.id === taskId);
            if (!task) {
                return {
                    success: false,
                    message: `Task not found with ID: ${taskId}`,
                };
            }

            const workflowMode = store.workflowMode || 'agile';
            const workflow = getWorkflow(workflowMode);
            const columnName = workflow.columns.find(c => c.id === task.status)?.title || task.status;

            return {
                success: true,
                message: `Task: ${task.title}\nStatus: ${columnName}\nPriority: ${task.priority}\n\n${task.description || '(No description)'}`,
                data: {
                    ...task,
                    columnName,
                },
            };
        },
    },

    {
        name: 'read_sprint_details',
        description: 'Read details of the current or specified sprint. Returns name, goal, dates, and task counts.',
        parameters: {
            type: 'object',
            properties: {
                sprintId: {
                    type: 'string',
                    description: 'Optional sprint ID. If not provided, reads the current/active sprint.',
                },
            },
        },
        execute: async () => {
            // Sprint config is stored in localStorage by SprintPage
            const sprintConfig = JSON.parse(localStorage.getItem('flux_sprint_config') || '{}');
            const store = useFluxStore.getState();
            
            // Count tasks in the sprint (tasks not in backlog)
            const sprintTasks = store.tasks.filter(t => 
                t.status !== 'backlog' && t.status !== 'archived'
            );
            const completedTasks = store.tasks.filter(t => 
                t.status === 'done' || t.status === 'resolved' || t.status === 'closed'
            );

            return {
                success: true,
                message: `Sprint: ${sprintConfig.name || 'Current Sprint'}\nGoal: ${sprintConfig.goal || '(No goal set)'}\nDays Remaining: ${sprintConfig.daysRemaining || 'Unknown'}\nTasks: ${sprintTasks.length} (${completedTasks.length} completed)`,
                data: {
                    name: sprintConfig.name,
                    goal: sprintConfig.goal,
                    duration: sprintConfig.duration,
                    daysRemaining: sprintConfig.daysRemaining,
                    capacity: sprintConfig.capacity,
                    taskCount: sprintTasks.length,
                    completedCount: completedTasks.length,
                },
            };
        },
    },

    // ==================
    // Cross-Entity Creation Tools
    // ==================
    {
        name: 'create_task_from_email',
        description: 'Create a new task using the content of an email. The email subject becomes the task title, and the body becomes the description.',
        parameters: {
            type: 'object',
            properties: {
                emailId: {
                    type: 'string',
                    description: 'Optional email ID. If not provided, uses the currently selected email.',
                },
                status: {
                    type: 'string',
                    description: 'Initial status/column for the task. Defaults to backlog.',
                },
                priority: {
                    type: 'string',
                    description: 'Priority level (low, medium, high, urgent). Defaults to medium.',
                    enum: ['low', 'medium', 'high', 'urgent'],
                },
            },
        },
        execute: async (args) => {
            const store = useFluxStore.getState();
            const emailId = (args.emailId as string) || store.selectedEmailId;
            
            if (!emailId) {
                return {
                    success: false,
                    message: 'No email selected. Please select an email first or provide an emailId.',
                };
            }

            const email = store.emails.find(e => e.id === emailId);
            if (!email) {
                return {
                    success: false,
                    message: `Email not found with ID: ${emailId}`,
                };
            }

            const workflowMode = store.workflowMode || 'agile';
            const workflow = getWorkflow(workflowMode);
            const columns = getActiveColumns(workflowMode);
            const defaultStatus = columns[0]?.id || 'backlog';
            const status = (args.status as string) || defaultStatus;

            // Validate status
            const validColumn = workflow.columns.find(c => c.id === status);
            if (!validColumn) {
                const availableColumns = workflow.columns.map(c => `"${c.title}" (${c.id})`).join(', ');
                return {
                    success: false,
                    message: `Invalid status "${status}" for ${workflow.name} workflow. Available columns: ${availableColumns}.`,
                };
            }

            // Create task from email
            const taskInput: TaskCreateInput = {
                title: email.subject || 'Task from email',
                description: `From: ${email.fromName || email.fromAddress}\nDate: ${email.receivedAt}\n\n${email.bodyText || ''}`,
                status: status as Task['status'],
                priority: (args.priority as Task['priority']) || 'medium',
                tags: ['from-email'],
            };

            const task = await store.createTask(taskInput);
            if (!task) {
                return {
                    success: false,
                    message: 'Failed to create task from email. Please check if the database is initialized.',
                };
            }

            // Create entity mapping
            const db = getAdapter(store.config.storageMode);
            await db.createEntityMapping({
                userId: store.user?.id || 'local',
                sourceType: 'email',
                sourceId: emailId,
                targetType: 'task',
                targetId: task.id,
            });

            // Dispatch visual feedback
            dispatchNanocoderAction('create_task', {
                title: task.title,
                status: task.status,
                priority: task.priority,
            }, 'internal');

            const columnName = validColumn.title;
            return {
                success: true,
                message: `Created task "${task.title}" from email in ${columnName} column.`,
                data: { taskId: task.id, emailId, task },
            };
        },
    },

    {
        name: 'create_task_from_incident',
        description: 'Create a new task from an ITSM incident. Maps incident title and description to task fields.',
        parameters: {
            type: 'object',
            properties: {
                incidentId: {
                    type: 'string',
                    description: 'Optional incident ID. If not provided, uses the currently selected incident.',
                },
                status: {
                    type: 'string',
                    description: 'Initial status/column for the task. Defaults to todo or equivalent.',
                },
            },
        },
        execute: async (args) => {
            const store = useFluxStore.getState();
            const incidentId = (args.incidentId as string) || store.selectedIncidentId;
            
            if (!incidentId) {
                return {
                    success: false,
                    message: 'No incident selected. Please select an incident first or provide an incidentId.',
                };
            }

            const incidents = JSON.parse(localStorage.getItem('flux_incidents') || '[]');
            const incident = incidents.find((i: any) => i.id === incidentId);
            
            if (!incident) {
                return {
                    success: false,
                    message: `Incident not found with ID: ${incidentId}`,
                };
            }

            const workflowMode = store.workflowMode || 'agile';
            const workflow = getWorkflow(workflowMode);
            const columns = getActiveColumns(workflowMode);
            const defaultStatus = columns[0]?.id || 'todo';
            const status = (args.status as string) || defaultStatus;

            // Map incident severity to task priority
            const priorityMap: Record<string, Task['priority']> = {
                critical: 'urgent',
                high: 'high',
                medium: 'medium',
                low: 'low',
            };

            const taskInput: TaskCreateInput = {
                title: `[${incident.number}] ${incident.title}`,
                description: `Incident: ${incident.number}\nSeverity: ${incident.severity}\nCategory: ${incident.category}\n\n${incident.description || ''}`,
                status: status as Task['status'],
                priority: priorityMap[incident.severity] || 'medium',
                tags: ['from-incident', incident.category?.toLowerCase()].filter(Boolean),
            };

            const task = await store.createTask(taskInput);
            if (!task) {
                return {
                    success: false,
                    message: 'Failed to create task from incident.',
                };
            }

            // Create entity mapping
            const db = getAdapter(store.config.storageMode);
            await db.createEntityMapping({
                userId: store.user?.id || 'local',
                sourceType: 'incident',
                sourceId: incidentId,
                targetType: 'task',
                targetId: task.id,
            });

            dispatchNanocoderAction('create_task', {
                title: task.title,
                status: task.status,
                priority: task.priority,
            }, 'internal');

            return {
                success: true,
                message: `Created task "${task.title}" from incident ${incident.number}.`,
                data: { taskId: task.id, incidentId, task },
            };
        },
    },

    {
        name: 'create_incident_from_email',
        description: 'Create an ITSM incident from an email. Analyzes the email to suggest severity and category.',
        parameters: {
            type: 'object',
            properties: {
                emailId: {
                    type: 'string',
                    description: 'Optional email ID. If not provided, uses the currently selected email.',
                },
                severity: {
                    type: 'string',
                    description: 'Override severity (low, medium, high, critical). If not provided, suggests based on email content.',
                    enum: ['low', 'medium', 'high', 'critical'],
                },
                category: {
                    type: 'string',
                    description: 'Override category. If not provided, suggests based on email content.',
                    enum: ['Software', 'Hardware', 'Network', 'Security', 'General'],
                },
            },
        },
        execute: async (args) => {
            const store = useFluxStore.getState();
            const emailId = (args.emailId as string) || store.selectedEmailId;
            
            if (!emailId) {
                return {
                    success: false,
                    message: 'No email selected. Please select an email first or provide an emailId.',
                };
            }

            const email = store.emails.find(e => e.id === emailId);
            if (!email) {
                return {
                    success: false,
                    message: `Email not found with ID: ${emailId}`,
                };
            }

            // Simple heuristics for severity (in production, this would use AI)
            const content = `${email.subject} ${email.bodyText}`.toLowerCase();
            let severity = args.severity as string;
            if (!severity) {
                if (content.includes('urgent') || content.includes('critical') || content.includes('down') || content.includes('outage')) {
                    severity = 'critical';
                } else if (content.includes('important') || content.includes('asap') || content.includes('broken')) {
                    severity = 'high';
                } else if (content.includes('slow') || content.includes('issue') || content.includes('problem')) {
                    severity = 'medium';
                } else {
                    severity = 'low';
                }
            }

            // Simple category detection
            let category = args.category as string;
            if (!category) {
                if (content.includes('network') || content.includes('wifi') || content.includes('internet') || content.includes('vpn')) {
                    category = 'Network';
                } else if (content.includes('security') || content.includes('virus') || content.includes('hack') || content.includes('phishing')) {
                    category = 'Security';
                } else if (content.includes('hardware') || content.includes('printer') || content.includes('monitor') || content.includes('keyboard')) {
                    category = 'Hardware';
                } else if (content.includes('software') || content.includes('app') || content.includes('application') || content.includes('crash')) {
                    category = 'Software';
                } else {
                    category = 'General';
                }
            }

            // Create incident
            const incidents = JSON.parse(localStorage.getItem('flux_incidents') || '[]');
            const newIncident = {
                id: `inc-${Date.now()}`,
                number: `INC${Math.floor(Math.random() * 1000000).toString().padStart(7, '0')}`,
                title: email.subject || 'Incident from email',
                description: `Reported by: ${email.fromName || email.fromAddress}\nDate: ${email.receivedAt}\n\n${email.bodyText || ''}`,
                severity,
                urgency: severity === 'critical' ? 'high' : severity === 'high' ? 'medium' : 'low',
                impact: severity === 'critical' ? 'high' : severity === 'high' ? 'medium' : 'low',
                status: 'New',
                category,
                created: new Date().toISOString(),
                activeSLAs: [{
                    id: `sla-${Date.now()}`,
                    name: 'Response Time',
                    target: 60,
                    remaining: 60,
                    metric: 'response',
                    breached: false,
                    startTime: new Date().toISOString(),
                }],
                breachedSLAs: [],
                assignee: { id: 'unassigned', name: 'Unassigned', role: 'System' },
            };

            incidents.unshift(newIncident);
            localStorage.setItem('flux_incidents', JSON.stringify(incidents));

            // Create entity mapping
            const db = getAdapter(store.config.storageMode);
            await db.createEntityMapping({
                userId: store.user?.id || 'local',
                sourceType: 'email',
                sourceId: emailId,
                targetType: 'incident',
                targetId: newIncident.id,
            });

            return {
                success: true,
                message: `Created incident ${newIncident.number}: "${newIncident.title}" with ${severity} severity in ${category} category.`,
                data: newIncident,
            };
        },
    },

    // ==================
    // Incident Management Tools
    // ==================
    {
        name: 'create_incident',
        description: 'Create a new ITSM incident. Use when user reports an IT issue or wants to log an incident.',
        parameters: {
            type: 'object',
            properties: {
                title: {
                    type: 'string',
                    description: 'Brief title describing the incident',
                },
                description: {
                    type: 'string',
                    description: 'Detailed description of the incident',
                },
                severity: {
                    type: 'string',
                    description: 'Severity level',
                    enum: ['low', 'medium', 'high', 'critical'],
                },
                category: {
                    type: 'string',
                    description: 'Incident category',
                    enum: ['Software', 'Hardware', 'Network', 'Security', 'General'],
                },
            },
            required: ['title'],
        },
        execute: async (args) => {
            const title = args.title as string;
            const description = (args.description as string) || '';
            const severity = (args.severity as string) || 'medium';
            const category = (args.category as string) || 'General';

            const incidents = JSON.parse(localStorage.getItem('flux_incidents') || '[]');
            const newIncident = {
                id: `inc-${Date.now()}`,
                number: `INC${Math.floor(Math.random() * 1000000).toString().padStart(7, '0')}`,
                title,
                description,
                severity,
                urgency: severity === 'critical' ? 'high' : severity === 'high' ? 'medium' : 'low',
                impact: severity === 'critical' ? 'high' : severity === 'high' ? 'medium' : 'low',
                status: 'New',
                category,
                created: new Date().toISOString(),
                activeSLAs: [{
                    id: `sla-${Date.now()}`,
                    name: 'Response Time',
                    target: 60,
                    remaining: 60,
                    metric: 'response',
                    breached: false,
                    startTime: new Date().toISOString(),
                }],
                breachedSLAs: [],
                assignee: { id: 'unassigned', name: 'Unassigned', role: 'System' },
            };

            incidents.unshift(newIncident);
            localStorage.setItem('flux_incidents', JSON.stringify(incidents));

            return {
                success: true,
                message: `Created incident ${newIncident.number}: "${title}" with ${severity} severity.`,
                data: newIncident,
            };
        },
    },

    {
        name: 'update_incident',
        description: 'Update an existing incident\'s status, severity, or other fields.',
        parameters: {
            type: 'object',
            properties: {
                incidentId: {
                    type: 'string',
                    description: 'Incident ID or number to update',
                },
                status: {
                    type: 'string',
                    description: 'New status',
                    enum: ['New', 'In Progress', 'Pending', 'Resolved', 'Closed'],
                },
                severity: {
                    type: 'string',
                    description: 'New severity',
                    enum: ['low', 'medium', 'high', 'critical'],
                },
                assignee: {
                    type: 'string',
                    description: 'Name of the assignee',
                },
            },
            required: ['incidentId'],
        },
        execute: async (args) => {
            const incidentId = args.incidentId as string;
            const incidents = JSON.parse(localStorage.getItem('flux_incidents') || '[]');
            const index = incidents.findIndex((i: any) => 
                i.id === incidentId || i.number === incidentId
            );
            
            if (index === -1) {
                return {
                    success: false,
                    message: `Incident not found: ${incidentId}`,
                };
            }

            const updates: string[] = [];
            if (args.status) {
                incidents[index].status = args.status;
                updates.push(`status to ${args.status}`);
            }
            if (args.severity) {
                incidents[index].severity = args.severity;
                updates.push(`severity to ${args.severity}`);
            }
            if (args.assignee) {
                incidents[index].assignee = { id: 'assigned', name: args.assignee, role: 'Support' };
                updates.push(`assigned to ${args.assignee}`);
            }

            localStorage.setItem('flux_incidents', JSON.stringify(incidents));

            return {
                success: true,
                message: `Updated incident ${incidents[index].number}: ${updates.join(', ')}.`,
                data: incidents[index],
            };
        },
    },

    {
        name: 'resolve_incident',
        description: 'Mark an incident as resolved.',
        parameters: {
            type: 'object',
            properties: {
                incidentId: {
                    type: 'string',
                    description: 'Optional incident ID. Uses selected incident if not provided.',
                },
                resolution: {
                    type: 'string',
                    description: 'Resolution notes explaining how the incident was resolved',
                },
            },
        },
        execute: async (args) => {
            const store = useFluxStore.getState();
            const incidentId = (args.incidentId as string) || store.selectedIncidentId;
            
            if (!incidentId) {
                return {
                    success: false,
                    message: 'No incident specified. Please provide an incidentId or select an incident.',
                };
            }

            const incidents = JSON.parse(localStorage.getItem('flux_incidents') || '[]');
            const index = incidents.findIndex((i: any) => 
                i.id === incidentId || i.number === incidentId
            );
            
            if (index === -1) {
                return {
                    success: false,
                    message: `Incident not found: ${incidentId}`,
                };
            }

            incidents[index].status = 'Resolved';
            incidents[index].resolvedAt = new Date().toISOString();
            if (args.resolution) {
                incidents[index].resolution = args.resolution;
            }

            localStorage.setItem('flux_incidents', JSON.stringify(incidents));

            return {
                success: true,
                message: `Resolved incident ${incidents[index].number}: "${incidents[index].title}".`,
                data: incidents[index],
            };
        },
    },

    {
        name: 'list_incidents',
        description: 'List all incidents, optionally filtered by status or severity.',
        parameters: {
            type: 'object',
            properties: {
                status: {
                    type: 'string',
                    description: 'Filter by status',
                    enum: ['All', 'New', 'In Progress', 'Pending', 'Resolved'],
                },
                severity: {
                    type: 'string',
                    description: 'Filter by severity',
                    enum: ['low', 'medium', 'high', 'critical'],
                },
                limit: {
                    type: 'number',
                    description: 'Maximum number of incidents to return',
                },
            },
        },
        execute: async (args) => {
            let incidents = JSON.parse(localStorage.getItem('flux_incidents') || '[]');
            
            if (args.status && args.status !== 'All') {
                incidents = incidents.filter((i: any) => i.status === args.status);
            }
            if (args.severity) {
                incidents = incidents.filter((i: any) => i.severity === args.severity);
            }
            
            const limit = (args.limit as number) || 10;
            incidents = incidents.slice(0, limit);

            if (incidents.length === 0) {
                return {
                    success: true,
                    message: 'No incidents found matching the criteria.',
                    data: [],
                };
            }

            const summary = incidents.map((i: any) => 
                `• ${i.number}: ${i.title} [${i.severity}] - ${i.status}`
            ).join('\n');

            return {
                success: true,
                message: `Found ${incidents.length} incident(s):\n${summary}`,
                data: incidents,
            };
        },
    },

    // ==================
    // Email Management Tools
    // ==================
    {
        name: 'list_emails',
        description: 'List emails in a folder (default: inbox).',
        parameters: {
            type: 'object',
            properties: {
                folder: {
                    type: 'string',
                    description: 'Email folder',
                    enum: ['inbox', 'sent', 'draft', 'spam', 'trash', 'archive'],
                },
                limit: {
                    type: 'number',
                    description: 'Maximum number of emails to return',
                },
            },
        },
        execute: async (args) => {
            const store = useFluxStore.getState();
            const folder = (args.folder as string) || 'inbox';
            const limit = (args.limit as number) || 10;

            let emails = store.emails.filter(e => e.folder === folder);
            emails = emails.slice(0, limit);

            if (emails.length === 0) {
                return {
                    success: true,
                    message: `No emails in ${folder}.`,
                    data: [],
                };
            }

            const summary = emails.map(e => 
                `• ${e.isRead ? '' : '📬 '}${e.fromName || e.fromAddress}: ${e.subject}`
            ).join('\n');

            return {
                success: true,
                message: `${emails.length} email(s) in ${folder}:\n${summary}`,
                data: emails.map(e => ({
                    id: e.id,
                    from: e.fromName || e.fromAddress,
                    subject: e.subject,
                    receivedAt: e.receivedAt,
                    isRead: e.isRead,
                    isStarred: e.isStarred,
                })),
            };
        },
    },

    {
        name: 'search_emails',
        description: 'Search emails by subject, sender, or content.',
        parameters: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'Search query',
                },
                folder: {
                    type: 'string',
                    description: 'Limit search to folder',
                    enum: ['inbox', 'sent', 'draft', 'spam', 'trash', 'archive'],
                },
            },
            required: ['query'],
        },
        execute: async (args) => {
            const store = useFluxStore.getState();
            const query = (args.query as string).toLowerCase();
            const folder = args.folder as string;

            let emails = store.emails;
            if (folder) {
                emails = emails.filter(e => e.folder === folder);
            }

            const results = emails.filter(e => 
                e.subject?.toLowerCase().includes(query) ||
                e.fromAddress?.toLowerCase().includes(query) ||
                e.fromName?.toLowerCase().includes(query) ||
                e.bodyText?.toLowerCase().includes(query)
            ).slice(0, 10);

            if (results.length === 0) {
                return {
                    success: true,
                    message: `No emails found matching "${args.query}".`,
                    data: [],
                };
            }

            const summary = results.map(e => 
                `• ${e.fromName || e.fromAddress}: ${e.subject}`
            ).join('\n');

            return {
                success: true,
                message: `Found ${results.length} email(s) matching "${args.query}":\n${summary}`,
                data: results.map(e => ({
                    id: e.id,
                    from: e.fromName || e.fromAddress,
                    subject: e.subject,
                    receivedAt: e.receivedAt,
                })),
            };
        },
    },

    {
        name: 'mark_email_read',
        description: 'Mark an email as read or unread.',
        parameters: {
            type: 'object',
            properties: {
                emailId: {
                    type: 'string',
                    description: 'Email ID. If not provided, uses selected email.',
                },
                isRead: {
                    type: 'boolean',
                    description: 'true to mark as read, false to mark as unread',
                },
            },
        },
        execute: async (args) => {
            const store = useFluxStore.getState();
            const emailId = (args.emailId as string) || store.selectedEmailId;
            const isRead = args.isRead !== false;

            if (!emailId) {
                return {
                    success: false,
                    message: 'No email specified. Please provide an emailId or select an email.',
                };
            }

            const db = getAdapter(store.config.storageMode);
            const updated = await db.markEmailRead(emailId, isRead);

            if (!updated) {
                return {
                    success: false,
                    message: `Email not found: ${emailId}`,
                };
            }

            return {
                success: true,
                message: `Marked email as ${isRead ? 'read' : 'unread'}.`,
                data: updated,
            };
        },
    },

    {
        name: 'archive_email',
        description: 'Move an email to the archive folder.',
        parameters: {
            type: 'object',
            properties: {
                emailId: {
                    type: 'string',
                    description: 'Email ID. If not provided, uses selected email.',
                },
            },
        },
        execute: async (args) => {
            const store = useFluxStore.getState();
            const emailId = (args.emailId as string) || store.selectedEmailId;

            if (!emailId) {
                return {
                    success: false,
                    message: 'No email specified. Please provide an emailId or select an email.',
                };
            }

            const db = getAdapter(store.config.storageMode);
            const updated = await db.archiveEmail(emailId, true);

            if (!updated) {
                return {
                    success: false,
                    message: `Email not found: ${emailId}`,
                };
            }

            return {
                success: true,
                message: 'Email archived.',
                data: updated,
            };
        },
    },

    {
        name: 'star_email',
        description: 'Star or unstar an email.',
        parameters: {
            type: 'object',
            properties: {
                emailId: {
                    type: 'string',
                    description: 'Email ID. If not provided, uses selected email.',
                },
                isStarred: {
                    type: 'boolean',
                    description: 'true to star, false to unstar',
                },
            },
        },
        execute: async (args) => {
            const store = useFluxStore.getState();
            const emailId = (args.emailId as string) || store.selectedEmailId;
            const isStarred = args.isStarred !== false;

            if (!emailId) {
                return {
                    success: false,
                    message: 'No email specified. Please provide an emailId or select an email.',
                };
            }

            const db = getAdapter(store.config.storageMode);
            const updated = await db.markEmailStarred(emailId, isStarred);

            if (!updated) {
                return {
                    success: false,
                    message: `Email not found: ${emailId}`,
                };
            }

            return {
                success: true,
                message: `Email ${isStarred ? 'starred' : 'unstarred'}.`,
                data: updated,
            };
        },
    },

    // ==================
    // Sprint Management Tools
    // ==================
    {
        name: 'list_sprints',
        description: 'List all sprints.',
        parameters: {
            type: 'object',
            properties: {
                status: {
                    type: 'string',
                    description: 'Filter by status',
                    enum: ['planning', 'active', 'completed'],
                },
            },
        },
        execute: async () => {
            // For now, we have a single sprint in localStorage
            const sprintConfig = JSON.parse(localStorage.getItem('flux_sprint_config') || '{}');
            
            return {
                success: true,
                message: `Current sprint: ${sprintConfig.name || 'Sprint'} (${sprintConfig.daysRemaining || 0} days remaining)`,
                data: [sprintConfig],
            };
        },
    },

    {
        name: 'add_task_to_sprint',
        description: 'Add a task to the current sprint by moving it from backlog.',
        parameters: {
            type: 'object',
            properties: {
                taskTitle: {
                    type: 'string',
                    description: 'Title or partial title of the task to add',
                },
            },
            required: ['taskTitle'],
        },
        execute: async (args) => {
            const store = useFluxStore.getState();
            const searchTitle = (args.taskTitle as string).toLowerCase();
            
            const task = store.tasks.find(t => 
                t.title.toLowerCase().includes(searchTitle) && t.status === 'backlog'
            );

            if (!task) {
                const backlogTasks = store.tasks.filter(t => t.status === 'backlog');
                if (backlogTasks.length === 0) {
                    return {
                        success: false,
                        message: 'No tasks in backlog to add to sprint.',
                    };
                }
                return {
                    success: false,
                    message: `Task not found in backlog. Available backlog tasks: ${backlogTasks.slice(0, 5).map(t => t.title).join(', ')}`,
                };
            }

            // Move to todo/ready (sprint backlog)
            await store.updateTaskStatus(task.id, 'todo');

            return {
                success: true,
                message: `Added "${task.title}" to the current sprint.`,
                data: { taskId: task.id, taskTitle: task.title },
            };
        },
    },

    {
        name: 'remove_task_from_sprint',
        description: 'Remove a task from the sprint and move it back to backlog.',
        parameters: {
            type: 'object',
            properties: {
                taskTitle: {
                    type: 'string',
                    description: 'Title or partial title of the task to remove',
                },
            },
            required: ['taskTitle'],
        },
        execute: async (args) => {
            const store = useFluxStore.getState();
            const searchTitle = (args.taskTitle as string).toLowerCase();
            
            const task = store.tasks.find(t => 
                t.title.toLowerCase().includes(searchTitle) && 
                t.status !== 'backlog' && t.status !== 'done' && t.status !== 'archived'
            );

            if (!task) {
                return {
                    success: false,
                    message: `Task "${args.taskTitle}" not found in sprint.`,
                };
            }

            await store.updateTaskStatus(task.id, 'backlog');

            return {
                success: true,
                message: `Removed "${task.title}" from sprint and moved to backlog.`,
                data: { taskId: task.id, taskTitle: task.title },
            };
        },
    },

    {
        name: 'get_sprint_summary',
        description: 'Get summary statistics for the current sprint.',
        parameters: {
            type: 'object',
            properties: {},
        },
        execute: async () => {
            const sprintConfig = JSON.parse(localStorage.getItem('flux_sprint_config') || '{}');
            const store = useFluxStore.getState();
            const workflowMode = store.workflowMode || 'agile';
            const workflow = getWorkflow(workflowMode);
            
            // Count tasks by status
            const statusCounts: Record<string, number> = {};
            workflow.columns.forEach(col => {
                statusCounts[col.title] = store.tasks.filter(t => t.status === col.id).length;
            });

            const totalTasks = store.tasks.filter(t => t.status !== 'backlog' && t.status !== 'archived').length;
            const completedTasks = store.tasks.filter(t => 
                t.status === 'done' || t.status === 'resolved' || t.status === 'closed'
            ).length;
            const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            const summary = [
                `📊 Sprint Summary: ${sprintConfig.name || 'Current Sprint'}`,
                `Goal: ${sprintConfig.goal || '(No goal set)'}`,
                `Days Remaining: ${sprintConfig.daysRemaining || 0}`,
                ``,
                `Tasks: ${totalTasks} total, ${completedTasks} completed (${completionRate}%)`,
                ...Object.entries(statusCounts).map(([status, count]) => `  • ${status}: ${count}`),
            ].join('\n');

            return {
                success: true,
                message: summary,
                data: {
                    sprint: sprintConfig,
                    statusCounts,
                    totalTasks,
                    completedTasks,
                    completionRate,
                },
            };
        },
    },

    // ==================
    // Conversation Memory Tools
    // ==================
    {
        name: 'remember_context',
        description: 'Store context or a reference for later use. Use when user says "remember this" or you want to track something for later.',
        parameters: {
            type: 'object',
            properties: {
                key: {
                    type: 'string',
                    description: 'A short key to identify this context (e.g., "last_task", "important_email")',
                },
                value: {
                    type: 'string',
                    description: 'The value or description to remember',
                },
                entityType: {
                    type: 'string',
                    description: 'Type of entity being remembered',
                    enum: ['task', 'email', 'incident', 'project', 'other'],
                },
                entityId: {
                    type: 'string',
                    description: 'ID of the entity (if applicable)',
                },
            },
            required: ['key', 'value'],
        },
        execute: async (args) => {
            const key = args.key as string;
            const value = args.value as string;
            
            // Store in localStorage for now (would use DB in production)
            const memory = JSON.parse(localStorage.getItem('flux_agent_memory') || '{}');
            memory[key] = {
                value,
                entityType: args.entityType,
                entityId: args.entityId,
                timestamp: Date.now(),
            };
            localStorage.setItem('flux_agent_memory', JSON.stringify(memory));

            return {
                success: true,
                message: `Remembered "${key}": ${value}`,
                data: { key, value },
            };
        },
    },

    {
        name: 'recall_context',
        description: 'Recall previously stored context. Use when user refers to something saved earlier.',
        parameters: {
            type: 'object',
            properties: {
                key: {
                    type: 'string',
                    description: 'The key to recall',
                },
            },
            required: ['key'],
        },
        execute: async (args) => {
            const key = args.key as string;
            const memory = JSON.parse(localStorage.getItem('flux_agent_memory') || '{}');
            
            if (!memory[key]) {
                const availableKeys = Object.keys(memory);
                if (availableKeys.length === 0) {
                    return {
                        success: false,
                        message: 'No stored context found. Use remember_context to store something first.',
                    };
                }
                return {
                    success: false,
                    message: `No context found for "${key}". Available keys: ${availableKeys.join(', ')}`,
                };
            }

            return {
                success: true,
                message: `Recalled "${key}": ${memory[key].value}`,
                data: memory[key],
            };
        },
    },

    {
        name: 'get_recent_actions',
        description: 'Get a list of recent actions performed by the agent. Useful for context or debugging.',
        parameters: {
            type: 'object',
            properties: {
                limit: {
                    type: 'number',
                    description: 'Maximum number of actions to return (default: 5)',
                },
            },
        },
        execute: async (args) => {
            const limit = (args.limit as number) || 5;
            const logs = JSON.parse(localStorage.getItem('flux_agent_action_logs') || '[]');
            const recent = logs.slice(-limit).reverse();

            if (recent.length === 0) {
                return {
                    success: true,
                    message: 'No recent actions recorded.',
                    data: [],
                };
            }

            const summary = recent.map((log: any) => 
                `• ${log.actionType}: ${log.result?.success ? '✓' : '✗'} ${log.result?.message || ''}`
            ).join('\n');

            return {
                success: true,
                message: `Recent actions:\n${summary}`,
                data: recent,
            };
        },
    },
];

/**
 * Get workflow-aware tool definitions with context
 * This injects current workflow information into tool descriptions
 */
export function getToolDefinitions(workflowMode: WorkflowMode = 'agile'): ToolDefinition[] {
    const workflow = getWorkflow(workflowMode);
    const columns = workflow.columns;
    const columnNames = columns.map(c => `${c.id} (${c.title})`).join(', ');
    
    // Clone tools and enhance descriptions with workflow context
    return toolRegistry.map(tool => {
        const enhanced = { ...tool };
        
        // Add workflow context to relevant tools
        if (tool.name === 'create_task' || tool.name === 'update_task_status' || tool.name === 'move_task_to_column') {
            enhanced.description = `${tool.description} Current workflow: ${workflow.name}. Available columns: ${columnNames}.`;
        }
        
        return enhanced;
    });
}

/**
 * Get tool by name
 */
export function getTool(name: string): ToolDefinition | undefined {
    return toolRegistry.find(t => t.name === name);
}

/**
 * Execute a tool call
 */
export async function executeTool(call: ToolCall): Promise<ToolResult> {
    const tool = getTool(call.function);

    if (!tool) {
        return {
            success: false,
            message: `Unknown tool: ${call.function}`,
        };
    }

    try {
        return await tool.execute(call.arguments);
    } catch (error) {
        return {
            success: false,
            message: `Error executing ${call.function}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
}

/**
 * Get tool definitions in simplified format (for Gemini/Claude)
 * This uses the workflow-aware version but returns simplified format
 */
export function getToolDefinitionsSimple(workflowMode: WorkflowMode = 'agile') {
    return getToolDefinitions(workflowMode).map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
    }));
}
