// =====================================
// FLUX - Email System TypeScript Types
// =====================================
// Shared types for email-related Edge Functions

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
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpUseTls?: boolean;
  imapHost?: string;
  imapPort?: number;
  imapUsername?: string;
  imapUseTls?: boolean;
  oauthAccessToken?: string;
  oauthRefreshToken?: string;
  oauthTokenExpiresAt?: string;
  syncEnabled: boolean;
  syncFrequencyMinutes: number;
  lastSyncedAt?: string;
  isActive: boolean;
  connectionStatus: ConnectionStatus;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
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

export interface Email {
  id: string;
  tenantId: string;
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
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  labels?: string[];
  folder: EmailFolder;
  attachments?: EmailAttachment[];
  headers?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface EmailAttachment {
  name: string;
  size: number;
  type: string;
  url?: string;
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

export interface EmailLabel {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
}

