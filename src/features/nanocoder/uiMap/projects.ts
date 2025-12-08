// =====================================
// FLUX - Projects Page UI Map
// =====================================

import type { PageMap, FieldDefinition } from './common';

const projectFields: Record<string, FieldDefinition> = {
    projectId: {
        id: 'projectId',
        label: 'Project ID',
        type: 'text',
        required: false,
        description: 'ID of the project (optional - uses current project if not provided)',
    },
    projectName: {
        id: 'projectName',
        label: 'Project Name',
        type: 'text',
        required: true,
        description: 'Name of the project',
    },
    description: {
        id: 'description',
        label: 'Description',
        type: 'textarea',
        required: false,
        description: 'Description of the project',
    },
    color: {
        id: 'color',
        label: 'Color',
        type: 'text',
        required: false,
        description: 'Color for the project (hex code or color name)',
    },
};

export const projectsPageMap: PageMap = {
    id: 'projects',
    name: 'Projects',
    route: '/app/projects',
    description: 'Project management - create, select, and manage projects',

    actions: [
        {
            id: 'create_project',
            name: 'Create Project',
            description: 'Create a new project',
            trigger: 'modal',
            toolName: 'create_project',
            requiredFields: [
                projectFields.projectName,
            ],
            optionalFields: [
                projectFields.description,
                projectFields.color,
            ],
        },
        {
            id: 'select_project',
            name: 'Select Project',
            description: 'Switch to a different project',
            trigger: 'api',
            toolName: 'set_current_project',
            requiredFields: [
                {
                    ...projectFields.projectName,
                    required: true,
                    description: 'Name or partial name of the project to select',
                },
            ],
            optionalFields: [],
        },
        {
            id: 'update_project',
            name: 'Update Project',
            description: 'Update project details',
            trigger: 'modal',
            toolName: 'update_project',
            requiredFields: [],
            optionalFields: [
                projectFields.projectId,
                { ...projectFields.projectName, id: 'new_name', label: 'New Name', required: false },
                projectFields.description,
                projectFields.color,
            ],
        },
        {
            id: 'archive_project',
            name: 'Archive Project',
            description: 'Archive a project',
            trigger: 'api',
            toolName: 'archive_project',
            requiredFields: [],
            optionalFields: [
                projectFields.projectId,
            ],
            preconditions: ['Confirmation required for destructive action'],
        },
        {
            id: 'list_projects',
            name: 'List Projects',
            description: 'List all projects',
            trigger: 'api',
            toolName: 'list_projects',
            requiredFields: [],
            optionalFields: [],
        },
    ],

    readTargets: [
        {
            id: 'current_project',
            description: 'Currently selected project',
            fields: ['name', 'description', 'color', 'taskCount', 'memberCount', 'createdAt'],
            toolName: 'get_project_details',
        },
        {
            id: 'project_summary',
            description: 'Summary statistics for the current project',
            fields: ['totalTasks', 'tasksByStatus', 'tasksByPriority', 'recentActivity'],
            toolName: 'summarize_project',
        },
    ],
};

