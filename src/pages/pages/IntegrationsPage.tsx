// @ts-nocheck
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Github, Slack, Figma, Trello, Mail, Globe, Database, Server } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    // Local state for connections just for UI demo
    const [integrations, setIntegrations] = useState(INTEGRATIONS);

    const toggleConnection = (id: string) => {
        setIntegrations(prev => prev.map(item =>
            item.id === id ? { ...item, connected: !item.connected } : item
        ));
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
                            <Button
                                size="sm"
                                variant={item.connected ? "outline" : "primary"}
                                onClick={() => {
                                    toggleConnection(item.id);
                                    alert(item.connected ? `Disconnecting ${item.name}...` : `Connecting ${item.name}...`);
                                }}
                            >
                                {item.connected ? "Configure" : "Connect"}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
