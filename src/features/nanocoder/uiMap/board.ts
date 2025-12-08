// =====================================
// FLUX - Board Page UI Map
// =====================================

import type { PageMap } from './common';
import { COMMON_FIELDS } from './common';

export const boardPageMap: PageMap = {
    id: 'board',
    name: 'Task Board',
    route: '/app/board',
    description: 'Kanban board for managing tasks/tickets/incidents across workflow columns',
    supportedWorkflows: ['agile', 'ccaas', 'itsm'],

    actions: [
        {
            id: 'create_task',
            name: 'Create Task',
            description: 'Create a new task/ticket/incident on the board',
            trigger: 'modal',
            toolName: 'create_task',
            requiredFields: [
                COMMON_FIELDS.title,
            ],
            optionalFields: [
                COMMON_FIELDS.description,
                COMMON_FIELDS.priority,
                COMMON_FIELDS.status,
                COMMON_FIELDS.tags,
                COMMON_FIELDS.assignee,
                COMMON_FIELDS.dueDate,
            ],
            preconditions: ['User must be authenticated'],
        },
        {
            id: 'move_task',
            name: 'Move Task',
            description: 'Move a task to a different column/status',
            trigger: 'api',
            toolName: 'update_task_status',
            requiredFields: [
                {
                    id: 'task_title',
                    label: 'Task Title',
                    type: 'text',
                    required: true,
                    description: 'Title or partial title of the task to move',
                },
                {
                    ...COMMON_FIELDS.status,
                    required: true,
                    id: 'new_status',
                    label: 'New Status',
                    description: 'The target column/status to move the task to',
                },
            ],
            optionalFields: [],
        },
        {
            id: 'edit_task',
            name: 'Edit Task',
            description: 'Update task details (title, description, priority, etc.)',
            trigger: 'modal',
            toolName: 'update_task',
            requiredFields: [
                {
                    id: 'task_title',
                    label: 'Task Title',
                    type: 'text',
                    required: true,
                    description: 'Title or partial title of the task to edit',
                },
            ],
            optionalFields: [
                { ...COMMON_FIELDS.title, id: 'new_title', label: 'New Title', required: false },
                COMMON_FIELDS.description,
                COMMON_FIELDS.priority,
                COMMON_FIELDS.status,
                COMMON_FIELDS.tags,
                COMMON_FIELDS.assignee,
                COMMON_FIELDS.dueDate,
            ],
        },
        {
            id: 'delete_task',
            name: 'Delete Task',
            description: 'Delete a task from the board',
            trigger: 'api',
            toolName: 'delete_task',
            requiredFields: [
                {
                    id: 'task_title',
                    label: 'Task Title',
                    type: 'text',
                    required: true,
                    description: 'Title or partial title of the task to delete',
                },
            ],
            optionalFields: [],
            preconditions: ['Confirmation required for destructive action'],
        },
        {
            id: 'list_tasks',
            name: 'List Tasks',
            description: 'List all tasks, optionally filtered by status or priority',
            trigger: 'api',
            toolName: 'list_tasks',
            requiredFields: [],
            optionalFields: [
                {
                    id: 'filter_status',
                    label: 'Filter by Status',
                    type: 'status',
                    required: false,
                    description: 'Only show tasks in this status/column',
                },
                {
                    id: 'filter_priority',
                    label: 'Filter by Priority',
                    type: 'priority',
                    required: false,
                    allowedValues: ['low', 'medium', 'high', 'urgent'],
                    description: 'Only show tasks with this priority',
                },
            ],
        },
        {
            id: 'archive_tasks',
            name: 'Archive Completed Tasks',
            description: 'Archive all tasks in the done/completed column',
            trigger: 'api',
            toolName: 'archive_completed_tasks',
            requiredFields: [],
            optionalFields: [],
        },
    ],

    readTargets: [
        {
            id: 'selected_task',
            description: 'Currently selected or focused task on the board',
            fields: ['title', 'description', 'status', 'priority', 'assignee', 'tags', 'dueDate', 'createdAt'],
            toolName: 'read_selected_task',
        },
        {
            id: 'task_by_title',
            description: 'Find and read a task by its title',
            fields: ['title', 'description', 'status', 'priority', 'assignee', 'tags', 'dueDate', 'createdAt'],
            toolName: 'get_task_details',
        },
    ],
};

