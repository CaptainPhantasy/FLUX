// =====================================
// FLUX - Integration Store
// Last Updated: 02:45:00 Dec 07, 2025
// =====================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IntegrationProvider, IntegrationConfig, ConnectionStatus, SyncResult } from './types';
import { integrationService } from './service';

/**
 * Integration UI state
 */
export interface IntegrationUIState {
  isLoading: Record<IntegrationProvider, boolean>;
  lastSync: Record<IntegrationProvider, string | null>;
  errors: Record<IntegrationProvider, string | null>;
}

/**
 * Integration store state
 */
export interface IntegrationStoreState {
  // Configurations
  configs: Record<IntegrationProvider, IntegrationConfig | null>;
  
  // UI State
  ui: IntegrationUIState;
  
  // Modal state
  activeModal: {
    type: 'connect' | 'settings' | 'disconnect' | null;
    provider: IntegrationProvider | null;
  };
  
  // Actions
  setConfig: (provider: IntegrationProvider, config: IntegrationConfig | null) => void;
  setLoading: (provider: IntegrationProvider, loading: boolean) => void;
  setError: (provider: IntegrationProvider, error: string | null) => void;
  setLastSync: (provider: IntegrationProvider, timestamp: string | null) => void;
  
  // Modal actions
  openConnectModal: (provider: IntegrationProvider) => void;
  openSettingsModal: (provider: IntegrationProvider) => void;
  openDisconnectModal: (provider: IntegrationProvider) => void;
  closeModal: () => void;
  
  // Connection actions
  initiateOAuth: (provider: IntegrationProvider, userId: string) => void;
  connectWithCredentials: (
    provider: IntegrationProvider,
    credentials: Record<string, string>,
    userId: string
  ) => Promise<boolean>;
  disconnect: (provider: IntegrationProvider) => void;
  
  // Sync actions
  sync: (provider: IntegrationProvider) => Promise<SyncResult>;
  syncAll: () => Promise<SyncResult[]>;
  
  // Utility
  isConnected: (provider: IntegrationProvider) => boolean;
  getStatus: (provider: IntegrationProvider) => ConnectionStatus;
  loadFromService: () => void;
}

const initialUIState: IntegrationUIState = {
  isLoading: {
    github: false,
    slack: false,
    figma: false,
    trello: false,
    gmail: false,
    vercel: false,
    supabase: false,
    aws: false,
  },
  lastSync: {
    github: null,
    slack: null,
    figma: null,
    trello: null,
    gmail: null,
    vercel: null,
    supabase: null,
    aws: null,
  },
  errors: {
    github: null,
    slack: null,
    figma: null,
    trello: null,
    gmail: null,
    vercel: null,
    supabase: null,
    aws: null,
  },
};

const initialConfigs: Record<IntegrationProvider, IntegrationConfig | null> = {
  github: null,
  slack: null,
  figma: null,
  trello: null,
  gmail: null,
  vercel: null,
  supabase: null,
  aws: null,
};

/**
 * Integration Store
 */
