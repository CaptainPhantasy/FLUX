// =====================================
// FLUX - Dynamic Workflow System
// Supports: Agile, CCaaS, IT/ITSM
// Last Updated: 14:30:00 Dec 07, 2025
// =====================================

export type WorkflowMode = 'agile' | 'ccaas' | 'itsm';

export interface WorkflowColumn {
    id: string;
    title: string;
    color: string;
    darkColor: string;
    category: 'backlog' | 'active' | 'review' | 'done';
}

export interface WorkflowConfig {
    id: WorkflowMode;
    name: string;
    description: string;
    icon: string;
    columns: WorkflowColumn[];
    priorities: { id: string; label: string; color: string }[];
    itemTypes: { id: string; label: string; icon: string }[];
}

// ==================
// AGILE SOFTWARE DEVELOPMENT
// ==================
export const AGILE_WORKFLOW: WorkflowConfig = {
    id: 'agile',
    name: 'Agile Development',
    description: 'Scrum/Kanban workflow for software teams',
    icon: 'Rocket',
    columns: [
        { id: 'backlog', title: 'Backlog', color: 'bg-[#F4F3EE] text-[#5A4A3F]', darkColor: 'dark:bg-[#2A2119] dark:text-[#E6D9CA]', category: 'backlog' },
        { id: 'ready', title: 'Ready', color: 'bg-[#F5E6D3] text-[#7A5530]', darkColor: 'dark:bg-[#3A2C21] dark:text-[#EAD9C7]', category: 'backlog' },
        { id: 'todo', title: 'Sprint Backlog', color: 'bg-orange-50 text-orange-700', darkColor: 'dark:bg-orange-900/25 dark:text-orange-300', category: 'active' },
        { id: 'in-progress', title: 'In Progress', color: 'bg-amber-50 text-amber-700', darkColor: 'dark:bg-amber-900/25 dark:text-amber-300', category: 'active' },
        { id: 'code-review', title: 'Code Review', color: 'bg-[#F3E8DC] text-[#8B5E3C]', darkColor: 'dark:bg-[#3B2D24] dark:text-[#EAD9C7]', category: 'review' },
        { id: 'testing', title: 'QA Testing', color: 'bg-[#EAE4DC] text-[#6B5647]', darkColor: 'dark:bg-[#2F2620] dark:text-[#D9CABB]', category: 'review' },
        { id: 'done', title: 'Done', color: 'bg-emerald-50 text-emerald-700', darkColor: 'dark:bg-emerald-900/30 dark:text-emerald-300', category: 'done' },
    ],
    priorities: [
        { id: 'low', label: 'Low', color: 'bg-emerald-100 text-emerald-700' },
        { id: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-700' },
        { id: 'high', label: 'High', color: 'bg-amber-100 text-amber-700' },
        { id: 'urgent', label: 'Critical', color: 'bg-rose-100 text-rose-700' },
    ],
    itemTypes: [
        { id: 'story', label: 'User Story', icon: 'BookOpen' },
        { id: 'task', label: 'Task', icon: 'CheckSquare' },
        { id: 'bug', label: 'Bug', icon: 'Bug' },
        { id: 'epic', label: 'Epic', icon: 'Layers' },
        { id: 'spike', label: 'Spike', icon: 'Zap' },
    ],
};

// ==================
// CONTACT CENTER (CCaaS)
// ==================
export const CCAAS_WORKFLOW: WorkflowConfig = {
    id: 'ccaas',
    name: 'Contact Center',
    description: 'Customer service ticket management',
    icon: 'Headphones',
    columns: [
        { id: 'new', title: 'New', color: 'bg-[#F5E6D3] text-[#7A5530]', darkColor: 'dark:bg-[#3A2C21] dark:text-[#EAD9C7]', category: 'backlog' },
        { id: 'queued', title: 'Queued', color: 'bg-[#F3E8DC] text-[#7A5530]', darkColor: 'dark:bg-[#33261D] dark:text-[#E6D9CA]', category: 'backlog' },
        { id: 'assigned', title: 'Assigned', color: 'bg-amber-50 text-amber-700', darkColor: 'dark:bg-amber-900/25 dark:text-amber-300', category: 'active' },
        { id: 'in-progress', title: 'In Progress', color: 'bg-orange-50 text-orange-700', darkColor: 'dark:bg-orange-900/25 dark:text-orange-300', category: 'active' },
        { id: 'pending-customer', title: 'Pending Customer', color: 'bg-[#EAE4DC] text-[#6B5647]', darkColor: 'dark:bg-[#2F2620] dark:text-[#D9CABB]', category: 'review' },
        { id: 'escalated', title: 'Escalated', color: 'bg-rose-50 text-rose-700', darkColor: 'dark:bg-rose-900/30 dark:text-rose-300', category: 'review' },
        { id: 'resolved', title: 'Resolved', color: 'bg-emerald-50 text-emerald-700', darkColor: 'dark:bg-emerald-900/30 dark:text-emerald-300', category: 'done' },
        { id: 'closed', title: 'Closed', color: 'bg-[#E8E1D8] text-[#5A4A3F]', darkColor: 'dark:bg-[#2A2119] dark:text-[#E6D9CA]', category: 'done' },
    ],
    priorities: [
        { id: 'low', label: 'Low', color: 'bg-emerald-100 text-emerald-700' },
        { id: 'medium', label: 'Normal', color: 'bg-blue-100 text-blue-700' },
        { id: 'high', label: 'High', color: 'bg-amber-100 text-amber-700' },
        { id: 'urgent', label: 'Urgent', color: 'bg-rose-100 text-rose-700' },
    ],
    itemTypes: [
        { id: 'inquiry', label: 'General Inquiry', icon: 'HelpCircle' },
        { id: 'complaint', label: 'Complaint', icon: 'AlertCircle' },
        { id: 'request', label: 'Service Request', icon: 'FileText' },
        { id: 'feedback', label: 'Feedback', icon: 'MessageSquare' },
        { id: 'callback', label: 'Callback Request', icon: 'Phone' },
    ],
};

// ==================
// IT SERVICE MANAGEMENT (ITSM)
// ==================
export const ITSM_WORKFLOW: WorkflowConfig = {
    id: 'itsm',
    name: 'IT Service Management',
    description: 'ITIL-aligned incident & change management',
    icon: 'Server',
    columns: [
        { id: 'new', title: 'New', color: 'bg-[#F5E6D3] text-[#7A5530]', darkColor: 'dark:bg-[#3A2C21] dark:text-[#EAD9C7]', category: 'backlog' },
        { id: 'triaged', title: 'Triaged', color: 'bg-[#F3E8DC] text-[#7A5530]', darkColor: 'dark:bg-[#33261D] dark:text-[#E6D9CA]', category: 'backlog' },
        { id: 'assigned', title: 'Assigned', color: 'bg-amber-50 text-amber-700', darkColor: 'dark:bg-amber-900/25 dark:text-amber-300', category: 'active' },
        { id: 'investigating', title: 'Investigating', color: 'bg-orange-50 text-orange-700', darkColor: 'dark:bg-orange-900/25 dark:text-orange-300', category: 'active' },
        { id: 'pending-vendor', title: 'Pending Vendor', color: 'bg-[#EAE4DC] text-[#6B5647]', darkColor: 'dark:bg-[#2F2620] dark:text-[#D9CABB]', category: 'review' },
        { id: 'pending-approval', title: 'Pending Approval', color: 'bg-[#E7D8CA] text-[#7A5530]', darkColor: 'dark:bg-[#3A2C21] dark:text-[#EAD9C7]', category: 'review' },
        { id: 'implementing', title: 'Implementing', color: 'bg-[#F0DFCF] text-[#7A5530]', darkColor: 'dark:bg-[#3B2D24] dark:text-[#E6D9CA]', category: 'active' },
        { id: 'resolved', title: 'Resolved', color: 'bg-emerald-50 text-emerald-700', darkColor: 'dark:bg-emerald-900/30 dark:text-emerald-300', category: 'done' },
        { id: 'closed', title: 'Closed', color: 'bg-[#E8E1D8] text-[#5A4A3F]', darkColor: 'dark:bg-[#2A2119] dark:text-[#E6D9CA]', category: 'done' },
    ],
    priorities: [
        { id: 'low', label: 'P4 - Low', color: 'bg-emerald-100 text-emerald-700' },
        { id: 'medium', label: 'P3 - Medium', color: 'bg-blue-100 text-blue-700' },
        { id: 'high', label: 'P2 - High', color: 'bg-amber-100 text-amber-700' },
        { id: 'urgent', label: 'P1 - Critical', color: 'bg-rose-100 text-rose-700' },
    ],
    itemTypes: [
        { id: 'incident', label: 'Incident', icon: 'AlertTriangle' },
        { id: 'service-request', label: 'Service Request', icon: 'FileText' },
        { id: 'change', label: 'Change Request', icon: 'RefreshCw' },
        { id: 'problem', label: 'Problem', icon: 'Search' },
        { id: 'task', label: 'Task', icon: 'CheckSquare' },
    ],
};

// ==================
// WORKFLOW REGISTRY
// ==================
export const WORKFLOWS: Record<WorkflowMode, WorkflowConfig> = {
    agile: AGILE_WORKFLOW,
    ccaas: CCAAS_WORKFLOW,
    itsm: ITSM_WORKFLOW,
};

export function getWorkflow(mode: WorkflowMode): WorkflowConfig {
    return WORKFLOWS[mode] || AGILE_WORKFLOW;
}

export function getColumnById(mode: WorkflowMode, columnId: string): WorkflowColumn | undefined {
    return WORKFLOWS[mode]?.columns.find(c => c.id === columnId);
}

export function getActiveColumns(mode: WorkflowMode): WorkflowColumn[] {
    return WORKFLOWS[mode]?.columns.filter(c => c.category !== 'done') || [];
}

export function mapStatusToWorkflow(status: string, targetMode: WorkflowMode): string {
    const workflow = WORKFLOWS[targetMode];
    const column = workflow.columns.find(c => c.id === status);
    if (column) return status;
    
    // Default mapping for common statuses
    if (status === 'todo' || status === 'new') return workflow.columns[0].id;
    if (status === 'in-progress' || status === 'investigating') {
        const activeCol = workflow.columns.find(c => c.category === 'active');
        return activeCol?.id || workflow.columns[0].id;
    }
    if (status === 'done' || status === 'resolved' || status === 'closed') {
        const doneCol = workflow.columns.find(c => c.category === 'done');
        return doneCol?.id || workflow.columns[workflow.columns.length - 1].id;
    }
    
    return workflow.columns[0].id;
}

// 14:30:00 Dec 07, 2025

