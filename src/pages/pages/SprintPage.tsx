// @ts-nocheck
// =====================================
// FLUX - Agile Sprint Planning
// Style: Glassmorphism & Glowing Accents
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
    Pause
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';
import { CheckCircle2, Clock, AlertCircle, Users } from 'lucide-react';
import { useFluxStore } from '@/lib/store';
import { CreateTaskModal } from '@/features/tasks';

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

export default function SprintPage() {
    const { tasks, updateTask } = useFluxStore();
    const [activeTab, setActiveTab] = useState('board');
    const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
    const [sprintConfig, setSprintConfig] = useState(getSprintConfig);

    // Calculate real stats from tasks
    const stats = useMemo(() => ({
        completed: tasks.filter(t => t.status === 'done').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        blocked: tasks.filter(t => t.priority === 'urgent').length,
        todo: tasks.filter(t => t.status === 'todo').length,
        codeReview: tasks.filter(t => t.status === 'code-review').length,
        testing: tasks.filter(t => t.status === 'testing').length,
    }), [tasks]);

    // Group tasks by status for sprint board
    const tasksByStatus = useMemo(() => ({
        'todo': tasks.filter(t => t.status === 'todo'),
        'in-progress': tasks.filter(t => t.status === 'in-progress'),
        'code-review': tasks.filter(t => t.status === 'code-review'),
        'testing': tasks.filter(t => t.status === 'testing'),
        'done': tasks.filter(t => t.status === 'done'),
    }), [tasks]);

    const handleSaveSprintConfig = () => {
        localStorage.setItem(SPRINT_KEY, JSON.stringify(sprintConfig));
    };

    const tabs = [
        { id: 'board', label: 'Active Sprint Board', icon: KanbanSquare },
        { id: 'backlog', label: 'Backlog Grooming', icon: Layers },
        { id: 'management', label: 'Sprint Planning', icon: Calendar },
    ];

    return (
        <div className="p-8 max-w-[1800px] mx-auto space-y-8 min-h-screen flex flex-col">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                            <Rocket size={24} />
                        </div>
                        Agile Sprint Planner
                    </h1>
                    <p className="text-muted-foreground mt-1 font-medium ml-12">
                        Plan sprints, groom the backlog, and track velocity.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-semibold border border-emerald-100 dark:border-emerald-800">
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
                                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10' 
                                    : 'text-muted-foreground hover:text-foreground hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                }
                            `}
                        >
                            <tab.icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                            {tab.label}
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabIndicator"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
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
                        key={activeTab}
                        initial={{ opacity: 0, scale: 0.99 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.99 }}
                        transition={{ duration: 0.2 }}
                        className="h-full"
                    >
                        {activeTab === 'board' && (
                            <div className="h-full space-y-6">
                                {/* Sprint Stats - Using real task data */}
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
                                            <p className="text-sm text-muted-foreground">Urgent</p>
                                            <p className="text-xl font-bold">{stats.blocked}</p>
                                        </div>
                                    </Card>
                                    <Card variant="elevated" padding="md" className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600">
                                            <Layers size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Total Tasks</p>
                                            <p className="text-xl font-bold">{tasks.length}</p>
                                        </div>
                                    </Card>
                                </div>
                                {/* Agile Sprint Kanban Board - Using real tasks */}
                                <Card variant="elevated" padding="lg" className="min-h-[400px] overflow-x-auto">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold">Sprint Board</h3>
                                        <Button variant="primary" size="sm" onClick={() => setIsCreateTaskOpen(true)}>
                                            <Plus size={14} className="mr-1" />
                                            Add Task
                                        </Button>
                                    </div>
                                    <div className="flex gap-4 min-w-max pb-4">
                                        {[
                                            { id: 'todo', label: 'To Do', color: 'bg-violet-50 dark:bg-violet-900/20' },
                                            { id: 'in-progress', label: 'In Progress', color: 'bg-blue-50 dark:bg-blue-900/20' },
                                            { id: 'code-review', label: 'Code Review', color: 'bg-amber-50 dark:bg-amber-900/20' },
                                            { id: 'testing', label: 'Testing', color: 'bg-orange-50 dark:bg-orange-900/20' },
                                            { id: 'done', label: 'Done', color: 'bg-emerald-50 dark:bg-emerald-900/20' },
                                        ].map((col) => (
                                            <div key={col.id} className={`w-[240px] shrink-0 rounded-xl p-4 min-h-[300px] ${col.color}`}>
                                                <div className="flex justify-between items-center mb-3">
                                                    <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">{col.label}</h4>
                                                    <Badge variant="secondary" className="text-xs">{tasksByStatus[col.id]?.length || 0}</Badge>
                                                </div>
                                                <div className="space-y-2">
                                                    {tasksByStatus[col.id]?.map((task) => (
                                                        <Card 
                                                            key={task.id} 
                                                            variant="hover" 
                                                            padding="sm" 
                                                            className="cursor-pointer"
                                                            onClick={() => {
                                                                // Quick status change on click
                                                                const nextStatus = {
                                                                    'todo': 'in-progress',
                                                                    'in-progress': 'code-review',
                                                                    'code-review': 'testing',
                                                                    'testing': 'done',
                                                                    'done': 'done'
                                                                };
                                                                if (task.status !== 'done') {
                                                                    updateTask(task.id, { status: nextStatus[task.status] });
                                                                }
                                                            }}
                                                        >
                                                            <p className="text-sm font-medium">{task.title}</p>
                                                            <p className="text-xs text-muted-foreground mt-1 capitalize">{task.priority} priority</p>
                                                        </Card>
                                                    ))}
                                                    {tasksByStatus[col.id]?.length === 0 && (
                                                        <p className="text-xs text-muted-foreground text-center py-4">No tasks</p>
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
                                        <h3 className="text-lg font-semibold">Backlog Items</h3>
                                        <p className="text-muted-foreground text-sm">Click to move tasks to In Progress.</p>
                                    </div>
                                    <Button variant="primary" size="sm" onClick={() => setIsCreateTaskOpen(true)}>
                                        <Plus size={14} className="mr-1" />
                                        Add to Backlog
                                    </Button>
                                </div>
                                <div className="mt-6 space-y-3">
                                    {tasks.filter(t => t.status === 'backlog' || t.status === 'todo').map((task) => (
                                        <Card 
                                            key={task.id} 
                                            variant="hover" 
                                            padding="md" 
                                            className="cursor-pointer flex justify-between items-center group"
                                            onClick={() => updateTask(task.id, { status: 'in-progress' })}
                                        >
                                            <div>
                                                <span className="font-medium">{task.title}</span>
                                                {task.description && (
                                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{task.description}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'} className="capitalize">
                                                    {task.priority}
                                                </Badge>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="opacity-0 group-hover:opacity-100"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        updateTask(task.id, { status: 'in-progress' });
                                                    }}
                                                >
                                                    <Play size={14} className="mr-1" />
                                                    Start
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}
                                    {tasks.filter(t => t.status === 'backlog' || t.status === 'todo').length === 0 && (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <Layers size={32} className="mx-auto mb-2 opacity-50" />
                                            <p>No items in backlog</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}

                        {activeTab === 'management' && (
                            <Card variant="elevated" padding="lg" className="min-h-[500px]">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold">Sprint Planning</h3>
                                        <p className="text-muted-foreground text-sm">Configure sprint duration, capacity, and goals.</p>
                                    </div>
                                    <Button variant="primary" onClick={handleSaveSprintConfig}>
                                        Save Configuration
                                    </Button>
                                </div>
                                <div className="mt-6 grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <label className="block">
                                            <span className="text-sm font-medium">Sprint Name</span>
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
                                            <span className="text-sm font-medium">Sprint Goal</span>
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
                                    <h4 className="font-medium mb-2">Sprint Summary</h4>
                                    <div className="grid grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Total Tasks</p>
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
                 <span>Flux Agile Module v1.5</span>
                 <span>Dec 07, 2025</span>
            </div>
            
            <CreateTaskModal isOpen={isCreateTaskOpen} onClose={() => setIsCreateTaskOpen(false)} />
        </div>
    );
}