export const useIntegrationStore = create<IntegrationStoreState>()(
  persist(
    (set, get) => ({
      configs: { ...initialConfigs },
      ui: { ...initialUIState },
      activeModal: { type: null, provider: null },

      // Setters
      setConfig: (provider, config) => {
        set((state) => ({
          configs: { ...state.configs, [provider]: config },
        }));
      },

      setLoading: (provider, loading) => {
        set((state) => ({
          ui: {
            ...state.ui,
            isLoading: { ...state.ui.isLoading, [provider]: loading },
          },
        }));
      },

      setError: (provider, error) => {
        set((state) => ({
          ui: {
            ...state.ui,
            errors: { ...state.ui.errors, [provider]: error },
          },
        }));
      },

      setLastSync: (provider, timestamp) => {
        set((state) => ({
          ui: {
            ...state.ui,
            lastSync: { ...state.ui.lastSync, [provider]: timestamp },
          },
        }));
      },

      // Modal actions
      openConnectModal: (provider) => {
        set({ activeModal: { type: 'connect', provider } });
      },

      openSettingsModal: (provider) => {
        set({ activeModal: { type: 'settings', provider } });
      },

      openDisconnectModal: (provider) => {
        set({ activeModal: { type: 'disconnect', provider } });
      },

      closeModal: () => {
        set({ activeModal: { type: null, provider: null } });
      },

      // Connection actions
      initiateOAuth: (provider, userId) => {
        const url = integrationService.getAuthorizationUrl(provider, userId);
        if (url) {
          // Open OAuth popup or redirect
          window.location.href = url;
        } else {
          get().setError(provider, 'OAuth not configured for this provider');
        }
      },

      connectWithCredentials: async (provider, credentials, userId) => {
        const { setLoading, setError, setConfig, closeModal } = get();
        
        setLoading(provider, true);
        setError(provider, null);

        try {
          let result;

          switch (provider) {
            case 'trello':
              result = await integrationService.connectWithApiKey(
                provider,
                { apiKey: credentials.apiKey, token: credentials.token },
                userId
              );
              break;

            case 'vercel':
              result = await integrationService.connectWithApiKey(
                provider,
                { apiKey: credentials.token, teamId: credentials.teamId },
                userId
              );
              break;

            case 'supabase':
              result = await integrationService.connectSupabase(
                { url: credentials.url, anonKey: credentials.anonKey },
                userId
              );
              break;

            case 'aws':
              result = await integrationService.connectAWS(
                {
                  accessKeyId: credentials.accessKeyId,
                  secretAccessKey: credentials.secretAccessKey,
                  region: credentials.region,
                },
                userId
              );
              break;

            default:
              // For OAuth providers, redirect to OAuth flow
              get().initiateOAuth(provider, userId);
              return false;
          }

          if (result.success && result.config) {
            setConfig(provider, result.config);
            closeModal();
            return true;
          } else {
            setError(provider, result.error || 'Connection failed');
            return false;
          }
        } catch (err) {
          setError(provider, String(err));
          return false;
        } finally {
          setLoading(provider, false);
        }
      },

      disconnect: (provider) => {
        const { setConfig, closeModal } = get();
        integrationService.disconnect(provider);
        setConfig(provider, null);
        closeModal();
      },

      // Sync actions
      sync: async (provider) => {
        const { setLoading, setError, setLastSync } = get();
        
        setLoading(provider, true);
        setError(provider, null);

        try {
          const result = await integrationService.sync(provider);
          
          if (result.success) {
            setLastSync(provider, result.timestamp);
          } else {
            setError(provider, result.errors?.join(', ') || 'Sync failed');
          }

          return result;
        } catch (err) {
          const error = String(err);
          setError(provider, error);
          return {
            success: false,
            provider,
            itemsSynced: 0,
            errors: [error],
            timestamp: new Date().toISOString(),
          };
        } finally {
          setLoading(provider, false);
        }
      },

      syncAll: async () => {
        const results = await integrationService.syncAll();
        
        results.forEach((result) => {
          if (result.success) {
            get().setLastSync(result.provider, result.timestamp);
          } else {
            get().setError(result.provider, result.errors?.join(', ') || 'Sync failed');
          }
        });

        return results;
      },

      // Utility
      isConnected: (provider) => {
        const config = get().configs[provider];
        return config?.status === 'connected';
      },

      getStatus: (provider) => {
        const config = get().configs[provider];
        return config?.status || 'disconnected';
      },

      loadFromService: () => {
        const configs = integrationService.getAllConfigs();
        const newConfigs = { ...initialConfigs };
        
        configs.forEach((config) => {
          newConfigs[config.provider] = config;
        });

        set({ configs: newConfigs });
      },
    }),
    {
      name: 'flux-integrations-store',
      partialize: (state) => ({
        configs: state.configs,
        ui: { lastSync: state.ui.lastSync },
      }),
    }
  )
);

// 02:45:00 Dec 07, 2025

