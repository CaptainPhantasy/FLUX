// @ts-nocheck
// =====================================
// FLUX - Agile Sprint Planning
// Style: Glassmorphism & Glowing Accents
// Last Updated: 21:18:00 Dec 06, 2025
// =====================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Timer,
    Layers,
    KanbanSquare,
    Rocket,
    Calendar
} from 'lucide-react';
import { Button } from '@/components/ui';
// Using inline placeholder until components are properly wired
// import SprintManagement from '@/components/SprintManagement';
// import SprintBoard from '@/components/SprintBoard';
// import BacklogGrooming from '@/components/BacklogGrooming';

import { Card } from '@/components/ui';
import { CheckCircle2, Clock, AlertCircle, Users } from 'lucide-react';

export default function SprintPage() {
    const [activeTab, setActiveTab] = useState('board');

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
                        <span>Sprint 42: 5 Days Remaining</span>
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
                                {/* Sprint Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <Card variant="elevated" padding="md" className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                                            <CheckCircle2 size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Completed</p>
                                            <p className="text-xl font-bold">12</p>
                                        </div>
                                    </Card>
                                    <Card variant="elevated" padding="md" className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">In Progress</p>
                                            <p className="text-xl font-bold">5</p>
                                        </div>
                                    </Card>
                                    <Card variant="elevated" padding="md" className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                                            <AlertCircle size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Blocked</p>
                                            <p className="text-xl font-bold">2</p>
                                        </div>
                                    </Card>
                                    <Card variant="elevated" padding="md" className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600">
                                            <Users size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Team Members</p>
                                            <p className="text-xl font-bold">8</p>
                                        </div>
                                    </Card>
                                </div>
                                {/* Kanban Board Placeholder */}
                                <Card variant="elevated" padding="lg" className="min-h-[400px]">
                                    <h3 className="text-lg font-semibold mb-4">Sprint Board</h3>
                                    <div className="grid grid-cols-4 gap-4">
                                        {['To Do', 'In Progress', 'Review', 'Done'].map((col) => (
                                            <div key={col} className="bg-muted/50 rounded-xl p-4 min-h-[300px]">
                                                <h4 className="font-medium text-sm text-muted-foreground mb-3">{col}</h4>
                                                <div className="space-y-2">
                                                    {col === 'In Progress' && (
                                                        <Card variant="hover" padding="sm" className="cursor-pointer">
                                                            <p className="text-sm font-medium">Implement auth flow</p>
                                                            <p className="text-xs text-muted-foreground mt-1">3 story points</p>
                                                        </Card>
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
                                <h3 className="text-lg font-semibold mb-4">Backlog Items</h3>
                                <p className="text-muted-foreground">Drag items to prioritize your backlog.</p>
                                <div className="mt-6 space-y-3">
                                    {['User authentication', 'Dashboard redesign', 'API integration', 'Performance optimization'].map((item, i) => (
                                        <Card key={i} variant="hover" padding="md" className="cursor-pointer flex justify-between items-center">
                                            <span className="font-medium">{item}</span>
                                            <span className="text-sm text-muted-foreground">{(i + 1) * 2} pts</span>
                                        </Card>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {activeTab === 'management' && (
                            <Card variant="elevated" padding="lg" className="min-h-[500px]">
                                <h3 className="text-lg font-semibold mb-4">Sprint Planning</h3>
                                <p className="text-muted-foreground">Configure sprint duration, capacity, and goals.</p>
                                <div className="mt-6 grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <label className="block">
                                            <span className="text-sm font-medium">Sprint Name</span>
                                            <input type="text" defaultValue="Sprint 42" className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background" />
                                        </label>
                                        <label className="block">
                                            <span className="text-sm font-medium">Duration (days)</span>
                                            <input type="number" defaultValue="14" className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background" />
                                        </label>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="block">
                                            <span className="text-sm font-medium">Team Capacity (points)</span>
                                            <input type="number" defaultValue="40" className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background" />
                                        </label>
                                        <label className="block">
                                            <span className="text-sm font-medium">Sprint Goal</span>
                                            <textarea className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background" rows={3} defaultValue="Complete user authentication and dashboard MVP" />
                                        </label>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
            
             <div className="text-xs text-slate-400 mt-4 border-t border-border pt-4 flex justify-between shrink-0">
                 <span>Flux Agile Module v1.5</span>
                 <span>21:18:00 Dec 06, 2025</span>
            </div>
        </div>
    );
}
