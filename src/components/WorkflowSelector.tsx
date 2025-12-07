// =====================================
// FLUX - Workflow Mode Selector
// Toggle between Agile, CCaaS, and ITSM modes
// Last Updated: 14:35:00 Dec 07, 2025
// =====================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Rocket, 
    Headphones, 
    Server, 
    ChevronDown, 
    Check,
    Settings2
} from 'lucide-react';
import { useFluxStore } from '@/lib/store';
import { WORKFLOWS, type WorkflowMode } from '@/lib/workflows';
import { cn } from '@/lib/utils';

const WORKFLOW_ICONS = {
    agile: Rocket,
    ccaas: Headphones,
    itsm: Server,
};

const WORKFLOW_COLORS = {
    agile: 'text-orange-700 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-300',
    ccaas: 'text-teal-700 bg-teal-50 dark:bg-teal-900/20 dark:text-teal-300',
    itsm: 'text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-300',
};

interface WorkflowSelectorProps {
    variant?: 'dropdown' | 'pills' | 'compact';
    className?: string;
}

export function WorkflowSelector({ variant = 'dropdown', className }: WorkflowSelectorProps) {
    const { workflowMode, setWorkflowMode } = useFluxStore();
    const [isOpen, setIsOpen] = useState(false);

    const currentWorkflow = WORKFLOWS[workflowMode];
    const CurrentIcon = WORKFLOW_ICONS[workflowMode];

    if (variant === 'pills') {
        return (
            <div className={cn("flex items-center gap-2 p-1 bg-muted/50 rounded-xl", className)}>
                {Object.entries(WORKFLOWS).map(([key, workflow]) => {
                    const Icon = WORKFLOW_ICONS[key as WorkflowMode];
                    const isActive = workflowMode === key;
                    
                    return (
                        <button
                            key={key}
                            onClick={() => setWorkflowMode(key as WorkflowMode)}
                            className={cn(
                                "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                isActive 
                                    ? "bg-white dark:bg-slate-800 text-foreground shadow-sm" 
                                    : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-slate-800/50"
                            )}
                        >
                            <Icon size={16} />
                            <span className="hidden sm:inline">{workflow.name}</span>
                            {isActive && (
                                <motion.div
                                    layoutId="workflowIndicator"
                                    className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg -z-10 shadow-sm"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        );
    }

    if (variant === 'compact') {
        return (
            <div className={cn("relative", className)}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "flex items-center gap-2 p-2 rounded-lg transition-colors",
                        WORKFLOW_COLORS[workflowMode]
                    )}
                    title={`Current: ${currentWorkflow.name}`}
                >
                    <CurrentIcon size={18} />
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <>
                            <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setIsOpen(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-border z-50 overflow-hidden"
                            >
                                <div className="p-3 border-b border-border bg-muted/30">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        <Settings2 size={12} />
                                        Workflow Mode
                                    </div>
                                </div>
                                <div className="p-2">
                                    {Object.entries(WORKFLOWS).map(([key, workflow]) => {
                                        const Icon = WORKFLOW_ICONS[key as WorkflowMode];
                                        const isActive = workflowMode === key;
                                        
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => {
                                                    setWorkflowMode(key as WorkflowMode);
                                                    setIsOpen(false);
                                                }}
                                                className={cn(
                                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                                                    isActive 
                                                        ? WORKFLOW_COLORS[key as WorkflowMode]
                                                        : "hover:bg-muted/50"
                                                )}
                                            >
                                                <Icon size={18} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm">{workflow.name}</div>
                                                    <div className="text-xs text-muted-foreground truncate">
                                                        {workflow.columns.length} stages
                                                    </div>
                                                </div>
                                                {isActive && (
                                                    <Check size={16} className="text-emerald-500 shrink-0" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // Default: dropdown variant
    return (
        <div className={cn("relative", className)}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors text-left",
                    isOpen && "ring-2 ring-violet-500/20 border-violet-200"
                )}
            >
                <div className={cn("p-2 rounded-lg", WORKFLOW_COLORS[workflowMode])}>
                    <CurrentIcon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground">{currentWorkflow.name}</div>
                    <div className="text-xs text-muted-foreground">{currentWorkflow.description}</div>
                </div>
                <ChevronDown 
                    size={18} 
                    className={cn(
                        "text-muted-foreground transition-transform",
                        isOpen && "rotate-180"
                    )} 
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-border z-50 overflow-hidden"
                        >
                            <div className="p-2">
                                {Object.entries(WORKFLOWS).map(([key, workflow]) => {
                                    const Icon = WORKFLOW_ICONS[key as WorkflowMode];
                                    const isActive = workflowMode === key;
                                    
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => {
                                                setWorkflowMode(key as WorkflowMode);
                                                setIsOpen(false);
                                            }}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                                                isActive 
                                                    ? WORKFLOW_COLORS[key as WorkflowMode]
                                                    : "hover:bg-muted/50"
                                            )}
                                        >
                                            <div className={cn(
                                                "p-2 rounded-lg",
                                                isActive ? "bg-white/50 dark:bg-black/20" : "bg-muted"
                                            )}>
                                                <Icon size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold">{workflow.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {workflow.description}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground mt-1">
                                                    {workflow.columns.map(c => c.title).join(' → ')}
                                                </div>
                                            </div>
                                            {isActive && (
                                                <Check size={18} className="text-emerald-500 shrink-0" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

export default WorkflowSelector;

// 14:35:00 Dec 07, 2025

