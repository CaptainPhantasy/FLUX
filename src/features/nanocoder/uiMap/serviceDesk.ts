// =====================================
// FLUX - Service Desk (ITSM) Page UI Map
// =====================================

import type { PageMap, FieldDefinition } from './common';

const incidentFields: Record<string, FieldDefinition> = {
    incidentId: {
        id: 'incidentId',
        label: 'Incident ID',
        type: 'text',
        required: false,
        description: 'ID of the incident (optional - uses selected incident if not provided)',
    },
    title: {
        id: 'title',
        label: 'Title',
        type: 'text',
        required: true,
        description: 'Brief title describing the incident',
    },
    description: {
        id: 'description',
        label: 'Description',
        type: 'textarea',
        required: false,
        description: 'Detailed description of the incident',
    },
    severity: {
        id: 'severity',
        label: 'Severity',
        type: 'select',
        required: false,
        allowedValues: ['low', 'medium', 'high', 'critical'],
        description: 'Severity level of the incident',
    },
    urgency: {
        id: 'urgency',
        label: 'Urgency',
        type: 'select',
        required: false,
        allowedValues: ['low', 'medium', 'high'],
        description: 'How urgently the incident needs to be addressed',
    },
    impact: {
        id: 'impact',
        label: 'Impact',
        type: 'select',
        required: false,
        allowedValues: ['low', 'medium', 'high'],
        description: 'Business impact of the incident',
    },
    category: {
        id: 'category',
        label: 'Category',
        type: 'select',
        required: false,
        allowedValues: ['Software', 'Hardware', 'Network', 'Security', 'General'],
        description: 'Category of the incident',
    },
    status: {
        id: 'status',
        label: 'Status',
        type: 'select',
        required: false,
        allowedValues: ['New', 'In Progress', 'Pending', 'Resolved', 'Closed'],
        description: 'Current status of the incident',
    },
};

export const serviceDeskPageMap: PageMap = {
    id: 'service-desk',
    name: 'IT Service Desk',
    route: '/app/service-desk',
    description: 'ITSM incident management - create, track, and resolve IT incidents',
    supportedWorkflows: ['itsm'],

    actions: [
        {
            id: 'create_incident',
            name: 'Create Incident',
            description: 'Create a new IT incident',
            trigger: 'modal',
            toolName: 'create_incident',
            requiredFields: [
                incidentFields.title,
            ],
            optionalFields: [
                incidentFields.description,
                incidentFields.severity,
                incidentFields.urgency,
                incidentFields.impact,
                incidentFields.category,
            ],
        },
        {
            id: 'update_incident',
            name: 'Update Incident',
            description: 'Update incident details or status',
            trigger: 'api',
            toolName: 'update_incident',
            requiredFields: [
                {
                    ...incidentFields.incidentId,
                    required: true,
                    description: 'ID or title of the incident to update',
                },
            ],
            optionalFields: [
                { ...incidentFields.title, id: 'new_title', label: 'New Title', required: false },
                incidentFields.description,
                incidentFields.severity,
                incidentFields.urgency,
                incidentFields.impact,
                incidentFields.category,
                incidentFields.status,
            ],
        },
        {
            id: 'resolve_incident',
            name: 'Resolve Incident',
            description: 'Mark an incident as resolved',
            trigger: 'api',
            toolName: 'resolve_incident',
            requiredFields: [],
            optionalFields: [
                incidentFields.incidentId,
                {
                    id: 'resolution',
                    label: 'Resolution Notes',
                    type: 'textarea',
                    required: false,
                    description: 'Notes about how the incident was resolved',
                },
            ],
        },
        {
            id: 'list_incidents',
            name: 'List Incidents',
            description: 'List all incidents, optionally filtered',
            trigger: 'api',
            toolName: 'list_incidents',
            requiredFields: [],
            optionalFields: [
                {
                    id: 'filter_status',
                    label: 'Filter by Status',
                    type: 'select',
                    required: false,
                    allowedValues: ['All', 'New', 'In Progress', 'Pending', 'Resolved'],
                    description: 'Only show incidents with this status',
                },
                {
                    id: 'filter_severity',
                    label: 'Filter by Severity',
                    type: 'select',
                    required: false,
                    allowedValues: ['low', 'medium', 'high', 'critical'],
                    description: 'Only show incidents with this severity',
                },
            ],
        },
        {
            id: 'create_task_from_incident',
            name: 'Create Task from Incident',
            description: 'Create a task on the board from an incident',
            trigger: 'api',
            toolName: 'create_task_from_incident',
            requiredFields: [],
            optionalFields: [
                incidentFields.incidentId,
                {
                    id: 'status',
                    label: 'Task Status',
                    type: 'status',
                    required: false,
                    description: 'Initial status for the created task',
                },
            ],
            preconditions: ['Incident must be selected or incidentId provided'],
        },
    ],

    readTargets: [
        {
            id: 'selected_incident',
            description: 'Currently selected incident in the service desk',
            fields: ['id', 'number', 'title', 'description', 'severity', 'urgency', 'impact', 'status', 'category', 'assignee', 'created', 'activeSLAs'],
            toolName: 'read_selected_incident',
        },
    ],
};

