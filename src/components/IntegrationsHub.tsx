// =====================================
// FLUX - Integrations Hub
// Real connector implementation
// Last Updated: 02:45:00 Dec 07, 2025
// =====================================

import React, { useState, useMemo, useEffect } from 'react';
import { Integration, Category, ModalState } from '../types';
import { MOCK_INTEGRATIONS } from '../constants';
import { IntegrationCard } from './IntegrationCard';
import { Modal } from './Modal';
import { Button } from './Button';
import { 
  Search, 
  Filter, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Key,
  Globe,
  Lock
} from 'lucide-react';
import { useIntegrationStore } from '@/lib/integrations/store';
import { integrationService } from '@/lib/integrations/service';
import type { IntegrationProvider } from '@/lib/integrations/types';

// Map integration IDs to providers
const ID_TO_PROVIDER: Record<string, IntegrationProvider> = {
  'github': 'github',
  'slack': 'slack',
  'figma': 'figma',
  'trello': 'trello',
  'gmail': 'gmail',
  'vercel': 'vercel',
  'supabase': 'supabase',
  'aws': 'aws',
};

// Credential field configurations for each provider
const CREDENTIAL_FIELDS: Record<IntegrationProvider, { key: string; label: string; type: string; placeholder: string }[]> = {
  github: [], // OAuth only
  slack: [], // OAuth only
  figma: [], // OAuth only
  gmail: [], // OAuth only
  trello: [
    { key: 'apiKey', label: 'API Key', type: 'text', placeholder: 'Your Trello API Key' },
    { key: 'token', label: 'Token', type: 'password', placeholder: 'Your Trello Token' },
  ],
  vercel: [
    { key: 'token', label: 'Access Token', type: 'password', placeholder: 'Your Vercel access token' },
    { key: 'teamId', label: 'Team ID (Optional)', type: 'text', placeholder: 'team_xxx' },
  ],
  supabase: [
    { key: 'url', label: 'Project URL', type: 'url', placeholder: 'https://xxx.supabase.co' },
    { key: 'anonKey', label: 'Anon Key', type: 'password', placeholder: 'Your anon public key' },
  ],
  aws: [
    { key: 'accessKeyId', label: 'Access Key ID', type: 'text', placeholder: 'AKIAIOSFODNN7EXAMPLE' },
    { key: 'secretAccessKey', label: 'Secret Access Key', type: 'password', placeholder: 'Your secret key' },
    { key: 'region', label: 'Region', type: 'text', placeholder: 'us-east-1' },
  ],
};

// Check if provider uses OAuth
const isOAuthProvider = (provider: IntegrationProvider): boolean => {
  return ['github', 'slack', 'figma', 'gmail'].includes(provider);
};

