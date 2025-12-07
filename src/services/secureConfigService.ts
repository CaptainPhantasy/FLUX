// =====================================
// FLUX - Secure Config Service
// Last Updated: 21:11:22 Dec 06, 2025
// =====================================
// @ts-nocheck
import { supabase } from '@/lib/supabase-client';

interface SecureConfig {
  gemini_api_key?: string;
  ai_enabled?: boolean;
  feature_flags?: Record<string, boolean>;
  api_keys?: Record<string, string>;
}

class SecureConfigService {
  private cache: SecureConfig = {};
  private cacheExpiry = 0;
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Fetch secure configuration from Supabase
  async fetchConfig(): Promise<SecureConfig> {
    // Return cached config if still valid
    if (Date.now() < this.cacheExpiry && Object.keys(this.cache).length > 0) {
      return this.cache;
    }

    try {
      // Fetch from secure_config table
      const { data, error } = await supabase
        .from('secure_config')
        .select('*')
        .eq('id', 'app_config')
        .single();

      if (error) {
        console.error('Failed to fetch secure config:', error);
        // Fall back to environment variables
        return this.getEnvFallback();
      }

      if (data) {
        this.cache = data;
        this.cacheExpiry = Date.now() + this.CACHE_DURATION;
        return data;
      }

      // No config found, create default
      return await this.createDefaultConfig();
    } catch (error) {
      console.error('Secure config fetch error:', error);
      return this.getEnvFallback();
    }
  }

  // Create default secure configuration
  private async createDefaultConfig(): Promise<SecureConfig> {
    try {
      const defaultConfig = {
        gemini_api_key: import.meta.env.VITE_GEMINI_API_KEY,
        ai_enabled: import.meta.env.VITE_AI_ENABLED !== 'false',
        feature_flags: {
          analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
          sentry: import.meta.env.VITE_ENABLE_SENTRY === 'true',
        },
        api_keys: {},
      };

      const { error } = await supabase
        .from('secure_config')
        .insert({
          id: 'app_config',
          ...defaultConfig,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Failed to create default config:', error);
      }

      this.cache = defaultConfig;
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;
      return defaultConfig;
    } catch (error) {
      console.error('Failed to create default config:', error);
      return {};
    }
  }

  // Fallback to environment variables
  private getEnvFallback(): SecureConfig {
    return {
      gemini_api_key: import.meta.env.VITE_GEMINI_API_KEY,
      ai_enabled: import.meta.env.VITE_AI_ENABLED !== 'false',
      feature_flags: {
        analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
        sentry: import.meta.env.VITE_ENABLE_SENTRY === 'true',
      },
      api_keys: {},
    };
  }

  // Update a configuration value
  async updateConfig(updates: Partial<SecureConfig>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('secure_config')
        .upsert({
          id: 'app_config',
          ...updates,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Failed to update config:', error);
        return false;
      }

      // Clear cache to force refresh
      this.cache = {};
      this.cacheExpiry = 0;
      return true;
    } catch (error) {
      console.error('Failed to update config:', error);
      return false;
    }
  }

  // Validate API key format
  validateApiKey(key: string): boolean {
    // Gemini API keys typically start with 'AIza'
    if (!key || typeof key !== 'string') return false;
    return key.startsWith('AIza') && key.length > 30;
  }

  // Get API key securely
  async getApiKey(service: string = 'gemini'): Promise<string | null> {
    const config = await this.fetchConfig();

    if (service === 'gemini') {
      const key = config.gemini_api_key || config.api_keys?.[service];

      if (!key) {
        console.warn(`No API key found for ${service}`);
        return null;
      }

      if (!this.validateApiKey(key)) {
        console.error(`Invalid API key format for ${service}`);
        return null;
      }

      return key;
    }

    return config.api_keys?.[service] || null;
  }

  // Check if AI is enabled
  async isAIEnabled(): Promise<boolean> {
    const config = await this.fetchConfig();
    return config.ai_enabled === true;
  }

  // Clear cache (for testing or manual refresh)
  clearCache(): void {
    this.cache = {};
    this.cacheExpiry = 0;
  }
}

// Export singleton instance
export const secureConfig = new SecureConfigService();

// Helper for proxy server configuration
export const useProxyServer = (): boolean => {
  return import.meta.env.VITE_USE_PROXY_SERVER === 'true';
};

// Proxy server configuration
export const proxyConfig = {
  url: import.meta.env.VITE_PROXY_URL || 'https://api.flux.example.com',
  timeout: 10000,
  retries: 3,
};
// 21:11:22 Dec 06, 2025
