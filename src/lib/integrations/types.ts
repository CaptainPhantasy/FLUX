// =====================================
// FLUX - Integration Types
// Last Updated: 02:45:00 Dec 07, 2025
// =====================================

/**
 * Supported integration providers
 */
export type IntegrationProvider = 
  | 'github'
  | 'slack'
  | 'figma'
  | 'trello'
  | 'gmail'
  | 'vercel'
  | 'supabase'
  | 'aws';

/**
 * Integration connection status
 */
export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'pending';

/**
 * OAuth token storage
 */
export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  tokenType?: string;
  scope?: string;
}

/**
 * API Key credentials
 */
export interface APIKeyCredentials {
  apiKey: string;
  apiSecret?: string;
  token?: string;
}

/**
 * AWS credentials
 */
export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  sessionToken?: string;
}

/**
 * Integration credentials union type
 */
export type IntegrationCredentials = OAuthTokens | APIKeyCredentials | AWSCredentials;

/**
 * Stored integration configuration
 */
export interface IntegrationConfig {
  id: string;
  provider: IntegrationProvider;
  status: ConnectionStatus;
  credentials?: IntegrationCredentials;
  settings?: Record<string, unknown>;
  connectedAt?: string;
  lastSyncAt?: string;
  userId: string;
  metadata?: {
    accountName?: string;
    accountEmail?: string;
    avatarUrl?: string;
    workspaceName?: string;
    teamId?: string;
  };
}

/**
 * OAuth state for CSRF protection
 */
export interface OAuthState {
  provider: IntegrationProvider;
  userId: string;
  redirectUrl: string;
  timestamp: number;
  nonce: string;
}

/**
 * Webhook event payload
 */
export interface WebhookEvent {
  id: string;
  provider: IntegrationProvider;
  event: string;
  payload: Record<string, unknown>;
  timestamp: string;
  signature?: string;
}

/**
 * Sync result from integration
 */
export interface SyncResult {
  success: boolean;
  provider: IntegrationProvider;
  itemsSynced: number;
  errors?: string[];
  timestamp: string;
}

// ============================================
// GitHub Types
// ============================================

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  default_branch: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  html_url: string;
  user: GitHubUser;
  assignees: GitHubUser[];
  labels: { name: string; color: string }[];
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed' | 'merged';
  html_url: string;
  user: GitHubUser;
  head: { ref: string; sha: string };
  base: { ref: string; sha: string };
  created_at: string;
  updated_at: string;
  merged_at: string | null;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: { name: string; email: string; date: string };
  html_url: string;
}

// ============================================
// Slack Types
// ============================================

export interface SlackUser {
  id: string;
  name: string;
  real_name: string;
  profile: {
    email: string;
    image_48: string;
    image_72: string;
  };
}

export interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
  is_member: boolean;
  num_members: number;
}

export interface SlackMessage {
  type: string;
  channel: string;
  user: string;
  text: string;
  ts: string;
  thread_ts?: string;
}

export interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  fields?: { type: string; text: string }[];
  elements?: SlackBlockElement[];
  accessory?: SlackBlockElement;
}

export interface SlackBlockElement {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  action_id?: string;
  url?: string;
  value?: string;
  style?: 'primary' | 'danger';
}

// ============================================
// Figma Types
// ============================================

export interface FigmaUser {
  id: string;
  handle: string;
  img_url: string;
  email: string;
}

export interface FigmaProject {
  id: string;
  name: string;
}

export interface FigmaFile {
  key: string;
  name: string;
  thumbnail_url: string;
  last_modified: string;
}

export interface FigmaComment {
  id: string;
  message: string;
  file_key: string;
  user: FigmaUser;
  created_at: string;
  resolved_at: string | null;
}

// ============================================
// Trello Types
// ============================================

export interface TrelloMember {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
}

export interface TrelloBoard {
  id: string;
  name: string;
  desc: string;
  url: string;
  closed: boolean;
  prefs: { background: string };
}

export interface TrelloList {
  id: string;
  name: string;
  idBoard: string;
  pos: number;
  closed: boolean;
}

export interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  idList: string;
  idBoard: string;
  url: string;
  pos: number;
  due: string | null;
  dueComplete: boolean;
  labels: { id: string; name: string; color: string }[];
  idMembers: string[];
}

// ============================================
// Gmail Types
// ============================================

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: { name: string; value: string }[];
    body: { data?: string; size: number };
    parts?: GmailMessagePart[];
    mimeType: string;
  };
  internalDate: string;
}

export interface GmailMessagePart {
  partId: string;
  mimeType: string;
  filename: string;
  body: { data?: string; size: number; attachmentId?: string };
  parts?: GmailMessagePart[];
}

export interface GmailLabel {
  id: string;
  name: string;
  type: 'system' | 'user';
  messagesTotal: number;
  messagesUnread: number;
}

// ============================================
// Vercel Types
// ============================================

export interface VercelUser {
  id: string;
  email: string;
  name: string | null;
  username: string;
  avatar: string | null;
}

export interface VercelProject {
  id: string;
  name: string;
  framework: string | null;
  latestDeployments: VercelDeployment[];
  link?: { type: string; repo: string };
}

export interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  state: 'QUEUED' | 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';
  target: 'production' | 'preview' | null;
  createdAt: number;
  buildingAt?: number;
  ready?: number;
  meta?: { githubCommitRef?: string; githubCommitSha?: string };
}

// ============================================
// AWS Types
// ============================================

export interface AWSInstance {
  instanceId: string;
  instanceType: string;
  state: 'pending' | 'running' | 'stopping' | 'stopped' | 'terminated';
  publicIp?: string;
  privateIp?: string;
  launchTime: string;
  name?: string;
  tags?: { Key: string; Value: string }[];
}

export interface AWSMetricDatapoint {
  timestamp: Date;
  value: number;
  unit: string;
}

export interface AWSHealthStatus {
  ec2: { running: number; total: number; healthy: boolean };
  rds?: { available: number; total: number };
  lambda?: { functions: number };
  timestamp: string;
}

// ============================================
// Flux Task Mapping Types
// ============================================

export interface ExternalTaskMapping {
  fluxTaskId: string;
  externalId: string;
  provider: IntegrationProvider;
  externalUrl?: string;
  lastSyncedAt: string;
  syncDirection: 'inbound' | 'outbound' | 'bidirectional';
}

// 02:45:00 Dec 07, 2025

