// @ts-nocheck
// =====================================
// FLUX - Sprint Planning (Workflow-Aware)
// Supports: Agile, CCaaS, ITSM modes
// Last Updated: Dec 07, 2025
// =====================================

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Timer,
    Layers,
    KanbanSquare,
    Rocket,
    Calendar,
    Plus,
    Play,
    Pause,
    Headphones,
    Server
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';
import { CheckCircle2, Clock, AlertCircle, Users } from 'lucide-react';
import { useFluxStore } from '@/lib/store';
import { CreateTaskModal } from '@/features/tasks';
import { WorkflowSelector } from '@/components/WorkflowSelector';
import { getWorkflow } from '@/lib/workflows';

// Local storage for sprint config
const SPRINT_KEY = 'flux_sprint_config';
const getSprintConfig = () => {
    try {
        const stored = localStorage.getItem(SPRINT_KEY);
        return stored ? JSON.parse(stored) : { name: 'Sprint 42', duration: 14, capacity: 40, goal: 'Complete user authentication and dashboard MVP', daysRemaining: 5 };
    } catch {
        return { name: 'Sprint 42', duration: 14, capacity: 40, goal: '', daysRemaining: 5 };
    }
};

// Workflow-specific icons
const WORKFLOW_ICONS = {
    agile: Rocket,
    ccaas: Headphones,
    itsm: Server,
};

// Workflow-specific colors
const WORKFLOW_COLORS = {
    agile: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', accent: 'emerald' },
    ccaas: { bg: 'bg-blue-500/10', text: 'text-blue-500', accent: 'blue' },
    itsm: { bg: 'bg-violet-500/10', text: 'text-violet-500', accent: 'violet' },
};

