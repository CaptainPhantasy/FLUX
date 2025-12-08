// =====================================
// FLUX - Inbox Page UI Map
// =====================================

import type { PageMap, FieldDefinition } from './common';

const emailFields: Record<string, FieldDefinition> = {
    emailId: {
        id: 'emailId',
        label: 'Email ID',
        type: 'text',
        required: false,
        description: 'ID of the email (optional - uses selected email if not provided)',
    },
    folder: {
        id: 'folder',
        label: 'Folder',
        type: 'select',
        required: false,
        allowedValues: ['inbox', 'sent', 'draft', 'spam', 'trash', 'archive'],
        description: 'Email folder to view',
    },
    searchQuery: {
        id: 'searchQuery',
        label: 'Search Query',
        type: 'text',
        required: false,
        description: 'Search term to find emails',
    },
};

export const inboxPageMap: PageMap = {
    id: 'inbox',
    name: 'Email Inbox',
    route: '/app/inbox',
    description: 'Email management - view, search, and manage emails. Can create tasks from emails.',

    actions: [
        {
            id: 'list_emails',
            name: 'List Emails',
            description: 'List emails in a folder (default: inbox)',
            trigger: 'api',
            toolName: 'list_emails',
            requiredFields: [],
            optionalFields: [
                emailFields.folder,
                {
                    id: 'limit',
                    label: 'Limit',
                    type: 'text',
                    required: false,
                    description: 'Maximum number of emails to return',
                },
            ],
        },
        {
            id: 'search_emails',
            name: 'Search Emails',
            description: 'Search emails by subject, sender, or content',
            trigger: 'api',
            toolName: 'search_emails',
            requiredFields: [
                {
                    id: 'query',
                    label: 'Search Query',
                    type: 'text',
                    required: true,
                    description: 'Search term (searches subject, sender, and body)',
                },
            ],
            optionalFields: [
                emailFields.folder,
            ],
        },
        {
            id: 'mark_email_read',
            name: 'Mark Email Read',
            description: 'Mark an email as read or unread',
            trigger: 'api',
            toolName: 'mark_email_read',
            requiredFields: [],
            optionalFields: [
                emailFields.emailId,
                {
                    id: 'isRead',
                    label: 'Mark as Read',
                    type: 'select',
                    required: false,
                    allowedValues: ['true', 'false'],
                    description: 'true to mark as read, false to mark as unread',
                },
            ],
        },
        {
            id: 'archive_email',
            name: 'Archive Email',
            description: 'Move an email to the archive folder',
            trigger: 'api',
            toolName: 'archive_email',
            requiredFields: [],
            optionalFields: [
                emailFields.emailId,
            ],
        },
        {
            id: 'star_email',
            name: 'Star Email',
            description: 'Star or unstar an email',
            trigger: 'api',
            toolName: 'star_email',
            requiredFields: [],
            optionalFields: [
                emailFields.emailId,
                {
                    id: 'isStarred',
                    label: 'Starred',
                    type: 'select',
                    required: false,
                    allowedValues: ['true', 'false'],
                    description: 'true to star, false to unstar',
                },
            ],
        },
        {
            id: 'create_task_from_email',
            name: 'Create Task from Email',
            description: 'Create a task using the email subject as title and body as description',
            trigger: 'api',
            toolName: 'create_task_from_email',
            requiredFields: [],
            optionalFields: [
                emailFields.emailId,
                {
                    id: 'status',
                    label: 'Status',
                    type: 'status',
                    required: false,
                    description: 'Initial status/column for the task',
                },
                {
                    id: 'priority',
                    label: 'Priority',
                    type: 'priority',
                    required: false,
                    allowedValues: ['low', 'medium', 'high', 'urgent'],
                    description: 'Priority for the new task',
                },
            ],
            preconditions: ['Email must be selected or emailId provided'],
        },
        {
            id: 'create_incident_from_email',
            name: 'Create Incident from Email',
            description: 'Create an ITSM incident from an email (uses AI to determine severity)',
            trigger: 'api',
            toolName: 'create_incident_from_email',
            requiredFields: [],
            optionalFields: [
                emailFields.emailId,
                {
                    id: 'severity',
                    label: 'Severity',
                    type: 'select',
                    required: false,
                    allowedValues: ['low', 'medium', 'high', 'critical'],
                    description: 'Override the AI-suggested severity',
                },
            ],
            preconditions: ['Email must be selected or emailId provided'],
        },
    ],

    readTargets: [
        {
            id: 'selected_email',
            description: 'Currently selected email in the inbox',
            fields: ['from', 'fromName', 'to', 'subject', 'body', 'receivedAt', 'attachments', 'labels', 'isRead', 'isStarred'],
            toolName: 'read_selected_email',
        },
    ],
};

