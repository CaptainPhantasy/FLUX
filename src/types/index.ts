// =====================================
// FLUX - Type Definitions
// Last Updated: 21:11:22 Dec 06, 2025
// =====================================

// Navigation
export type ViewType = 'dashboard' | 'board' | 'timeline' | 'settings';

// Chat & Terminal
export type Role = 'user' | 'agent';
export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
}
export interface TerminalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuery: (query: string) => void;
  history: Message[];
  isThinking?: boolean;
}

// Tasks - Dynamic Workflow Statuses
// Supports Agile, CCaaS (Contact Center), and ITSM workflows
export type TaskStatus = 
  // Agile Workflow
  | 'backlog'         // Product backlog - not yet refined
  | 'ready'           // Refined, ready for sprint
  | 'todo'            // In sprint, not started
  | 'in-progress'     // Actively being worked on
  | 'code-review'     // Code submitted for peer review
  | 'testing'         // In QA/testing phase
  | 'done'            // Completed and accepted
  | 'archived'        // Archived/closed
  // CCaaS (Contact Center) Workflow
  | 'new'             // New ticket
  | 'queued'          // In queue
  | 'assigned'        // Assigned to agent
  | 'pending-customer'// Waiting for customer response
  | 'escalated'       // Escalated to supervisor
  | 'resolved'        // Issue resolved
  | 'closed'          // Ticket closed
  // ITSM Workflow
  | 'triaged'         // Triaged by support
  | 'investigating'   // Under investigation
  | 'pending-vendor'  // Waiting on vendor
  | 'pending-approval'// Awaiting approval
  | 'implementing';   // Implementation in progress

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: string;
  tags?: string[];
  dueDate?: string;
  projectId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskCreateInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: string;
  tags?: string[];
  dueDate?: string;
  projectId?: string;
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: string;
  tags?: string[];
  dueDate?: string;
}

export interface Column {
  id: string;
  title: string;
  status: Task['status'];
}

// Tool Calls (AI Integration)
export interface ToolCall {
  id: string;
  function: string;
  arguments: Record<string, unknown>;
}

// Issues (Agile/ITSM)
export interface Issue {
  id: string;
  key: string;
  title: string;
  description: string;
  type: 'story' | 'bug' | 'task' | 'epic' | 'incident';
  status: string;
  priority: TaskPriority;
  assignee?: string;
  reporter?: string;
  storyPoints?: number;
  sprintId?: string;
  labels?: string[];
  createdAt: string;
  updatedAt: string;
}

// Sprints
export interface Sprint {
  id: string;
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'active' | 'completed';
  issues: SprintIssue[];
}

export interface SprintIssue extends Issue {
  order: number;
}

export interface BurndownData {
  date: string;
  ideal: number;
  actual: number;
}

export interface VelocityData {
  sprintName: string;
  completed: number;
  committed: number;
}

// Incidents (ITSM)
export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  assignee?: string;
  createdAt: string;
  resolvedAt?: string;
  slaDeadline?: string;
}

// Change Management
export type ChangeStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'implementing' | 'completed';

export interface ChangeRequest {
  id: string;
  title: string;
  description: string;
  status: ChangeStatus;
  type: 'standard' | 'normal' | 'emergency';
  risk: 'low' | 'medium' | 'high';
  requestor: string;
  approvers: string[];
  scheduledDate?: string;
  createdAt: string;
}

// SLA
export interface SLA {
  id: string;
  name: string;
  targetResponseTime: number; // minutes
  targetResolutionTime: number; // minutes
  priority: TaskPriority;
  currentCompliance: number; // percentage
}

// Automation
export type TriggerType = 'status_change' | 'field_update' | 'time_based' | 'manual';
export type ActionType = 'update_field' | 'send_notification' | 'create_task' | 'assign_user';
export type ConditionOperator = 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';

export interface Trigger {
  type: TriggerType;
  config: Record<string, unknown>;
}

export interface Condition {
  field: string;
  operator: ConditionOperator;
  value: string | number | boolean;
}

export interface Action {
  type: ActionType;
  config: Record<string, unknown>;
}

export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  trigger: Trigger;
  conditions: Condition[];
  actions: Action[];
  isActive: boolean;
}

// Workflows
export interface Status {
  id: string;
  name: string;
  color: string;
  category: 'todo' | 'in-progress' | 'done';
}

export interface Transition {
  id: string;
  name: string;
  from: string;
  to: string;
  conditions?: Condition[];
}

export interface Workflow {
  id: string;
  name: string;
  statuses: Status[];
  transitions: Transition[];
  isDefault: boolean;
}

export interface AIAnalysisResult {
  suggestions: string[];
  issues: string[];
  score: number;
}

// Custom Fields
export type FieldType = 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'user' | 'checkbox';

export interface CustomField {
  id: string;
  name: string;
  type: FieldType;
  options?: string[];
  required: boolean;
  defaultValue?: unknown;
}

// Comments
export interface Comment {
  id: string;
  content: string;
  author: string;
  authorAvatar?: string;
  createdAt: string;
  updatedAt?: string;
  reactions?: Record<string, number>;
}

// Editor
export interface EditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

// Import Wizard
export type ImportSource = 'jira' | 'asana' | 'trello' | 'monday' | 'linear' | 'csv';

export enum WizardStep {
  SOURCE = 0,
  AUTH = 1,
  MAPPING = 2,
  IMPORT = 3,
}

export interface ImportState {
  source: ImportSource | null;
  apiKey?: string;
  mappings?: Record<string, string>;
  step?: WizardStep;
  credentials?: Record<string, string>;
  mapping?: Record<string, string>;
  progress?: number;
  error?: string;
}