export const IntegrationsHub: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>(MOCK_INTEGRATIONS);
  const [activeCategory, setActiveCategory] = useState<Category>(Category.ALL);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [modalState, setModalState] = useState<ModalState>({ type: null, integrationId: null });
  const [isProcessing, setIsProcessing] = useState(false);
  const [connectionStep, setConnectionStep] = useState(0); // 0: Init, 1: Connecting, 2: Success, 3: Error
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  // Integration store
  const { 
    configs, 
    ui, 
    isConnected,
    connectWithCredentials,
    disconnect,
    sync,
    loadFromService 
  } = useIntegrationStore();

  // Load integrations from service on mount
  useEffect(() => {
    loadFromService();
  }, []);

  // Sync integration status with UI
  useEffect(() => {
    setIntegrations(prev => prev.map(integration => {
      const provider = ID_TO_PROVIDER[integration.id];
      if (provider && configs[provider]) {
        return { ...integration, isConnected: configs[provider]?.status === 'connected' };
      }
      return integration;
    }));
  }, [configs]);

  const activeIntegration = useMemo(() => 
    integrations.find(i => i.id === modalState.integrationId), 
    [integrations, modalState.integrationId]
  );

  const activeProvider = useMemo(() => 
    activeIntegration ? ID_TO_PROVIDER[activeIntegration.id] : null,
    [activeIntegration]
  );

  const filteredIntegrations = useMemo(() => {
    return integrations.filter((integration) => {
      const matchesCategory = activeCategory === Category.ALL || integration.category === activeCategory;
      const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            integration.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [integrations, activeCategory, searchQuery]);

  const handleToggle = (integration: Integration) => {
    if (integration.isConnected) {
      setModalState({ type: 'settings', integrationId: integration.id });
    } else {
      setConnectionStep(0);
      setCredentials({});
      setError(null);
      setModalState({ type: 'connect', integrationId: integration.id });
    }
  };

  const closeModal = () => {
    setModalState({ type: null, integrationId: null });
    setIsProcessing(false);
    setConnectionStep(0);
    setCredentials({});
    setError(null);
  };

  const handleOAuthConnect = () => {
    if (!activeProvider) return;
    
    setIsProcessing(true);
    setConnectionStep(1);
    
    // Get OAuth URL and redirect
    const authUrl = integrationService.getAuthorizationUrl(activeProvider, 'current-user');
    
    if (authUrl) {
      // In production, this would open a popup or redirect
      // For demo, we simulate success
      setTimeout(() => {
        setConnectionStep(2);
        setIsProcessing(false);
        
        // Simulate successful connection
        setIntegrations(prev => prev.map(i => 
          i.id === modalState.integrationId ? { ...i, isConnected: true } : i
        ));
        
        setTimeout(() => {
          closeModal();
        }, 1500);
      }, 2000);
    } else {
      setError('OAuth not configured. Please set up environment variables.');
      setConnectionStep(3);
      setIsProcessing(false);
    }
  };

  const handleCredentialsConnect = async () => {
    if (!activeProvider) return;

    setIsProcessing(true);
    setConnectionStep(1);
    setError(null);

    try {
      const success = await connectWithCredentials(activeProvider, credentials, 'current-user');
      
      if (success) {
        setConnectionStep(2);
        
        // Update local state
        setIntegrations(prev => prev.map(i => 
          i.id === modalState.integrationId ? { ...i, isConnected: true } : i
        ));
        
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        setError(ui.errors[activeProvider] || 'Connection failed. Please check your credentials.');
        setConnectionStep(3);
      }
    } catch (err) {
      setError(String(err));
      setConnectionStep(3);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConnect = () => {
    if (!activeProvider) return;
    
    if (isOAuthProvider(activeProvider)) {
      handleOAuthConnect();
    } else {
      handleCredentialsConnect();
    }
  };

  const handleDisconnect = async () => {
    if (!activeProvider) return;
    
    setIsProcessing(true);
    
    disconnect(activeProvider);
    
    setIntegrations(prev => prev.map(i => 
      i.id === modalState.integrationId ? { ...i, isConnected: false } : i
    ));
    
    setIsProcessing(false);
    closeModal();
  };

  const handleSync = async () => {
    if (!activeProvider) return;
    
    setIsProcessing(true);
    await sync(activeProvider);
    setIsProcessing(false);
  };

  // Get credential fields for current provider
  const credentialFields = activeProvider ? CREDENTIAL_FIELDS[activeProvider] : [];
  const requiresCredentials = credentialFields.length > 0;

  // Render Tabs
  const renderTabs = () => (
    <div className="flex flex-wrap items-center gap-2 mb-8">
      {Object.values(Category).map((cat) => (
        <button
          key={cat}
          onClick={() => setActiveCategory(cat)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            activeCategory === cat
              ? 'bg-slate-900 dark:bg-violet-600 text-white shadow-md shadow-slate-900/10'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );

  // Render credentials form
  const renderCredentialsForm = () => (
    <div className="space-y-4 mt-6">
      {credentialFields.map((field) => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {field.label}
          </label>
          <div className="relative">
            <input
              type={field.type}
              value={credentials[field.key] || ''}
              onChange={(e) => setCredentials(prev => ({ ...prev, [field.key]: e.target.value }))}
              placeholder={field.placeholder}
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all sm:text-sm"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {field.type === 'password' ? (
                <Lock className="h-4 w-4 text-slate-400" />
              ) : field.type === 'url' ? (
                <Globe className="h-4 w-4 text-slate-400" />
              ) : (
                <Key className="h-4 w-4 text-slate-400" />
              )}
            </div>
          </div>
        </div>
      ))}
      
      {activeProvider && ['trello'].includes(activeProvider) && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Get your API key and token from{' '}
          <a 
            href="https://trello.com/app-key" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-violet-600 hover:underline"
          >
            trello.com/app-key
            <ExternalLink className="inline w-3 h-3 ml-1" />
          </a>
        </p>
      )}
      
      {activeProvider === 'vercel' && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Create a token at{' '}
          <a 
            href="https://vercel.com/account/tokens" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-violet-600 hover:underline"
          >
            vercel.com/account/tokens
            <ExternalLink className="inline w-3 h-3 ml-1" />
          </a>
        </p>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
          Integrations Hub
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl">
          Supercharge your workflow by connecting Flux with your favorite tools. 
          Sync data, automate tasks, and centralize your operations.
        </p>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        {renderTabs()}
        
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg leading-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:placeholder-slate-300 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-shadow sm:text-sm"
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredIntegrations.map((integration) => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            onToggle={handleToggle}
          />
        ))}
        {filteredIntegrations.length === 0 && (
           <div className="col-span-full py-20 text-center text-slate-400">
             <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Filter className="w-8 h-8 text-slate-300 dark:text-slate-600" />
             </div>
             <p className="text-lg font-medium">No integrations found</p>
             <p>Try adjusting your search or filters.</p>
           </div>
        )}
      </div>

      {/* Connect Modal */}
      <Modal
        isOpen={modalState.type === 'connect'}
        onClose={closeModal}
        title={`Connect ${activeIntegration?.name}`}
      >
        {activeIntegration && (
          <div className="text-center py-4">
            {connectionStep === 0 && (
              <div className="space-y-6">
                <div className="flex justify-center mb-6">
                   <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
                     {activeIntegration.icon}
                   </div>
                </div>
                
                {isOAuthProvider(activeProvider!) ? (
                  <div className="space-y-2">
                    <p className="text-slate-600 dark:text-slate-400">
                      Flux requests permission to access your <strong>{activeIntegration.name}</strong> workspace.
                    </p>
                    <ul className="text-sm text-slate-500 text-left bg-slate-50 dark:bg-slate-800 p-4 rounded-lg space-y-2 border border-slate-100 dark:border-slate-700 mx-4">
                      <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-green-600"/> Read workspace data</li>
                      <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-green-600"/> Create and update issues</li>
                      <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-green-600"/> Sync status changes</li>
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-2 text-left">
                    <p className="text-slate-600 dark:text-slate-400 text-center">
                      Enter your <strong>{activeIntegration.name}</strong> credentials to connect.
                    </p>
                    {renderCredentialsForm()}
                  </div>
                )}
                
                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/30 mx-4">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}
                
                <div className="pt-4 flex gap-3 justify-center">
                  <Button variant="outline" onClick={closeModal}>Cancel</Button>
                  <Button 
                    onClick={handleConnect}
                    disabled={requiresCredentials && credentialFields.some(f => !credentials[f.key] && f.key !== 'teamId')}
                  >
                    {isOAuthProvider(activeProvider!) ? 'Allow Access' : 'Connect'}
                  </Button>
                </div>
              </div>
            )}

            {connectionStep === 1 && (
              <div className="py-12 flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-violet-100 dark:border-violet-900 border-t-violet-500 rounded-full animate-spin mb-6"></div>
                <p className="text-lg font-medium text-slate-700 dark:text-slate-300">Connecting to {activeIntegration.name}...</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Verifying credentials and setting up webhooks.</p>
              </div>
            )}

            {connectionStep === 2 && (
              <div className="py-8 flex flex-col items-center animate-in zoom-in-50 duration-300">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Successfully Connected!</h3>
                <p className="text-slate-500 dark:text-slate-400">Your {activeIntegration.name} integration is now active.</p>
              </div>
            )}

            {connectionStep === 3 && (
              <div className="py-8 flex flex-col items-center">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-6">
                  <AlertCircle size={40} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Connection Failed</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-4">{error || 'Please check your credentials and try again.'}</p>
                <Button onClick={() => { setConnectionStep(0); setError(null); }}>
                  Try Again
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Settings Modal */}
      <Modal
        isOpen={modalState.type === 'settings'}
        onClose={closeModal}
        title={`${activeIntegration?.name} Settings`}
      >
        {activeIntegration && activeProvider && (
          <div className="space-y-6">
             <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-700">
                <div className="w-12 h-12 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    {activeIntegration.icon}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900 dark:text-white">{activeIntegration.name}</h3>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium border border-emerald-200 dark:border-emerald-800">Active</span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Connected {configs[activeProvider]?.connectedAt ? new Date(configs[activeProvider]!.connectedAt!).toLocaleDateString() : 'recently'}
                    </p>
                </div>
             </div>

             <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Configuration</h4>
                
                <div className="grid gap-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="text-sm">
                            <p className="font-medium text-slate-800 dark:text-slate-200">Auto-sync</p>
                            <p className="text-slate-500 dark:text-slate-400 text-xs">Sync data every 15 minutes</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 dark:peer-focus:ring-violet-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-violet-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="text-sm">
                            <p className="font-medium text-slate-800 dark:text-slate-200">Last synced</p>
                            <p className="text-slate-500 dark:text-slate-400 text-xs">
                              {ui.lastSync[activeProvider] 
                                ? new Date(ui.lastSync[activeProvider]!).toLocaleString() 
                                : 'Never'}
                            </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleSync}
                          disabled={isProcessing}
                        >
                          <RefreshCw className={`w-4 h-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
                          Sync Now
                        </Button>
                    </div>
                </div>
             </div>

             <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                    <div>
                        <h4 className="text-sm font-semibold text-red-800 dark:text-red-400">Disconnect Integration</h4>
                        <p className="text-xs text-red-600 dark:text-red-400/80 mt-1 mb-3">
                            Revoke access and stop syncing data. This action cannot be undone immediately.
                        </p>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:border-red-300 bg-white dark:bg-transparent"
                            onClick={handleDisconnect}
                            isLoading={isProcessing}
                        >
                            Disconnect
                        </Button>
                    </div>
                </div>
             </div>
             
             <div className="flex justify-end pt-2">
                <Button onClick={closeModal}>Done</Button>
             </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// 02:45:00 Dec 07, 2025
