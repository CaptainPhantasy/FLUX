// =====================================
// FLUX - Nanocoder Types
// =====================================

/** Nanocoder action types that can be dispatched */
export type NanocoderActionType =
  // Navigation
  | 'navigate'
  | 'go_back'
  | 'open_terminal'
  | 'close_terminal'
  // UI Control
  | 'set_theme'
  | 'toggle_sidebar'
  | 'show_toast'
  | 'scroll_to'
  // Board Control
  | 'move_task'
  | 'change_workflow'
  | 'highlight_task'
  // Task Operations
  | 'create_task'
  | 'update_task'
  | 'delete_task'
  // Selection Tracking
  | 'select_task'
  | 'select_email'
  | 'select_incident'
  // Incident Operations
  | 'create_incident'
  | 'update_incident'
  | 'resolve_incident'
  // Email Operations
  | 'archive_email'
  | 'mark_email_read'
  | 'star_email'
  // Voice
  | 'speak'
  | 'stop_speaking';

/** Payload types for each action */
export interface NanocoderActionPayloads {
  navigate: { path: string; replace?: boolean };
  go_back: Record<string, never>;
  open_terminal: Record<string, never>;
  close_terminal: Record<string, never>;
  set_theme: { theme: 'light' | 'dark' | 'system' };
  toggle_sidebar: Record<string, never>;
  show_toast: { message: string; type?: 'success' | 'error' | 'info' };
  scroll_to: { elementId: string };
  move_task: { taskId: string; toColumn: string; toIndex?: number };
  change_workflow: { workflow: 'agile' | 'ccaas' | 'itsm' };
  highlight_task: { taskId: string; duration?: number };
  // Task Operations
  create_task: { title: string; description?: string; priority?: string; status?: string };
  update_task: { taskId: string; updates: Record<string, unknown> };
  delete_task: { taskId: string };
  // Selection Tracking
  select_task: { taskId: string | null };
  select_email: { emailId: string | null };
  select_incident: { incidentId: string | null };
  // Incident Operations
  create_incident: { title: string; description?: string; severity?: string; category?: string };
  update_incident: { incidentId: string; updates: Record<string, unknown> };
  resolve_incident: { incidentId: string; resolution?: string };
  // Email Operations
  archive_email: { emailId: string };
  mark_email_read: { emailId: string; isRead: boolean };
  star_email: { emailId: string; isStarred: boolean };
  // Voice
  speak: { text: string; priority?: 'high' | 'normal' | 'low' };
  stop_speaking: Record<string, never>;
}

/** A Nanocoder action with typed payload */
export interface NanocoderAction<T extends NanocoderActionType = NanocoderActionType> {
  type: T;
  payload: T extends keyof NanocoderActionPayloads ? NanocoderActionPayloads[T] : never;
  timestamp: number;
  source?: 'voice' | 'terminal' | 'api' | 'internal';
}

/** Voice controller state */
export interface VoiceState {
  isListening: boolean;
  isContinuousMode: boolean;
  wakeWord: string | null;
  lastTranscript: string;
  audioLevel: number;
}

/** LLM provider identifiers */
export type LLMProviderType = 'gemini' | 'openai' | 'claude' | 'glm';

/** Nanocoder configuration */
export interface NanocoderConfig {
  llmProvider: LLMProviderType;
  voiceEnabled: boolean;
  continuousListening: boolean;
  wakeWord: string | null;
  ttsEnabled: boolean;
  ttsVoice: string | null;
  ttsRate: number;
}

/** Command history entry */
export interface CommandHistoryEntry {
  id: string;
  input: string;
  response: string;
  timestamp: number;
  success: boolean;
  toolsCalled?: string[];
}

/** Nanocoder state */
export interface NanocoderState {
  isInitialized: boolean;
  isProcessing: boolean;
  config: NanocoderConfig;
  voice: VoiceState;
  commandHistory: CommandHistoryEntry[];
  lastError: string | null;
}

/** Page routes for navigation */
export const PAGE_ROUTES = {
  dashboard: '/app/dashboard',
  board: '/app/board',
  sprints: '/app/sprints',
  inbox: '/app/inbox',
  documents: '/app/documents',
  assets: '/app/assets',
  analytics: '/app/analytics',
  'service-desk': '/app/service-desk',
  automation: '/app/automation',
  integrations: '/app/integrations',
  import: '/app/import',
  ai: '/app/ai',
  appearance: '/app/appearance',
  settings: '/app/settings',
  editor: '/app/editor',
} as const;

export type PageName = keyof typeof PAGE_ROUTES;