export const MOCK_SOURCE_STATUSES = ['To Do', 'In Progress', 'Done', 'Blocked'];

// Dynamic status lists for each workflow mode
export const AGILE_STATUSES = ['backlog', 'ready', 'todo', 'in-progress', 'code-review', 'testing', 'done'];
export const CCAAS_STATUSES = ['new', 'queued', 'assigned', 'in-progress', 'pending-customer', 'escalated', 'resolved', 'closed'];
export const ITSM_STATUSES = ['new', 'triaged', 'assigned', 'investigating', 'pending-vendor', 'pending-approval', 'implementing', 'resolved', 'closed'];

// Default export for backwards compatibility
export const FLUX_STATUSES = AGILE_STATUSES;

// Assets
export type FileType = 'pdf' | 'image' | 'code' | 'video' | 'sheet' | 'folder' | 'unknown';
export interface Asset {
  id: string;
  name: string;
  type: FileType;
  size: string;
  updatedAt: string;
  owner: {
    name: string;
    avatarUrl: string;
  };
}

// Integrations
export enum Category {
  ALL = 'All',
  COMMUNICATION = 'Communication',
  DEV_TOOLS = 'Dev Tools',
  DESIGN = 'Design',
  IMPORT = 'Import',
}

export interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: Category;
  brandColor: string;
  isConnected: boolean;
  type?: string;
}

export type ModalState = {
  type: 'connect' | 'settings' | null;
  integrationId: string | null;
};

// User & Auth
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member' | 'viewer';
  avatar?: string;
  preferences?: Record<string, unknown>;
}

// Projects
export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  ownerId: string;
  createdAt: string;
}

// Notifications
export interface Notification {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  linkTo?: string;
}

// Storage
export type StorageMode = 'local' | 'supabase';

// ==================
// Agent-Specific Types
// ==================

export interface AgentConversation {
    id: string;
    userId: string;
    sessionId: string;
    messages: Array<{
        role: 'user' | 'assistant' | 'system';
        content: string;
        timestamp: number;
        toolsCalled?: string[];
    }>;
    createdAt: string;
    updatedAt: string;
}

export interface AgentActionLog {
    id: string;
    userId: string;
    sessionId: string;
    actionType: string;
    inputParams: Record<string, unknown>;
    result: {
        success: boolean;
        message: string;
        data?: unknown;
    };
    verified: boolean;
    createdAt: string;
}

export interface AgentEntityMapping {
    id: string;
    userId: string;
    sourceType: 'email' | 'incident' | 'task' | 'sprint' | 'project';
    sourceId: string;
    targetType: 'email' | 'incident' | 'task' | 'sprint' | 'project';
    targetId: string;
    createdAt: string;
}

// Email Inbox
export type EmailProvider = 'gmail' | 'outlook' | 'custom_smtp' | 'custom_imap' | 'custom_pop3';
export type EmailFolder = 'inbox' | 'sent' | 'draft' | 'spam' | 'trash' | 'archive';
export type ConnectionStatus = 'connected' | 'disconnected' | 'error';

export interface EmailAccount {
  id: string;
  tenantId: string;
  userId: string;
  provider: EmailProvider;
  emailAddress: string;
  displayName?: string;
  
  // Connection settings
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpUseTls?: boolean;
  
  imapHost?: string;
  imapPort?: number;
  imapUsername?: string;
  imapUseTls?: boolean;
  
  // OAuth tokens
  oauthAccessToken?: string;
  oauthRefreshToken?: string;
  oauthTokenExpiresAt?: string;
  
  // Sync settings
  syncEnabled: boolean;
  syncFrequencyMinutes: number;
  lastSyncedAt?: string;
  
  // Status
  isActive: boolean;
  connectionStatus: ConnectionStatus;
  lastError?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface EmailAttachment {
  name: string;
  size: number;
  type: string;
  url?: string;
}

export interface Email {
  id: string;
  tenantId: string;
  accountId: string;
  
  // Email identifiers
  messageId?: string;
  inReplyTo?: string;
  threadId?: string;
  
  // Basic fields
  fromAddress: string;
  fromName?: string;
  toAddresses: string[];
  ccAddresses?: string[];
  bccAddresses?: string[];
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  
  // Metadata
  receivedAt: string;
  sentAt?: string;
  sizeBytes?: number;
  
  // Flags
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  isDeleted: boolean; // Local delete only
  
  // Labels/Folders
  labels?: string[];
  folder: EmailFolder;
  
  // Attachments
  attachments?: EmailAttachment[];
  
  // Additional metadata
  headers?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  
  createdAt: string;
  updatedAt: string;
}

export interface EmailLabel {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface EmailCreateInput {
  accountId: string;
  messageId?: string;
  inReplyTo?: string;
  threadId?: string;
  fromAddress: string;
  fromName?: string;
  toAddresses: string[];
  ccAddresses?: string[];
  bccAddresses?: string[];
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  receivedAt: string;
  sentAt?: string;
  sizeBytes?: number;
  folder?: EmailFolder;
  attachments?: EmailAttachment[];
  headers?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface EmailUpdateInput {
  isRead?: boolean;
  isStarred?: boolean;
  isArchived?: boolean;
  isDeleted?: boolean;
  labels?: string[];
  folder?: EmailFolder;
}

export interface EmailAccountCreateInput {
  provider: EmailProvider;
  emailAddress: string;
  displayName?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpUseTls?: boolean;
  imapHost?: string;
  imapPort?: number;
  imapUsername?: string;
  imapPassword?: string;
  imapUseTls?: boolean;
  oauthAccessToken?: string;
  oauthRefreshToken?: string;
  syncEnabled?: boolean;
  syncFrequencyMinutes?: number;
}

// 21:11:22 Dec 06, 2025
