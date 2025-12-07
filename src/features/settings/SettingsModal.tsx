// @ts-nocheck
import { useFluxStore } from '@/lib/store';
import { Modal, Button } from '@/components/ui';
import { Moon, Sun, Monitor, Rocket, Headphones, Server } from 'lucide-react';
import { WorkflowSelector } from '@/components/WorkflowSelector';

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { theme, setTheme, user, logout, workflowMode } = useFluxStore();

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Settings" size="md">
            <div className="space-y-6">
                {/* User Profile Section */}
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl border border-border">
                    <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-300 font-bold text-xl">
                        {user?.name?.[0] || 'U'}
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{user?.name || 'Guest User'}</h3>
                        <p className="text-sm text-muted-foreground">{user?.email || 'Not logged in'}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={logout}>
                        Log out
                    </Button>
                </div>

                {/* Workflow Mode Section */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        Workflow Mode
                    </h4>
                    <p className="text-xs text-muted-foreground">
                        Choose the workflow that matches your team's process. This changes the board columns and terminology.
                    </p>
                    <WorkflowSelector variant="dropdown" />
                </div>

                {/* Appearance Section */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        Appearance
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={() => setTheme('light')}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${theme === 'light'
                                    ? 'bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-900/20 dark:border-violet-800 dark:text-violet-300'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-muted dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'
                                }`}
                        >
                            <Sun size={20} />
                            <span className="text-xs font-medium">Light</span>
                        </button>
                        <button
                            onClick={() => setTheme('dark')}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${theme === 'dark'
                                    ? 'bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-900/20 dark:border-violet-800 dark:text-violet-300'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-muted dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'
                                }`}
                        >
                            <Moon size={20} />
                            <span className="text-xs font-medium">Dark</span>
                        </button>
                        <button
                            onClick={() => setTheme('system')}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${theme === 'system'
                                    ? 'bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-900/20 dark:border-violet-800 dark:text-violet-300'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-muted dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'
                                }`}
                        >
                            <Monitor size={20} />
                            <span className="text-xs font-medium">System</span>
                        </button>
                    </div>
                </div>

                {/* About Section */}
                <div className="pt-4 border-t border-border">
                    <p className="text-xs text-center text-slate-400">
                        Flux App v1.0.0
                    </p>
                </div>
            </div>
        </Modal>
    );
}
