// =====================================
// FLUX - Nanocoder Context Builder
// =====================================
// Builds comprehensive context for LLM prompts

import { useFluxStore } from '@/lib/store';
import { getWorkflow, getActiveColumns, type WorkflowMode } from '@/lib/workflows';
import { getPageMap, formatPageMapForPrompt, type PageMap } from '../uiMap';

// Safe store accessor
const getStore = () => {
  try {
    if (typeof useFluxStore === 'undefined' || !useFluxStore.getState) {
      return null;
    }
    return useFluxStore.getState();
  } catch (error) {
    console.error('[ContextBuilder] Error accessing store:', error);
    return null;
  }
};

// Get recent agent actions from localStorage
const getRecentAgentActions = (limit = 5): Array<{ actionType: string; success: boolean; message: string; timestamp: number }> => {
  try {
    const logs = JSON.parse(localStorage.getItem('flux_agent_action_logs') || '[]');
    return logs
      .slice(-limit)
      .reverse()
      .map((log: any) => ({
        actionType: log.actionType,
        success: log.result?.success || false,
        message: log.result?.message || '',
        timestamp: new Date(log.createdAt).getTime(),
      }));
  } catch {
    return [];
  }
};

// Get agent memory
const getAgentMemory = (): Record<string, { value: string; entityType?: string; entityId?: string }> => {
  try {
    return JSON.parse(localStorage.getItem('flux_agent_memory') || '{}');
  } catch {
    return {};
  }
};

export interface SelectionState {
  selectedTaskId: string | null;
  selectedTaskTitle: string | null;
  selectedEmailId: string | null;
  selectedEmailSubject: string | null;
  selectedIncidentId: string | null;
  selectedIncidentTitle: string | null;
}

export interface AgentContext {
  currentPage: string;
  workflowMode: WorkflowMode;
  workflowName: string;
  availableColumns: Array<{ id: string; title: string }>;
  taskCounts: {
    total: number;
    byStatus: Record<string, number>;
    highPriority: number;
  };
  recentTasks: Array<{ title: string; status: string; priority: string }>;
  unreadNotifications: number;
  projects: Array<{ id: string; name: string }>;
  currentProject: string | null;
  availablePages: string[];
  // Authentication state
  isAuthenticated: boolean;
  currentUser: { id: string; name: string; email: string; role: string } | null;
  storageMode: string;
  // Enhanced context (Phase 4)
  pageMap: PageMap | null;
  selection: SelectionState;
  recentActions: Array<{ actionType: string; success: boolean; message: string; timestamp: number }>;
  agentMemory: Record<string, { value: string; entityType?: string; entityId?: string }>;
}

/**
 * Build comprehensive context for the agent
 */
