// =====================================
// FLUX - Integrations Module
// Last Updated: 02:45:00 Dec 07, 2025
// =====================================

// Types
export * from './types';

// Connectors
export { GitHubConnector, verifyGitHubWebhookSignature } from './github';
export type { GitHubOAuthConfig } from './github';

export { SlackConnector, sendSlackWebhook, verifySlackSignature } from './slack';
export type { SlackOAuthConfig, SlackMessageOptions } from './slack';

export { FigmaConnector } from './figma';
export type { FigmaOAuthConfig, FigmaImageOptions } from './figma';

export { TrelloConnector } from './trello';
export type { TrelloAuthConfig, TrelloWebhookPayload } from './trello';

export { GmailConnector } from './gmail';
export type { GoogleOAuthConfig, GmailQueryOptions, GmailSendOptions } from './gmail';

export { VercelConnector } from './vercel';
export type { VercelDeploymentOptions } from './vercel';

export { SupabaseConnector } from './supabase-connector';
export type { SupabaseConfig } from './supabase-connector';

export { AWSConnector } from './aws';
export type { AWSRegion, CloudWatchMetricRequest } from './aws';

// Integration Service
export { IntegrationService, integrationService } from './service';

// 02:45:00 Dec 07, 2025

