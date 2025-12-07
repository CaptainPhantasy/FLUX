// @ts-nocheck
// =====================================
// FLUX - AI Tool Registry
// =====================================
// Defines executable tools that the AI can call to control the UI

import { useFluxStore } from '@/lib/store';
import type { Task, TaskCreateInput, ToolCall } from '@/types';

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
        description: 'Create a new task in the project. Use this when the user wants to add a new task or todo item.',
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
                    description: 'Initial status of the task',
                    enum: ['todo', 'in-progress', 'review', 'done'],
                },
                tags: {
                    type: 'string',
                    description: 'Comma-separated tags for the task',
                },
            },
            required: ['title'],
        },
        execute: async (args) => {
            const input: TaskCreateInput = {
                title: args.title as string,
                description: args.description as string | undefined,
                priority: (args.priority as Task['priority']) || 'medium',
                status: (args.status as Task['status']) || 'todo',
                tags: args.tags ? (args.tags as string).split(',').map(t => t.trim()) : [],
            };

            const task = await useFluxStore.getState().createTask(input);

            if (task) {
                return {
                    success: true,
                    message: `Created task "${task.title}" with ${task.priority} priority`,
                    data: task,
                };
            }
            return { success: false, message: 'Failed to create task' };
        },
    },

    {
        name: 'update_task_status',
        description: 'Update the status of an existing task. Use when user wants to move a task to a different column or mark it as done.',
        parameters: {
            type: 'object',
            properties: {
                task_title: {
                    type: 'string',
                    description: 'The title of the task to update (partial match supported)',
                },
                new_status: {
                    type: 'string',
                    description: 'The new status to set',
                    enum: ['todo', 'in-progress', 'review', 'done', 'archived'],
                },
            },
            required: ['task_title', 'new_status'],
        },
        execute: async (args) => {
            const store = useFluxStore.getState();
            const tasks = store.tasks;
            const searchTitle = (args.task_title as string).toLowerCase();

            // Find task by partial title match
            const task = tasks.find(t =>
                t.title.toLowerCase().includes(searchTitle)
            );

            if (!task) {
                return {
                    success: false,
                    message: `Could not find a task matching "${args.task_title}"`
                };
            }

            await store.updateTaskStatus(task.id, args.new_status as Task['status']);

            return {
                success: true,
                message: `Updated "${task.title}" to ${args.new_status}`,
                data: { taskId: task.id, newStatus: args.new_status },
            };
        },
    },

    {
        name: 'list_tasks',
        description: 'List all tasks, optionally filtered by status. Use when user asks about their tasks or workload.',
        parameters: {
            type: 'object',
            properties: {
                status: {
                    type: 'string',
                    description: 'Optional status filter',
                    enum: ['todo', 'in-progress', 'review', 'done', 'all'],
                },
            },
        },
        execute: async (args) => {
            const tasks = useFluxStore.getState().tasks;
            const status = args.status as string;

            const filtered = status && status !== 'all'
                ? tasks.filter(t => t.status === status)
                : tasks.filter(t => t.status !== 'archived');

            const summary = filtered.map(t =>
                `• ${t.title} [${t.status}] - ${t.priority} priority`
            ).join('\n');

            return {
                success: true,
                message: filtered.length > 0
                    ? `Found ${filtered.length} task(s):\n${summary}`
                    : 'No tasks found',
                data: filtered,
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
    // Summary Tools
    // ==================
    {
        name: 'summarize_project',
        description: 'Get a summary of the current project status including task counts by status.',
        parameters: {
            type: 'object',
            properties: {},
        },
        execute: async () => {
            const { tasks, notifications, projects } = useFluxStore.getState();

            const activeTasks = tasks.filter(t => t.status !== 'archived');
            const statusCounts = {
                todo: activeTasks.filter(t => t.status === 'todo').length,
                'in-progress': activeTasks.filter(t => t.status === 'in-progress').length,
                review: activeTasks.filter(t => t.status === 'review').length,
                done: activeTasks.filter(t => t.status === 'done').length,
            };

            const highPriority = activeTasks.filter(t =>
                t.priority === 'high' || t.priority === 'urgent'
            ).length;

            const summary = [
                `📊 Project Summary`,
                ``,
                `Tasks: ${activeTasks.length} total`,
                `  • To Do: ${statusCounts.todo}`,
                `  • In Progress: ${statusCounts['in-progress']}`,
                `  • In Review: ${statusCounts.review}`,
                `  • Done: ${statusCounts.done}`,
                ``,
                `🔥 High Priority: ${highPriority} task(s)`,
                `📬 Notifications: ${notifications.filter(n => !n.isRead).length} unread`,
                `📁 Projects: ${projects.length}`,
            ].join('\n');

            return {
                success: true,
                message: summary,
                data: { statusCounts, highPriority, totalTasks: activeTasks.length },
            };
        },
    },
];

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
 * Get tool definitions for Gemini API
 */
export function getToolDefinitions() {
    return toolRegistry.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
    }));
}
