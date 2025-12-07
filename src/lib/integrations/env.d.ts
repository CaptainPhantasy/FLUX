// =====================================
// FLUX - Integration Environment Types
// Last Updated: 02:45:00 Dec 07, 2025
// =====================================

/// <reference types="vite/client" />

interface ImportMetaEnv {
  // GitHub
  readonly VITE_GITHUB_CLIENT_ID?: string;
  readonly VITE_GITHUB_CLIENT_SECRET?: string;

  // Slack
  readonly VITE_SLACK_CLIENT_ID?: string;
  readonly VITE_SLACK_CLIENT_SECRET?: string;
  readonly VITE_SLACK_SIGNING_SECRET?: string;

  // Figma
  readonly VITE_FIGMA_CLIENT_ID?: string;
  readonly VITE_FIGMA_CLIENT_SECRET?: string;

  // Trello
  readonly VITE_TRELLO_API_KEY?: string;

  // Google (Gmail)
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_GOOGLE_CLIENT_SECRET?: string;

  // Vercel
  readonly VITE_VERCEL_TOKEN?: string;
  readonly VITE_VERCEL_TEAM_ID?: string;

  // Supabase
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SUPABASE_SERVICE_ROLE_KEY?: string;

  // AWS
  readonly VITE_AWS_ACCESS_KEY_ID?: string;
  readonly VITE_AWS_SECRET_ACCESS_KEY?: string;
  readonly VITE_AWS_REGION?: string;

  // Gemini (existing)
  readonly VITE_GEMINI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// 02:45:00 Dec 07, 2025

