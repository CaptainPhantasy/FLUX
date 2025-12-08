// =====================================
// FLUX - Common Field Definitions
// =====================================

import { getWorkflow, type WorkflowMode } from '@/lib/workflows';

export type FieldType = 'text' | 'textarea' | 'select' | 'priority' | 'status' | 'date' | 'tags' | 'assignee';
export type TriggerType = 'button' | 'form' | 'api' | 'modal';

export interface FieldDefinition {
    id: string;
    label: string;
    type: FieldType;
    required: boolean;
    description?: string;
    /** Static allowed values */
    allowedValues?: string[];
    /** Dynamic values based on workflow */
    getDynamicValues?: (workflow: WorkflowMode) => string[];
}

export interface ActionDefinition {
    id: string;
    name: string;
    description: string;
    trigger: TriggerType;
    toolName: string; // Maps to agent tool
    requiredFields: FieldDefinition[];
    optionalFields: FieldDefinition[];
    /** Preconditions that must be met */
    preconditions?: string[];
}

export interface ReadTarget {
    id: string;
    description: string;
    /** Fields that can be extracted from this target */
    fields: string[];
    /** Tool to read this target */
    toolName: string;
}

export interface PageMap {
    id: string;
    name: string;
    route: string;
    description: string;
    actions: ActionDefinition[];
    readTargets: ReadTarget[];
    /** Workflow modes this page supports */
    supportedWorkflows?: WorkflowMode[];
}

// ==================
// Common Field Definitions
// ==================

export const COMMON_FIELDS = {
    title: {
        id: 'title',
        label: 'Title',
        type: 'text' as FieldType,
        required: true,
        description: 'The title or name of the item',
    },
    description: {
        id: 'description',
        label: 'Description',
        type: 'textarea' as FieldType,
        required: false,
        description: 'Detailed description of the item',
    },
    priority: {
        id: 'priority',
        label: 'Priority',
        type: 'priority' as FieldType,
        required: false,
        allowedValues: ['low', 'medium', 'high', 'urgent'],
        description: 'Priority level (low, medium, high, urgent)',
    },
    status: {
        id: 'status',
        label: 'Status',
        type: 'status' as FieldType,
        required: false,
        description: 'Current status/column (depends on workflow)',
        getDynamicValues: (workflow: WorkflowMode) => {
            const wf = getWorkflow(workflow);
            return wf.columns.map(c => c.id);
        },
    },
    tags: {
        id: 'tags',
        label: 'Tags',
        type: 'tags' as FieldType,
        required: false,
        description: 'Comma-separated tags for categorization',
    },
    assignee: {
        id: 'assignee',
        label: 'Assignee',
        type: 'assignee' as FieldType,
        required: false,
        description: 'Person assigned to this item',
    },
    dueDate: {
        id: 'dueDate',
        label: 'Due Date',
        type: 'date' as FieldType,
        required: false,
        description: 'When this item is due',
    },
};

