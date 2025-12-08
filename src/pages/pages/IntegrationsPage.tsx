// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Button, Modal, Card } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { 
    Github, Slack, Figma, Trello, Mail, Globe, Database, Server, 
    X, Check, ExternalLink, Plug, RefreshCw, AlertCircle, 
    GitBranch, GitPullRequest, CircleDot, Download, Loader2 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFluxStore } from '@/lib/store';
import { GitHubConnector } from '@/lib/integrations/github';

interface Integration {
    id: string;
    name: string;
    description: string;
    icon: React.ElementType;
    connected: boolean;
    category: 'Communication' | 'Development' | 'Design' | 'Productivity';
}

// GitHub data types
interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
    open_issues_count: number;
    private: boolean;
}

interface GitHubIssue {
    id: number;
    number: number;
    title: string;
    state: string;
    html_url: string;
    labels: { name: string; color: string }[];
    created_at: string;
}

const INTEGRATIONS: Integration[] = [
    {
        id: 'github',
        name: 'GitHub',
        description: 'Sync issues, pull requests, and commit history directly to your tasks.',
        icon: Github,
        connected: false,
        category: 'Development',
    },
    {
        id: 'slack',
        name: 'Slack',
        description: 'Receive notifications and update tasks via slash commands in Slack channels.',
        icon: Slack,
        connected: false,
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
        connected: false,
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

// Storage key for integration tokens
const INTEGRATION_STORAGE_KEY = 'flux_integration_tokens';

function getStoredToken(provider: string): string | null {
    try {
        const stored = localStorage.getItem(INTEGRATION_STORAGE_KEY);
        if (stored) {
            const tokens = JSON.parse(stored);
            return tokens[provider] || null;
        }
    } catch {}
    return null;
}

function storeToken(provider: string, token: string): void {
    try {
        const stored = localStorage.getItem(INTEGRATION_STORAGE_KEY);
        const tokens = stored ? JSON.parse(stored) : {};
        tokens[provider] = token;
        localStorage.setItem(INTEGRATION_STORAGE_KEY, JSON.stringify(tokens));
    } catch {}
}

function removeToken(provider: string): void {
    try {
        const stored = localStorage.getItem(INTEGRATION_STORAGE_KEY);
        if (stored) {
            const tokens = JSON.parse(stored);
            delete tokens[provider];
            localStorage.setItem(INTEGRATION_STORAGE_KEY, JSON.stringify(tokens));
        }
    } catch {}
}

export default function IntegrationsPage() {
    const { createTask } = useFluxStore();
    
    const [integrations, setIntegrations] = useState(INTEGRATIONS);
    const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // GitHub-specific state
    const [githubUser, setGithubUser] = useState<{ login: string; avatar_url: string; name: string } | null>(null);
    const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([]);
    const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
    const [repoIssues, setRepoIssues] = useState<GitHubIssue[]>([]);
    const [isLoadingRepos, setIsLoadingRepos] = useState(false);
    const [isLoadingIssues, setIsLoadingIssues] = useState(false);
    const [importingIssues, setImportingIssues] = useState<Set<number>>(new Set());

    // Load stored connections on mount
    useEffect(() => {
        const githubToken = getStoredToken('github');
        if (githubToken) {
            verifyGitHubConnection(githubToken);
        }
    }, []);

    const verifyGitHubConnection = async (token: string) => {
        try {
            const connector = new GitHubConnector(token);
            const user = await connector.getCurrentUser();
            setGithubUser(user);
            setIntegrations(prev => prev.map(i => 
                i.id === 'github' ? { ...i, connected: true } : i
            ));
            
            // Load repos
            setIsLoadingRepos(true);
            const repos = await connector.getRepositories({ sort: 'updated', perPage: 50 });
            setGithubRepos(repos);
            setIsLoadingRepos(false);
        } catch (err) {
            console.error('GitHub verification failed:', err);
            removeToken('github');
        }
    };

    const handleGitHubConnect = async () => {
        if (!apiKey.trim()) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const connector = new GitHubConnector(apiKey);
            const user = await connector.getCurrentUser();
            
            // Success! Store token and update state
            storeToken('github', apiKey);
            setGithubUser(user);
            setIntegrations(prev => prev.map(i => 
                i.id === 'github' ? { ...i, connected: true } : i
            ));
            
            // Load repos
            setIsLoadingRepos(true);
            const repos = await connector.getRepositories({ sort: 'updated', perPage: 50 });
            setGithubRepos(repos);
            setIsLoadingRepos(false);
            
            setApiKey('');
        } catch (err: any) {
            setError(err.message || 'Failed to connect. Check your token.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGitHubDisconnect = () => {
        removeToken('github');
        setGithubUser(null);
        setGithubRepos([]);
        setSelectedRepo(null);
        setRepoIssues([]);
        setIntegrations(prev => prev.map(i => 
            i.id === 'github' ? { ...i, connected: false } : i
        ));
        setIsConfigModalOpen(false);
    };

    const loadRepoIssues = async (repoFullName: string) => {
        const token = getStoredToken('github');
        if (!token) return;
        
        setSelectedRepo(repoFullName);
        setIsLoadingIssues(true);
        setRepoIssues([]);
        
        try {
            const [owner, repo] = repoFullName.split('/');
            const connector = new GitHubConnector(token);
            const issues = await connector.getIssues(owner, repo, { state: 'open', perPage: 50 });
            setRepoIssues(issues);
        } catch (err) {
            console.error('Failed to load issues:', err);
        } finally {
            setIsLoadingIssues(false);
        }
    };

    const importIssueAsTask = async (issue: GitHubIssue) => {
        const token = getStoredToken('github');
        if (!token || !selectedRepo) return;
        
        setImportingIssues(prev => new Set(prev).add(issue.id));
        
        try {
            const connector = new GitHubConnector(token);
            const taskData = connector.issueToFluxTask(issue as any, selectedRepo);
            
            await createTask({
                title: taskData.title || issue.title,
                description: taskData.description || `GitHub Issue #${issue.number}\n\n${issue.html_url}`,
                status: 'todo',
                priority: taskData.priority || 'medium',
                tags: taskData.tags || issue.labels.map(l => l.name),
            });
            
            // Show success briefly
            setTimeout(() => {
                setImportingIssues(prev => {
                    const next = new Set(prev);
                    next.delete(issue.id);
                    return next;
                });
            }, 1000);
        } catch (err) {
            console.error('Failed to import issue:', err);
            setImportingIssues(prev => {
                const next = new Set(prev);
                next.delete(issue.id);
                return next;
            });
        }
    };

    const openConfigModal = (integration: Integration) => {
        setSelectedIntegration(integration);
        setIsConfigModalOpen(true);
        setError(null);
        setApiKey('');
    };

    const closeModal = () => {
        setIsConfigModalOpen(false);
        setApiKey('');
        setError(null);
        setSelectedRepo(null);
        setRepoIssues([]);
    };

    // Render GitHub configuration panel
    const renderGitHubConfig = () => {
        const integration = integrations.find(i => i.id === 'github');
        const isConnected = integration?.connected;

        if (!isConnected) {
            return (
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                        <Github className="w-8 h-8 text-card-foreground" />
                        <div>
                            <h3 className="font-semibold text-foreground">GitHub</h3>
                            <p className="text-sm text-muted-foreground">Connect with a Personal Access Token</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-card-foreground">Personal Access Token</label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="github_pat_xxxxxxxxxxxx"
                            className="flex h-10 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-slate-50"
                        />
                        <p className="text-xs text-muted-foreground">
                            Generate at{' '}
                            <a 
                                href="https://github.com/settings/tokens?type=beta" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-violet-500 hover:underline"
                            >
                                github.com/settings/tokens
                            </a>
                            {' '}with repo and user scopes.
                        </p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={closeModal}>Cancel</Button>
                        <Button 
                            onClick={handleGitHubConnect}
                            disabled={isLoading || !apiKey.trim()}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Connecting...
                                </>
                            ) : 'Connect'}
                        </Button>
                    </div>
                </div>
            );
        }

        // Connected state - show repos and issues
        return (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                {/* User info */}
                <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-3">
                        {githubUser?.avatar_url && (
                            <img src={githubUser.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                        )}
                        <div>
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-emerald-600" />
                                <span className="font-medium text-emerald-700 dark:text-emerald-300">Connected</span>
                            </div>
                            <p className="text-sm text-emerald-600 dark:text-emerald-400">
                                @{githubUser?.login}
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleGitHubDisconnect} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        Disconnect
                    </Button>
                </div>

                {/* Repository selector */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                        <GitBranch size={14} />
                        Your Repositories
                    </label>
                    {isLoadingRepos ? (
                        <div className="flex items-center gap-2 text-muted-foreground py-4">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading repositories...
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2">
                            {githubRepos.map(repo => (
                                <button
                                    key={repo.id}
                                    onClick={() => loadRepoIssues(repo.full_name)}
                                    className={cn(
                                        "flex items-center justify-between p-3 rounded-lg border text-left transition-all",
                                        selectedRepo === repo.full_name
                                            ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                                            : "border-border hover:border-violet-300 hover:bg-muted/50"
                                    )}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm truncate">{repo.name}</span>
                                            {repo.private && (
                                                <Badge variant="secondary" className="text-xs">Private</Badge>
                                            )}
                                        </div>
                                        {repo.description && (
                                            <p className="text-xs text-muted-foreground truncate mt-0.5">{repo.description}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
                                        <CircleDot size={12} />
                                        {repo.open_issues_count}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Issues list */}
                {selectedRepo && (
                    <div className="space-y-2 pt-2 border-t border-border">
                        <label className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                            <CircleDot size={14} />
                            Open Issues in {selectedRepo.split('/')[1]}
                        </label>
                        {isLoadingIssues ? (
                            <div className="flex items-center gap-2 text-muted-foreground py-4">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading issues...
                            </div>
                        ) : repoIssues.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4">No open issues in this repository.</p>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                {repoIssues.map(issue => (
                                    <div
                                        key={issue.id}
                                        className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-all"
                                    >
                                        <div className="flex-1 min-w-0 mr-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">#{issue.number}</span>
                                                <span className="font-medium text-sm truncate">{issue.title}</span>
                                            </div>
                                            {issue.labels.length > 0 && (
                                                <div className="flex gap-1 mt-1 flex-wrap">
                                                    {issue.labels.slice(0, 3).map(label => (
                                                        <span
                                                            key={label.name}
                                                            className="px-1.5 py-0.5 text-xs rounded-full"
                                                            style={{ 
                                                                backgroundColor: `#${label.color}20`,
                                                                color: `#${label.color}`
                                                            }}
                                                        >
                                                            {label.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => importIssueAsTask(issue)}
                                            disabled={importingIssues.has(issue.id)}
                                            className="shrink-0"
                                        >
                                            {importingIssues.has(issue.id) ? (
                                                <Check className="w-4 h-4 text-emerald-500" />
                                            ) : (
                                                <>
                                                    <Download size={14} className="mr-1" />
                                                    Import
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-end pt-4 border-t border-border">
                    <Button onClick={closeModal}>Done</Button>
                </div>
            </div>
        );
    };

    // Generic placeholder for other integrations
    const renderGenericConfig = () => {
        if (!selectedIntegration) return null;
        
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                    <selectedIntegration.icon className="w-8 h-8 text-card-foreground" />
                    <div>
                        <h3 className="font-semibold text-foreground">{selectedIntegration.name}</h3>
                        <p className="text-sm text-muted-foreground">{selectedIntegration.description}</p>
                    </div>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                        {selectedIntegration.name} integration is coming soon. GitHub is currently the only fully functional integration.
                    </p>
                </div>

                <div className="flex justify-end pt-4">
                    <Button variant="ghost" onClick={closeModal}>Close</Button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen p-8 pt-16 max-w-7xl mx-auto">
            <header className="mb-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/30 flex items-center justify-center">
                        <Plug className="text-white w-6 h-6" />
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
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openConfigModal(item)}
                                >
                                    Configure
                                </Button>
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
                onClose={closeModal}
                title={`${selectedIntegration?.connected ? 'Configure' : 'Connect'} ${selectedIntegration?.name || ''}`}
                size="lg"
            >
                {selectedIntegration?.id === 'github' ? renderGitHubConfig() : renderGenericConfig()}
            </Modal>
        </div>
    );
}
