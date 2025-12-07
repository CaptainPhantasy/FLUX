// =====================================
// FLUX - Environment Configuration
// Last Updated: 21:11:22 Dec 06, 2025
// =====================================
// @ts-nocheck
// Environment configuration with type safety
// Note: Sensitive values are loaded from secure storage, not environment variables

export const envConfig = {
  // AI Configuration - Loaded from secure storage
  AI: {
    MODEL_NAME: 'gemini-2.0-flash-exp',
    MAX_RETRIES: 3,
    TIMEOUT: 30000, // 30 seconds
  },

  // Supabase Configuration
  SUPABASE: {
    URL: import.meta.env.VITE_SUPABASE_URL || '',
    ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },

  // App Configuration
  APP: {
    NAME: import.meta.env.VITE_APP_NAME || 'FLUX PM',
    VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
    ENVIRONMENT: import.meta.env.MODE || 'development',
    DEBUG: import.meta.env.DEV || false,
  },

  // Proxy Server Configuration
  PROXY: {
    USE_PROXY: import.meta.env.VITE_USE_PROXY_SERVER === 'true',
    URL: import.meta.env.VITE_PROXY_URL || null,
  },

  // Development Mode Indicators
  DEV: {
    USE_MOCK_AI: import.meta.env.VITE_USE_MOCK_AI === 'true',
    LOCAL_AI_KEY: import.meta.env.VITE_LOCAL_AI_KEY || null,
  },

  // Feature Flags
  FEATURES: {
    AI_ENABLED: true,
    ITSM_ENABLED: true,
    AUTOMATION_ENABLED: true,
  },
};

// Validation helper
export const validateEnv = () => {
  const errors: string[] = [];

  // Only validate non-sensitive configuration
  if (!envConfig.SUPABASE.URL) {
    errors.push('Supabase URL is required');
  }

  if (!envConfig.SUPABASE.ANON_KEY) {
    errors.push('Supabase anonymous key is required');
  }

  if (errors.length > 0) {
    console.warn('⚠️ Environment validation warnings:', errors);
    return false;
  }

  console.log('✅ Environment validation successful');
  if (envConfig.SUPABASE.URL) {
    console.log(`✅ Supabase configured: ${envConfig.SUPABASE.URL.substring(0, 30)}...`);
  }
  console.log(`✅ Environment: ${envConfig.APP.ENVIRONMENT}`);

  // Check for proxy configuration
  if (envConfig.PROXY.USE_PROXY) {
    console.log(`✅ Proxy server enabled: ${envConfig.PROXY.URL}`);
  }

  return true;
};

// Helper to check if a feature is enabled
export const isFeatureEnabled = (feature: keyof typeof envConfig.FEATURES) => {
  return envConfig.FEATURES[feature];
};

export default envConfig;
// 21:11:22 Dec 06, 2025