export default function SprintPage() {
    const { tasks, updateTask, workflowMode } = useFluxStore();
    const [activeTab, setActiveTab] = useState('board');
    const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
    const [sprintConfig, setSprintConfig] = useState(getSprintConfig);

    // Get workflow configuration
    const workflow = useMemo(() => getWorkflow(workflowMode), [workflowMode]);
    const WorkflowIcon = WORKFLOW_ICONS[workflowMode];
    const colors = WORKFLOW_COLORS[workflowMode];

    // Workflow-specific labels
    const getLabels = () => {
        switch (workflowMode) {
            case 'ccaas':
                return { 
                    item: 'Ticket', 
                    items: 'Tickets', 
                    sprint: 'Queue',
                    sprintPlural: 'Queues',
                    planning: 'Queue Management'
                };
            case 'itsm':
                return { 
                    item: 'Incident', 
                    items: 'Incidents', 
                    sprint: 'Change Window',
                    sprintPlural: 'Change Windows',
                    planning: 'Change Planning'
                };
            default:
                return { 
                    item: 'Task', 
                    items: 'Tasks', 
                    sprint: 'Sprint',
                    sprintPlural: 'Sprints',
                    planning: 'Sprint Planning'
                };
        }
    };
    const labels = getLabels();

    // Get active workflow columns (exclude done/closed for the board view)
    const activeColumns = useMemo(() => {
        return workflow.columns.filter(col => col.category !== 'backlog');
    }, [workflow]);

    // Calculate stats based on workflow columns
    const stats = useMemo(() => {
        const doneColumns = workflow.columns.filter(c => c.category === 'done').map(c => c.id);
        const activeColumnIds = workflow.columns.filter(c => c.category === 'active').map(c => c.id);
        const reviewColumnIds = workflow.columns.filter(c => c.category === 'review').map(c => c.id);
        
        return {
            completed: tasks.filter(t => doneColumns.includes(t.status)).length,
            inProgress: tasks.filter(t => activeColumnIds.includes(t.status)).length,
            blocked: tasks.filter(t => t.priority === 'urgent').length,
            review: tasks.filter(t => reviewColumnIds.includes(t.status)).length,
            total: tasks.length,
        };
    }, [tasks, workflow]);

    // Group tasks by status for sprint board
    const tasksByStatus = useMemo(() => {
        const grouped = {};
        workflow.columns.forEach(col => {
            grouped[col.id] = tasks.filter(t => t.status === col.id);
        });
        return grouped;
    }, [tasks, workflow]);

    // Get backlog items
    const backlogItems = useMemo(() => {
        const backlogStatuses = workflow.columns.filter(c => c.category === 'backlog').map(c => c.id);
        return tasks.filter(t => backlogStatuses.includes(t.status));
    }, [tasks, workflow]);

    const handleSaveSprintConfig = () => {
        localStorage.setItem(SPRINT_KEY, JSON.stringify(sprintConfig));
    };

    // Get next status in workflow
    const getNextStatus = (currentStatus) => {
        const currentIndex = workflow.columns.findIndex(c => c.id === currentStatus);
        const nextColumn = workflow.columns[currentIndex + 1];
        return nextColumn?.id || currentStatus;
    };

    // Get first active status
    const getFirstActiveStatus = () => {
        const activeCol = workflow.columns.find(c => c.category === 'active');
        return activeCol?.id || workflow.columns[0].id;
    };

    const tabs = [
        { id: 'board', label: `Active ${labels.sprint} Board`, icon: KanbanSquare },
        { id: 'backlog', label: 'Backlog Grooming', icon: Layers },
        { id: 'management', label: labels.planning, icon: Calendar },
    ];

    return (
        <div className="p-8 pt-16 max-w-[1800px] mx-auto space-y-6 min-h-screen flex flex-col">
            
            {/* Workflow Selector */}
            <div className="flex items-center justify-between">
                <WorkflowSelector variant="pills" />
                <div className="text-xs text-muted-foreground">
                    {workflow.columns.length} workflow stages
                </div>
            </div>
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${colors.bg} ${colors.text}`}>
                            <WorkflowIcon size={24} />
                        </div>
                        {workflow.name} - {labels.planning}
                    </h1>
                    <p className="text-muted-foreground mt-1 font-medium ml-12">
                        {workflowMode === 'agile' 
                            ? 'Plan sprints, groom the backlog, and track velocity.'
                            : workflowMode === 'ccaas'
                            ? 'Manage ticket queues, prioritize, and track resolution.'
                            : 'Plan changes, manage incidents, and track resolution.'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                   <div className={`flex items-center gap-2 px-3 py-1.5 bg-${colors.accent}-50 dark:bg-${colors.accent}-900/20 text-${colors.accent}-700 dark:text-${colors.accent}-300 rounded-full text-sm font-semibold border border-${colors.accent}-100 dark:border-${colors.accent}-800`}>
                        <Timer size={14} />
                        <span>{sprintConfig.name}: {sprintConfig.daysRemaining} Days Remaining</span>
                   </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-border/50 pb-1 shrink-0">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                relative flex items-center gap-2 px-4 py-3 rounded-t-lg font-medium text-sm transition-all
                                ${isActive 
                                    ? `text-${colors.accent}-600 dark:text-${colors.accent}-400 bg-${colors.accent}-50/50 dark:bg-${colors.accent}-900/10` 
                                    : 'text-muted-foreground hover:text-foreground hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                }
                            `}
                        >
                            <tab.icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                            {tab.label}
                            {isActive && (
                                <motion.div
                                    layoutId="sprintActiveTabIndicator"
                                    className={`absolute bottom-0 left-0 right-0 h-0.5 bg-${colors.accent}-500`}
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="relative flex-1 min-h-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${activeTab}-${workflowMode}`}
                        initial={{ opacity: 0, scale: 0.99 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.99 }}
                        transition={{ duration: 0.2 }}
                        className="h-full"
                    >
                        {activeTab === 'board' && (
                            <div className="h-full space-y-6">
                                {/* Stats - Workflow Aware */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <Card variant="elevated" padding="md" className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                                            <CheckCircle2 size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Completed</p>
                                            <p className="text-xl font-bold">{stats.completed}</p>
                                        </div>
                                    </Card>
                                    <Card variant="elevated" padding="md" className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">In Progress</p>
                                            <p className="text-xl font-bold">{stats.inProgress}</p>
                                        </div>
                                    </Card>
                                    <Card variant="elevated" padding="md" className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                                            <AlertCircle size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                {workflowMode === 'ccaas' ? 'Escalated' : workflowMode === 'itsm' ? 'Critical' : 'Urgent'}
                                            </p>
                                            <p className="text-xl font-bold">{stats.blocked}</p>
                                        </div>
                                    </Card>
                                    <Card variant="elevated" padding="md" className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center ${colors.text}`}>
                                            <Layers size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Total {labels.items}</p>
                                            <p className="text-xl font-bold">{stats.total}</p>
                                        </div>
                                    </Card>
                                </div>
                                
                                {/* Dynamic Workflow Board */}
                                <Card variant="elevated" padding="lg" className="min-h-[400px] overflow-x-auto">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold">{labels.sprint} Board</h3>
                                        <Button variant="primary" size="sm" onClick={() => setIsCreateTaskOpen(true)}>
                                            <Plus size={14} className="mr-1" />
                                            Add {labels.item}
                                        </Button>
                                    </div>
                                    <div className="flex gap-4 min-w-max pb-4">
                                        {activeColumns.map((col) => (
                                            <div 
                                                key={col.id} 
                                                className={`w-[220px] shrink-0 rounded-xl p-4 min-h-[300px] ${col.color} ${col.darkColor}`}
                                            >
                                                <div className="flex justify-between items-center mb-3">
                                                    <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                                                        {col.title}
                                                    </h4>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {tasksByStatus[col.id]?.length || 0}
                                                    </Badge>
                                                </div>
                                                <div className="space-y-2">
                                                    {tasksByStatus[col.id]?.map((task) => (
                                                        <Card 
                                                            key={task.id} 
                                                            variant="hover" 
                                                            padding="sm" 
                                                            className="cursor-pointer group"
                                                            onClick={() => {
                                                                const nextStatus = getNextStatus(task.status);
                                                                if (nextStatus !== task.status) {
                                                                    updateTask(task.id, { status: nextStatus });
                                                                }
                                                            }}
                                                        >
                                                            <p className="text-sm font-medium">{task.title}</p>
                                                            <div className="flex items-center justify-between mt-1">
                                                                <p className="text-xs text-muted-foreground capitalize">{task.priority}</p>
                                                                <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    Click to advance →
                                                                </span>
                                                            </div>
                                                        </Card>
                                                    ))}
                                                    {(!tasksByStatus[col.id] || tasksByStatus[col.id].length === 0) && (
                                                        <p className="text-xs text-muted-foreground text-center py-4">
                                                            No {labels.items.toLowerCase()}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        )}

                        {activeTab === 'backlog' && (
                            <Card variant="elevated" padding="lg" className="min-h-[500px]">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold">
                                            {workflowMode === 'ccaas' ? 'Ticket Queue' : workflowMode === 'itsm' ? 'Incident Queue' : 'Backlog Items'}
                                        </h3>
                                        <p className="text-muted-foreground text-sm">
                                            Click to move {labels.items.toLowerCase()} to active work.
                                        </p>
                                    </div>
                                    <Button variant="primary" size="sm" onClick={() => setIsCreateTaskOpen(true)}>
                                        <Plus size={14} className="mr-1" />
                                        Add {labels.item}
                                    </Button>
                                </div>
                                <div className="mt-6 space-y-3">
                                    {backlogItems.map((task) => (
                                        <Card 
                                            key={task.id} 
                                            variant="hover" 
                                            padding="md" 
                                            className="cursor-pointer flex justify-between items-center group"
                                            onClick={() => updateTask(task.id, { status: getFirstActiveStatus() })}
                                        >
                                            <div>
                                                <span className="font-medium">{task.title}</span>
                                                {task.description && (
                                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{task.description}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={task.priority === 'high' || task.priority === 'urgent' ? 'destructive' : 'secondary'} className="capitalize">
                                                    {task.priority}
                                                </Badge>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="opacity-0 group-hover:opacity-100"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        updateTask(task.id, { status: getFirstActiveStatus() });
                                                    }}
                                                >
                                                    <Play size={14} className="mr-1" />
                                                    Start
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}
                                    {backlogItems.length === 0 && (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <Layers size={32} className="mx-auto mb-2 opacity-50" />
                                            <p>No {labels.items.toLowerCase()} in queue</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}

                        {activeTab === 'management' && (
                            <Card variant="elevated" padding="lg" className="min-h-[500px]">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold">{labels.planning}</h3>
                                        <p className="text-muted-foreground text-sm">
                                            Configure {labels.sprint.toLowerCase()} duration, capacity, and goals.
                                        </p>
                                    </div>
                                    <Button variant="primary" onClick={handleSaveSprintConfig}>
                                        Save Configuration
                                    </Button>
                                </div>
                                <div className="mt-6 grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <label className="block">
                                            <span className="text-sm font-medium">{labels.sprint} Name</span>
                                            <input 
                                                type="text" 
                                                value={sprintConfig.name}
                                                onChange={(e) => setSprintConfig({...sprintConfig, name: e.target.value})}
                                                className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground" 
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="text-sm font-medium">Duration (days)</span>
                                            <input 
                                                type="number" 
                                                value={sprintConfig.duration}
                                                onChange={(e) => setSprintConfig({...sprintConfig, duration: parseInt(e.target.value) || 14})}
                                                className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground" 
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="text-sm font-medium">Days Remaining</span>
                                            <input 
                                                type="number" 
                                                value={sprintConfig.daysRemaining}
                                                onChange={(e) => setSprintConfig({...sprintConfig, daysRemaining: parseInt(e.target.value) || 0})}
                                                className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground" 
                                            />
                                        </label>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="block">
                                            <span className="text-sm font-medium">Team Capacity (points)</span>
                                            <input 
                                                type="number" 
                                                value={sprintConfig.capacity}
                                                onChange={(e) => setSprintConfig({...sprintConfig, capacity: parseInt(e.target.value) || 40})}
                                                className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground" 
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="text-sm font-medium">{labels.sprint} Goal</span>
                                            <textarea 
                                                value={sprintConfig.goal}
                                                onChange={(e) => setSprintConfig({...sprintConfig, goal: e.target.value})}
                                                className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground" 
                                                rows={3} 
                                            />
                                        </label>
                                    </div>
                                </div>
                                <div className="mt-6 p-4 bg-muted/50 rounded-xl">
                                    <h4 className="font-medium mb-2">{labels.sprint} Summary</h4>
                                    <div className="grid grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Total {labels.items}</p>
                                            <p className="font-bold text-lg">{tasks.length}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Completed</p>
                                            <p className="font-bold text-lg text-emerald-600">{stats.completed}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">In Progress</p>
                                            <p className="font-bold text-lg text-blue-600">{stats.inProgress}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Completion</p>
                                            <p className="font-bold text-lg">{tasks.length > 0 ? Math.round((stats.completed / tasks.length) * 100) : 0}%</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
            
             <div className="text-xs text-slate-400 mt-4 border-t border-border pt-4 flex justify-between shrink-0">
                 <span>Flux {workflow.name} Module v1.5</span>
                 <span>Dec 07, 2025</span>
            </div>
            
            <CreateTaskModal isOpen={isCreateTaskOpen} onClose={() => setIsCreateTaskOpen(false)} />
        </div>
    );
}
