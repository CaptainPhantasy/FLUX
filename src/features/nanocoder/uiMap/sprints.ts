// =====================================
// FLUX - Sprints Page UI Map
// =====================================

import type { PageMap, FieldDefinition } from './common';
import { COMMON_FIELDS } from './common';

const sprintFields: Record<string, FieldDefinition> = {
    sprintId: {
        id: 'sprintId',
        label: 'Sprint ID',
        type: 'text',
        required: false,
        description: 'ID of the sprint (optional - uses current/active sprint if not provided)',
    },
    sprintName: {
        id: 'sprintName',
        label: 'Sprint Name',
        type: 'text',
        required: true,
        description: 'Name of the sprint',
    },
    goal: {
        id: 'goal',
        label: 'Sprint Goal',
        type: 'textarea',
        required: false,
        description: 'Goal or objective for this sprint',
    },
    duration: {
        id: 'duration',
        label: 'Duration (days)',
        type: 'text',
        required: false,
        description: 'Sprint duration in days',
    },
    taskTitle: {
        id: 'taskTitle',
        label: 'Task Title',
        type: 'text',
        required: true,
        description: 'Title or partial title of the task',
    },
};

export const sprintsPageMap: PageMap = {
    id: 'sprints',
    name: 'Sprint Planning',
    route: '/app/sprints',
    description: 'Sprint planning and management - organize tasks into sprints, track progress',
    supportedWorkflows: ['agile'],

    actions: [
        {
            id: 'create_sprint',
            name: 'Create Sprint',
            description: 'Create a new sprint',
            trigger: 'modal',
            toolName: 'create_sprint',
            requiredFields: [
                sprintFields.sprintName,
            ],
            optionalFields: [
                sprintFields.goal,
                sprintFields.duration,
                {
                    id: 'startDate',
                    label: 'Start Date',
                    type: 'date',
                    required: false,
                    description: 'When the sprint starts',
                },
            ],
        },
        {
            id: 'add_task_to_sprint',
            name: 'Add Task to Sprint',
            description: 'Add an existing task to a sprint',
            trigger: 'api',
            toolName: 'add_task_to_sprint',
            requiredFields: [
                sprintFields.taskTitle,
            ],
            optionalFields: [
                sprintFields.sprintId,
            ],
        },
        {
            id: 'remove_task_from_sprint',
            name: 'Remove Task from Sprint',
            description: 'Remove a task from a sprint (moves back to backlog)',
            trigger: 'api',
            toolName: 'remove_task_from_sprint',
            requiredFields: [
                sprintFields.taskTitle,
            ],
            optionalFields: [
                sprintFields.sprintId,
            ],
        },
        {
            id: 'start_sprint',
            name: 'Start Sprint',
            description: 'Start a sprint (marks it as active)',
            trigger: 'api',
            toolName: 'start_sprint',
            requiredFields: [],
            optionalFields: [
                sprintFields.sprintId,
            ],
            preconditions: ['Sprint must be in planning state', 'No other sprint can be active'],
        },
        {
            id: 'complete_sprint',
            name: 'Complete Sprint',
            description: 'Complete the current sprint',
            trigger: 'api',
            toolName: 'complete_sprint',
            requiredFields: [],
            optionalFields: [
                sprintFields.sprintId,
                {
                    id: 'moveIncomplete',
                    label: 'Move Incomplete Tasks',
                    type: 'select',
                    required: false,
                    allowedValues: ['next_sprint', 'backlog'],
                    description: 'Where to move incomplete tasks',
                },
            ],
        },
        {
            id: 'get_sprint_summary',
            name: 'Get Sprint Summary',
            description: 'Get summary and statistics for a sprint',
            trigger: 'api',
            toolName: 'get_sprint_summary',
            requiredFields: [],
            optionalFields: [
                sprintFields.sprintId,
            ],
        },
        {
            id: 'list_sprints',
            name: 'List Sprints',
            description: 'List all sprints',
            trigger: 'api',
            toolName: 'list_sprints',
            requiredFields: [],
            optionalFields: [
                {
                    id: 'filter_status',
                    label: 'Filter by Status',
                    type: 'select',
                    required: false,
                    allowedValues: ['planning', 'active', 'completed'],
                    description: 'Only show sprints with this status',
                },
            ],
        },
    ],

    readTargets: [
        {
            id: 'current_sprint',
            description: 'Currently active sprint',
            fields: ['name', 'goal', 'startDate', 'endDate', 'daysRemaining', 'taskCount', 'completedCount', 'status'],
            toolName: 'read_sprint_details',
        },
        {
            id: 'sprint_tasks',
            description: 'Tasks in the current sprint',
            fields: ['tasks (array of task objects)'],
            toolName: 'list_sprint_tasks',
        },
    ],
};

