// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Button, Modal, Card } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Github, Slack, Figma, Trello, Mail, Globe, Database, Server, X, Check, ExternalLink, Plug } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFluxStore } from '@/lib/store';

interface Integration {
    id: string;
    name: string;
    description: string;
    icon: React.ElementType;
    connected: boolean;
    category: 'Communication' | 'Development' | 'Design' | 'Productivity';
}

const INTEGRATIONS: Integration[] = [
    {
        id: 'github',
        name: 'GitHub',
        description: 'Sync issues, pull requests, and commit history directly to your tasks.',
        icon: Github,
        connected: true,
        category: 'Development',
    },
    {
        id: 'slack',
        name: 'Slack',
        description: 'Receive notifications and update tasks via slash commands in Slack channels.',
        icon: Slack,
        connected: true,
        category: 'Communication',
    },
    {
        id: 'figma',
        name: 'Figma',
        description: 'Embed live design files and prototypes into your asset manager.',
        icon: Figma,
        connected: false,
        category: 'Design',
    },
    {
        id: 'trello',
        name: 'Trello',
        description: 'Import boards and keep cards in sync with two-way binding.',
        icon: Trello,
        connected: false,
        category: 'Productivity',
    },
    {
        id: 'gmail',
        name: 'Gmail',
        description: 'Turn emails into actionable tasks with a single click.',
        icon: Mail,
        connected: false,
        category: 'Communication',
    },
    {
        id: 'vercel',
        name: 'Vercel',
        description: 'Trigger deployments and view build status in real-time.',
        icon: Globe,
        connected: true,
        category: 'Development',
    },
    {
        id: 'supabase',
        name: 'Supabase',
        description: 'Manage your database and authentication settings.',
        icon: Database,
        connected: false,
        category: 'Development',
    },
    {
        id: 'aws',
        name: 'AWS',
        description: 'Monitor server health and cloud resources.',
        icon: Server,
        connected: false,
        category: 'Development',
    },
];

export default function IntegrationsPage() {
    const { integrations: storeIntegrations, connectIntegration, disconnectIntegration, fetchIntegrations } = useFluxStore();
    
    // Local state merged with store integrations
    const [integrations, setIntegrations] = useState(INTEGRATIONS);
    const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Sync with store integrations on mount
    useEffect(() => {
        fetchIntegrations();
    }, []);

    // Merge store state with local definitions
    useEffect(() => {
        if (storeIntegrations.length > 0) {
            setIntegrations(prev => prev.map(item => {
                const storeItem = storeIntegrations.find(s => s.type === item.id);
                return storeItem ? { ...item, connected: storeItem.isConnected } : item;
            }));
        }
    }, [storeIntegrations]);

    const handleConnect = async () => {
        if (!selectedIntegration) return;
        
        setIsLoading(true);
        try {
            await connectIntegration(selectedIntegration.id as any, { apiKey });
            setIntegrations(prev => prev.map(item =>
                item.id === selectedIntegration.id ? { ...item, connected: true } : item
            ));
            setIsConfigModalOpen(false);
            setApiKey('');
        } catch (error) {
            console.error('Failed to connect:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisconnect = async (integration: Integration) => {
        setIsLoading(true);
        try {
            const storeItem = storeIntegrations.find(s => s.type === integration.id);
            if (storeItem) {
                await disconnectIntegration(storeItem.id);
            }
        setIntegrations(prev => prev.map(item =>
                item.id === integration.id ? { ...item, connected: false } : item
        ));
        } catch (error) {
            console.error('Failed to disconnect:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const openConfigModal = (integration: Integration) => {
        setSelectedIntegration(integration);
        setIsConfigModalOpen(true);
    };

    return (
        <div className="min-h-screen p-8 max-w-7xl mx-auto">
            <header className="mb-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/30 flex items-center justify-center">
                        <Globe className="text-white w-6 h-6" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Integrations Hub</h1>
                </div>
                <p className="text-muted-foreground max-w-2xl">
                    Supercharge your workflow by connecting Flux with your favorite tools. Manage permissions and settings all in one place.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                {integrations.map((item) => (
                    <div
                        key={item.id}
                        className={cn(
                            "bg-card rounded-3xl p-6 border transition-all duration-200 shadow-sm hover:shadow-md flex flex-col h-full",
                            item.connected ? "border-violet-500/30 dark:border-violet-500/30 ring-1 ring-violet-500/10 dark:ring-violet-500/10" : "border-border/50"
                        )}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
                                "bg-muted"
                            )}>
                                <item.icon className="w-6 h-6 text-card-foreground" />
                            </div>
                            <Badge variant={item.connected ? "default" : "secondary"}>
                                {item.connected ? "Active" : "Disconnected"}
                            </Badge>
                        </div>

                        <div className="mb-4 flex-1">
                            <h3 className="text-lg font-bold text-card-foreground mb-1">{item.name}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {item.description}
                            </p>
                        </div>

                        <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                {item.category}
                            </span>
                            {item.connected ? (
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => openConfigModal(item)}
                                    >
                                        Configure
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleDisconnect(item)}
                                        disabled={isLoading}
                                    >
                                        Disconnect
                                    </Button>
                                </div>
                            ) : (
                            <Button
                                size="sm"
                                    variant="primary"
                                    onClick={() => openConfigModal(item)}
                            >
                                    Connect
                            </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Integration Config Modal */}
            <Modal 
                isOpen={isConfigModalOpen} 
                onClose={() => { setIsConfigModalOpen(false); setApiKey(''); }}
                title={`${selectedIntegration?.connected ? 'Configure' : 'Connect'} ${selectedIntegration?.name}`}
            >
                <div className="space-y-4">
                    {selectedIntegration && (
                        <>
                            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                                <selectedIntegration.icon className="w-8 h-8 text-card-foreground" />
                                <div>
                                    <h3 className="font-semibold text-foreground">{selectedIntegration.name}</h3>
                                    <p className="text-sm text-muted-foreground">{selectedIntegration.description}</p>
                                </div>
                            </div>

                            {!selectedIntegration.connected && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-card-foreground">API Key / Access Token</label>
                                    <input
                                        type="password"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder={`Enter your ${selectedIntegration.name} API key`}
                                        className="flex h-10 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-slate-50"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Your API key will be securely stored and used only for {selectedIntegration.name} integration.
                                    </p>
                                </div>
                            )}

                            {selectedIntegration.connected && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                        <Check size={16} />
                                        <span className="text-sm font-medium">Connected successfully</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        You can manage sync settings and permissions for this integration.
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4">
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    onClick={() => { setIsConfigModalOpen(false); setApiKey(''); }}
                                >
                                    Cancel
                                </Button>
                                {!selectedIntegration.connected ? (
                                    <Button 
                                        onClick={handleConnect}
                                        disabled={isLoading || !apiKey.trim()}
                                    >
                                        {isLoading ? 'Connecting...' : 'Connect'}
                                    </Button>
                                ) : (
                                    <Button 
                                        onClick={() => setIsConfigModalOpen(false)}
                                    >
                                        Done
                                    </Button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
}