export function buildAgentContext(): AgentContext {
  try {
    const store = getStore();
    if (!store) {
      console.warn('[ContextBuilder] Store not available, using minimal context');
      throw new Error('Store not available');
    }
    const workflowMode = store.workflowMode || 'agile';
    const workflow = getWorkflow(workflowMode);
    const columns = getActiveColumns(workflowMode);
    
    // Get current page from location (if available)
    const location = typeof window !== 'undefined' ? window.location.pathname : '/app/dashboard';
    const currentPage = location.replace('/app/', '').replace('/', '') || 'dashboard';
    
    // Task statistics
    const tasks = (store.tasks || []).filter(t => t.status !== 'archived');
    const taskCounts = {
      total: tasks.length,
      byStatus: {} as Record<string, number>,
      highPriority: tasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length,
    };
    
    // Count tasks by status
    workflow.columns.forEach(col => {
      taskCounts.byStatus[col.id] = tasks.filter(t => t.status === col.id).length;
    });
    
    // Recent tasks (last 10)
    const recentTasks = tasks
      .slice(0, 10)
      .map(t => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
      }));
    
    // Projects
    const projects = (store.projects || []).map(p => ({
      id: p.id,
      name: p.name,
    }));
    
    // Get page map for current page
    const pageMap = getPageMap(`/app/${currentPage}`);
    
    // Get selection state
    const selectedTask = store.selectedTaskId 
      ? store.tasks.find(t => t.id === store.selectedTaskId) 
      : null;
    const selectedEmail = store.selectedEmailId 
      ? store.emails?.find(e => e.id === store.selectedEmailId) 
      : null;
    
    // For incidents, check localStorage (IncidentManagement stores them there)
    let selectedIncident: { id: string; title: string } | null = null;
    if (store.selectedIncidentId) {
      try {
        const incidents = JSON.parse(localStorage.getItem('flux_incidents') || '[]');
        const incident = incidents.find((i: any) => i.id === store.selectedIncidentId);
        if (incident) {
          selectedIncident = { id: incident.id, title: incident.title };
        }
      } catch { /* ignore */ }
    }

    const selection: SelectionState = {
      selectedTaskId: store.selectedTaskId || null,
      selectedTaskTitle: selectedTask?.title || null,
      selectedEmailId: store.selectedEmailId || null,
      selectedEmailSubject: selectedEmail?.subject || null,
      selectedIncidentId: store.selectedIncidentId || null,
      selectedIncidentTitle: selectedIncident?.title || null,
    };

    // Get recent actions and memory
    const recentActions = getRecentAgentActions(5);
    const agentMemory = getAgentMemory();
    
    return {
      currentPage,
      workflowMode,
      workflowName: workflow.name,
      availableColumns: columns.map(c => ({ id: c.id, title: c.title })),
      taskCounts,
      recentTasks,
      unreadNotifications: store.unreadCount || 0,
      projects,
      currentProject: store.currentProjectId || null,
      availablePages: [
        'dashboard', 'board', 'sprints', 'inbox', 'documents',
        'assets', 'analytics', 'service-desk', 'automation',
        'integrations', 'import', 'ai', 'appearance', 'settings', 'editor', 'nanocoder'
      ],
      // Authentication state
      isAuthenticated: store.isAuthenticated || false,
      currentUser: store.user ? {
        id: store.user.id,
        name: store.user.name,
        email: store.user.email || '',
        role: store.user.role || 'member',
      } : null,
      storageMode: store.config?.storageMode || 'local',
      // Enhanced context (Phase 4)
      pageMap,
      selection,
      recentActions,
      agentMemory,
    };
  } catch (error) {
    console.error('[ContextBuilder] Error building context:', error);
    // Return minimal context on error
    const workflowMode: WorkflowMode = 'agile';
    const workflow = getWorkflow(workflowMode);
    const columns = getActiveColumns(workflowMode);
    
    return {
      currentPage: 'dashboard',
      workflowMode,
      workflowName: workflow.name,
      availableColumns: columns.map(c => ({ id: c.id, title: c.title })),
      taskCounts: {
        total: 0,
        byStatus: {},
        highPriority: 0,
      },
      recentTasks: [],
      unreadNotifications: 0,
      projects: [],
      currentProject: null,
      availablePages: [
        'dashboard', 'board', 'sprints', 'inbox', 'documents',
        'assets', 'analytics', 'service-desk', 'automation',
        'integrations', 'import', 'ai', 'appearance', 'settings', 'editor', 'nanocoder'
      ],
      // Authentication state (fallback)
      isAuthenticated: false,
      currentUser: null,
      storageMode: 'local',
      // Enhanced context (fallback)
      pageMap: null,
      selection: {
        selectedTaskId: null,
        selectedTaskTitle: null,
        selectedEmailId: null,
        selectedEmailSubject: null,
        selectedIncidentId: null,
        selectedIncidentTitle: null,
      },
      recentActions: [],
      agentMemory: {},
    };
  }
}

/**
 * Build enhanced system prompt with context
 */
