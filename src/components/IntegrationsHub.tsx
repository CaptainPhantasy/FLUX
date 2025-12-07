import React, { useState, useMemo, useEffect } from 'react';
import { Integration, Category, ModalState } from '../types';
import { MOCK_INTEGRATIONS } from '../constants';
import { IntegrationCard } from './IntegrationCard';
import { Modal } from './Modal';
import { Button } from './Button';
import { Search, Filter, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export const IntegrationsHub: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>(MOCK_INTEGRATIONS);
  const [activeCategory, setActiveCategory] = useState<Category>(Category.ALL);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [modalState, setModalState] = useState<ModalState>({ type: null, integrationId: null });
  const [isProcessing, setIsProcessing] = useState(false);
  const [connectionStep, setConnectionStep] = useState(0); // 0: Init, 1: Connecting, 2: Success

  const activeIntegration = useMemo(() => 
    integrations.find(i => i.id === modalState.integrationId), 
    [integrations, modalState.integrationId]
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
      setModalState({ type: 'connect', integrationId: integration.id });
    }
  };

  const closeModal = () => {
    setModalState({ type: null, integrationId: null });
    setIsProcessing(false);
    setConnectionStep(0);
  };

  const simulateConnection = () => {
    setIsProcessing(true);
    setConnectionStep(1);
    
    // Simulate API delay
    setTimeout(() => {
      setConnectionStep(2);
      setIsProcessing(false);
      
      // Update state
      setIntegrations(prev => prev.map(i => 
        i.id === modalState.integrationId ? { ...i, isConnected: true } : i
      ));
      
      // Close modal after brief success message
      setTimeout(() => {
        closeModal();
      }, 1500);
    }, 2000);
  };

  const disconnectIntegration = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIntegrations(prev => prev.map(i => 
        i.id === modalState.integrationId ? { ...i, isConnected: false } : i
      ));
      setIsProcessing(false);
      closeModal();
    }, 800);
  };

  // Render Tabs
  const renderTabs = () => (
    <div className="flex flex-wrap items-center gap-2 mb-8">
      {Object.values(Category).map((cat) => (
        <button
          key={cat}
          onClick={() => setActiveCategory(cat)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            activeCategory === cat
              ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
          Integrations Hub
        </h1>
        <p className="text-slate-500 text-lg max-w-2xl">
          Supercharge your workflow by connecting Flux with your favorite tools. 
          Sync data, automate tasks, and centralized your operations.
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
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:placeholder-slate-300 focus:ring-2 focus:ring-flux-500 focus:border-flux-500 transition-shadow sm:text-sm"
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
             <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Filter className="w-8 h-8 text-slate-300" />
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
                   <div className="w-24 h-24 bg-slate-50 rounded-2xl p-5 border border-slate-100 shadow-sm">
                     {activeIntegration.icon}
                   </div>
                </div>
                <div className="space-y-2">
                    <p className="text-slate-600">
                    Flux requests permission to access your <strong>{activeIntegration.name}</strong> workspace.
                    </p>
                    <ul className="text-sm text-slate-500 text-left bg-slate-50 p-4 rounded-lg space-y-2 border border-slate-100 mx-4">
                        <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-green-600"/> Read workspace data</li>
                        <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-green-600"/> Create and update issues</li>
                        <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-green-600"/> Sync status changes</li>
                    </ul>
                </div>
                <div className="pt-4 flex gap-3 justify-center">
                  <Button variant="outline" onClick={closeModal}>Cancel</Button>
                  <Button onClick={simulateConnection}>Allow Access</Button>
                </div>
              </div>
            )}

            {connectionStep === 1 && (
              <div className="py-12 flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-flux-100 border-t-flux-500 rounded-full animate-spin mb-6"></div>
                <p className="text-lg font-medium text-slate-700">Connecting to {activeIntegration.name}...</p>
                <p className="text-sm text-slate-500">Verifying credentials and setting up webhooks.</p>
              </div>
            )}

            {connectionStep === 2 && (
              <div className="py-8 flex flex-col items-center animate-in zoom-in-50 duration-300">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Successfully Connected!</h3>
                <p className="text-slate-500">Your {activeIntegration.name} integration is now active.</p>
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
        {activeIntegration && (
          <div className="space-y-6">
             <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                <div className="w-12 h-12 p-2 bg-slate-50 rounded-lg border border-slate-200">
                    {activeIntegration.icon}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{activeIntegration.name} Workspace</h3>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium border border-emerald-200">Active</span>
                    </div>
                    <p className="text-sm text-slate-500">Connected since Oct 24, 2023</p>
                </div>
             </div>

             <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Configuration</h4>
                
                {/* Mock Settings Fields */}
                <div className="grid gap-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-sm">
                            <p className="font-medium text-slate-800">Auto-sync</p>
                            <p className="text-slate-500 text-xs">Sync data every 15 minutes</p>
                        </div>
                        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                            <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-slate-300 checked:right-0 checked:border-flux-500 transition-all duration-200 right-5" defaultChecked/>
                            <label htmlFor="toggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-slate-300 cursor-pointer checked:bg-flux-500"></label>
                        </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                         <label className="block text-sm font-medium text-slate-700 mb-1">Default Channel/Project</label>
                         <select className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-flux-500 focus:border-flux-500 sm:text-sm rounded-md">
                            <option># general</option>
                            <option># engineering</option>
                            <option># product-updates</option>
                         </select>
                    </div>
                </div>
             </div>

             <div className="pt-6 border-t border-slate-100">
                <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                    <div>
                        <h4 className="text-sm font-semibold text-red-800">Disconnect Integration</h4>
                        <p className="text-xs text-red-600 mt-1 mb-3">
                            Revoke access and stop syncing data. This action cannot be undone immediately.
                        </p>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300 bg-white"
                            onClick={disconnectIntegration}
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