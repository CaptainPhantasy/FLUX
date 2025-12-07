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

// Tasks
export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done' | 'archived';
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
export const FLUX_STATUSES = ['todo', 'in-progress', 'review', 'done'];

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
// 21:11:22 Dec 06, 2025