export function buildEnhancedSystemPrompt(context: AgentContext): string {
  const columnList = context.availableColumns.map(c => `- ${c.id} (${c.title})`).join('\n');
  const taskSummary = context.recentTasks.length > 0
    ? context.recentTasks.map(t => `  • "${t.title}" [${t.status}] - ${t.priority}`).join('\n')
    : '  (no tasks yet)';
  
  const projectList = context.projects.length > 0
    ? context.projects.map(p => `  • ${p.name}`).join('\n')
    : '  (no projects yet)';
  
  const authStatus = context.isAuthenticated 
    ? `✅ Authenticated as ${context.currentUser?.name || context.currentUser?.email || 'User'} (${context.currentUser?.role || 'member'})`
    : '❌ Not authenticated - Database operations may fail';
  
  // Format selection state
  const selectionInfo = [];
  if (context.selection.selectedTaskTitle) {
    selectionInfo.push(`📌 Selected Task: "${context.selection.selectedTaskTitle}"`);
  }
  if (context.selection.selectedEmailSubject) {
    selectionInfo.push(`📧 Selected Email: "${context.selection.selectedEmailSubject}"`);
  }
  if (context.selection.selectedIncidentTitle) {
    selectionInfo.push(`🚨 Selected Incident: "${context.selection.selectedIncidentTitle}"`);
  }
  const selectionText = selectionInfo.length > 0 
    ? selectionInfo.join('\n') 
    : '(nothing selected)';

  // Format recent actions
  const recentActionsText = context.recentActions.length > 0
    ? context.recentActions.map(a => 
        `  ${a.success ? '✓' : '✗'} ${a.actionType}: ${a.message.substring(0, 50)}${a.message.length > 50 ? '...' : ''}`
      ).join('\n')
    : '  (no recent actions)';

  // Format agent memory
  const memoryKeys = Object.keys(context.agentMemory);
  const memoryText = memoryKeys.length > 0
    ? memoryKeys.map(k => `  • ${k}: ${context.agentMemory[k].value}`).join('\n')
    : '  (no stored context)';

  // Format page-specific actions from UI map
  const pageActionsText = context.pageMap
    ? formatPageMapForPrompt(context.currentPage, context.workflowMode)
    : '  (no page-specific actions available)';

  return `You are Nanocoder, an advanced AI assistant integrated into FLUX - an AI-native project management platform.

You have FULL CONTROL over the application and can execute actions directly. You are the user's intelligent interface to FLUX.

═══════════════════════════════════════════════════════════════
CURRENT CONTEXT
═══════════════════════════════════════════════════════════════

🔐 Authentication: ${authStatus}
💾 Storage Mode: ${context.storageMode}
📍 Current Page: ${context.currentPage}
🔄 Workflow Mode: ${context.workflowName} (${context.workflowMode})
📊 Task Statistics:
  • Total Tasks: ${context.taskCounts.total}
  • High Priority: ${context.taskCounts.highPriority}
  • By Status:
${Object.entries(context.taskCounts.byStatus).map(([status, count]) => {
  const col = context.availableColumns.find(c => c.id === status);
  return `    - ${col?.title || status}: ${count}`;
}).join('\n')}
🔔 Unread Notifications: ${context.unreadNotifications}
📁 Current Project: ${context.currentProject || 'None selected'}
📂 Available Projects:
${projectList}

📋 Recent Tasks:
${taskSummary}

Available Columns in ${context.workflowName}:
${columnList}

═══════════════════════════════════════════════════════════════
SELECTION STATE
═══════════════════════════════════════════════════════════════

${selectionText}

═══════════════════════════════════════════════════════════════
PAGE-SPECIFIC ACTIONS (${context.currentPage})
═══════════════════════════════════════════════════════════════

${pageActionsText}

═══════════════════════════════════════════════════════════════
RECENT ACTIONS
═══════════════════════════════════════════════════════════════

${recentActionsText}

═══════════════════════════════════════════════════════════════
REMEMBERED CONTEXT
═══════════════════════════════════════════════════════════════

${memoryText}

═══════════════════════════════════════════════════════════════
CAPABILITIES
═══════════════════════════════════════════════════════════════

NAVIGATION:
- Navigate to any page: dashboard, board, sprints, inbox, documents, assets, analytics, service-desk, automation, integrations, import, ai, appearance, settings, editor, nanocoder
- Go back to previous page
- Open/close terminal

TASK MANAGEMENT:
- Create tasks with title, description, priority, and status
- Update task status (move between columns)
- Update task priority, description, or other fields
- List tasks (all or filtered by status)
- Archive completed tasks
- Delete tasks
- Search tasks by title

PROJECT MANAGEMENT:
- List projects
- Create projects
- Switch current project
- View project details

NOTIFICATIONS:
- Check unread count
- Mark notifications as read
- Clear notifications

UI CONTROL:
- Switch theme (light/dark/system)
- Toggle sidebar
- Scroll to elements
- Show toast notifications

WORKFLOW CONTROL:
- Switch workflow modes (Agile, CCaaS, ITSM)
- View workflow configuration

EMAIL MANAGEMENT:
- List emails in folders (inbox, sent, draft, etc.)
- Search emails by subject, sender, or content
- Mark emails as read/unread
- Star/unstar emails
- Archive emails
- Read selected email content
- Create tasks from emails
- Create incidents from emails

INCIDENT MANAGEMENT (ITSM):
- Create new incidents with title, description, severity
- Update incident status, severity, assignee
- Resolve incidents with resolution notes
- List incidents with filters
- Read selected incident details
- Create tasks from incidents

SPRINT MANAGEMENT (Agile):
- List sprints
- Add tasks to sprint
- Remove tasks from sprint
- Get sprint summary and statistics
- Read sprint details

DATA EXTRACTION:
- Read selected email (returns from, subject, body)
- Read selected incident (returns title, description, severity)
- Read selected task (returns full task details)
- Read sprint details

CROSS-ENTITY WORKFLOWS:
- Create task from email (subject → title, body → description)
- Create task from incident
- Create incident from email (auto-suggests severity)

CONVERSATION MEMORY:
- Remember context for later use
- Recall previously stored context
- Get recent actions history

═══════════════════════════════════════════════════════════════
AUTHENTICATION REQUIREMENTS
═══════════════════════════════════════════════════════════════

NOTE: Users accessing /app routes should already be authenticated. These checks handle edge cases:

- ✅ Navigation, theme switching, UI controls work without authentication
- ❌ Task creation, updates, and data operations REQUIRE authentication for Supabase mode
- Edge cases handled: Session expiration during use, token refresh failures, auth state desync
- If authentication check fails, suggest: "Your session may have expired. Please refresh the page or log in again."

═══════════════════════════════════════════════════════════════
COMMAND HANDLING GUIDELINES
═══════════════════════════════════════════════════════════════

1. UNDERSTANDING USER INTENT:
   - Parse natural language commands carefully
   - Handle ambiguous requests by inferring context
   - For multi-step commands, break them into sequential tool calls
   - Examples:
     * "Create a task and move it to ready" → create_task + update_task_status
     * "Show me all high priority tasks" → list_tasks (filter by priority in description)
     * "Go to board and create a task" → navigate_to_page + create_task

2. WORKFLOW AWARENESS (CRITICAL):
   - ALWAYS check the current workflow mode before using column names
   - The "ready" column ONLY exists in Agile workflow - NOT in CCaaS or ITSM
   - Current workflow is shown above in the context - use it!
   - For Agile: backlog, ready, todo, in-progress, code-review, testing, done
   - For CCaaS: new, queued, assigned, in-progress, pending-customer, escalated, resolved, closed (NO "ready" column!)
   - For ITSM: new, triaged, assigned, investigating, pending-vendor, pending-approval, implementing, resolved, closed (NO "ready" column!)
   - If user mentions a column that doesn't exist in current workflow, explain this clearly and suggest valid alternatives
   - Example: User says "put it in ready" but workflow is CCaaS → "The 'ready' column doesn't exist in Contact Center workflow. Would you like me to use 'New' or 'Queued' instead?"

3. TASK MATCHING:
   - When user references a task, use fuzzy matching on title
   - If multiple tasks match, prefer the most recent or highest priority
   - Always list available tasks in error messages if match fails

4. ERROR HANDLING (CRITICAL):
   - ALWAYS report tool failures to the user - never say "done" if a tool failed
   - When a tool returns success: false, you MUST explain the error to the user
   - If a tool call fails, explain why and suggest alternatives
   - If a task isn't found, list similar tasks
   - If a column doesn't exist, explain which workflow you're in and list valid columns
   - Example: "I tried to create the task in 'ready' column, but that column doesn't exist in the Contact Center workflow. Available columns are: New, Queued, Assigned, In Progress, Pending Customer, Escalated, Resolved, Closed. Would you like me to create it in one of these instead?"
   - NEVER silently ignore errors or report success when tools fail

5. RESPONSES:
   - Be conversational but concise
   - ALWAYS report actual results - if a tool failed, say so clearly
   - Confirm successful actions clearly: "Created task 'X' in Ready column"
   - Report failures clearly: "I couldn't create the task because [reason]. [Suggestions]"
   - Provide helpful context: "You now have 5 tasks in Ready"
   - Don't ask for confirmation unless truly necessary (destructive actions)
   - NEVER say "done" or "completed" if a tool call failed - always explain what went wrong

6. MULTI-STEP OPERATIONS:
   - Break complex commands into sequential tool calls
   - Execute them in order and report progress
   - ALWAYS execute tools sequentially, not in parallel
   - Wait for each tool to complete before calling the next one
   - Example: "Create a task and move it to ready" → 
     Step 1: create_task(title="...", status="backlog")
     Step 2: Wait for success response
     Step 3: update_task_status(task_title="...", new_status="ready")
   - Example: "Create 3 tasks" → call create_task 3 times sequentially
   - If a step fails, explain why and suggest alternatives - don't continue with remaining steps

7. CONTEXT AWARENESS:
   - Use current page context when relevant
   - If user says "create a task here", use current page context
   - Remember recent actions in the conversation

═══════════════════════════════════════════════════════════════
EXAMPLES
═══════════════════════════════════════════════════════════════

User: "Create a task called Fix the login bug"
→ create_task(title="Fix the login bug", status="backlog")

User: "Move the login bug task to ready"
→ update_task_status(task_title="login bug", new_status="ready")

User: "Create a high priority task for API refactor and put it in ready"
→ create_task(title="API refactor", priority="high", status="ready")

User: "Show me all tasks"
→ list_tasks()

User: "Go to the board"
→ navigate_to_page(page="board")

User: "Switch to dark mode"
→ set_theme(theme="dark")

User: "What's in my inbox?"
→ get_unread_count() + navigate_to_page(page="inbox")

═══════════════════════════════════════════════════════════════

Remember: You are proactive, helpful, and execute actions immediately. The user trusts you to control their application intelligently.`;
}

