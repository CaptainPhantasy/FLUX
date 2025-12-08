// =====================================
// FLUX - Nanocoder UI Map System
// =====================================
// Structured map of pages, actions, controls, and required fields
// Used by the agent to understand what's possible on each page

import type { WorkflowMode } from '@/lib/workflows';

// Re-export types and common fields from common.ts
export {
    COMMON_FIELDS,
    type FieldType,
    type TriggerType,
    type FieldDefinition,
    type ActionDefinition,
    type ReadTarget,
    type PageMap,
} from './common';

// Import types for use in this file
import type { PageMap, ActionDefinition, FieldDefinition, ReadTarget } from './common';

// ==================
// Page Map Registry
// ==================

import { boardPageMap } from './board';
import { inboxPageMap } from './inbox';
import { serviceDeskPageMap } from './serviceDesk';
import { sprintsPageMap } from './sprints';
import { projectsPageMap } from './projects';

export const PAGE_MAPS: Record<string, PageMap> = {
    board: boardPageMap,
    inbox: inboxPageMap,
    'service-desk': serviceDeskPageMap,
    sprints: sprintsPageMap,
    projects: projectsPageMap,
};

// ==================
// Helper Functions
// ==================

/**
 * Get the page map for a given route
 */
export function getPageMap(route: string): PageMap | null {
    // Extract page id from route (e.g., '/app/board' -> 'board')
    const pageId = route.replace(/^\/app\//, '').split('/')[0];
    return PAGE_MAPS[pageId] || null;
}

/**
 * Get available actions for a page
 */
export function getPageActions(pageId: string): ActionDefinition[] {
    const pageMap = PAGE_MAPS[pageId];
    return pageMap?.actions || [];
}

/**
 * Get read targets for a page
 */
export function getPageReadTargets(pageId: string): ReadTarget[] {
    const pageMap = PAGE_MAPS[pageId];
    return pageMap?.readTargets || [];
}

/**
 * Get all fields for an action, with dynamic values resolved
 */
export function getActionFields(
    action: ActionDefinition,
    workflow: WorkflowMode
): { required: FieldDefinition[]; optional: FieldDefinition[] } {
    const resolveField = (field: FieldDefinition): FieldDefinition => {
        if (field.getDynamicValues) {
            return {
                ...field,
                allowedValues: field.getDynamicValues(workflow),
            };
        }
        return field;
    };

    return {
        required: action.requiredFields.map(resolveField),
        optional: action.optionalFields.map(resolveField),
    };
}

/**
 * Format page map for inclusion in system prompt
 */
export function formatPageMapForPrompt(pageId: string, workflow: WorkflowMode): string {
    const pageMap = PAGE_MAPS[pageId];
    if (!pageMap) return '';

    const lines: string[] = [
        `Page: ${pageMap.name}`,
        `Description: ${pageMap.description}`,
        '',
        'Available Actions:',
    ];

    for (const action of pageMap.actions) {
        const fields = getActionFields(action, workflow);
        lines.push(`  - ${action.name}: ${action.description}`);
        lines.push(`    Tool: ${action.toolName}`);
        
        if (fields.required.length > 0) {
            lines.push(`    Required fields:`);
            for (const field of fields.required) {
                const values = field.allowedValues ? ` (${field.allowedValues.join(', ')})` : '';
                lines.push(`      * ${field.label}${values}`);
            }
        }
        
        if (fields.optional.length > 0) {
            lines.push(`    Optional fields:`);
            for (const field of fields.optional) {
                const values = field.allowedValues ? ` (${field.allowedValues.join(', ')})` : '';
                lines.push(`      * ${field.label}${values}`);
            }
        }
    }

    if (pageMap.readTargets.length > 0) {
        lines.push('');
        lines.push('Readable Data:');
        for (const target of pageMap.readTargets) {
            lines.push(`  - ${target.description}`);
            lines.push(`    Tool: ${target.toolName}`);
            lines.push(`    Fields: ${target.fields.join(', ')}`);
        }
    }

    return lines.join('\n');
}

export { boardPageMap } from './board';
export { inboxPageMap } from './inbox';
export { serviceDeskPageMap } from './serviceDesk';
export { sprintsPageMap } from './sprints';
export { projectsPageMap } from './projects';

