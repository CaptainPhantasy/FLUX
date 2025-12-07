// =====================================
// FLUX - Supabase Client Configuration
// Created: 01:53:54 Dec 07, 2025
// =====================================
// @ts-nocheck
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate configuration
if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '[Supabase] Missing configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
  );
}

// Create Supabase client with optimized settings
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-client-info': 'flux-app',
    },
  },
});

// Log initialization (only in development)
if (import.meta.env.DEV) {
  console.log('[Supabase] Client initialized:', {
    url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NOT SET',
    hasKey: !!supabaseKey,
  });
}

export default supabase;
