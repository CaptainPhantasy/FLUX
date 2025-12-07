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
import SprintManagement from '@/components/SprintManagement';
import SprintBoard from '@/components/SprintBoard';
import BacklogGrooming from '@/components/BacklogGrooming';

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
                            <div className="h-full">
                                <SprintBoard />
                            </div>
                        )}

                        {activeTab === 'backlog' && (
                            <div className="h-full">
                                <BacklogGrooming />
                            </div>
                        )}

                        {activeTab === 'management' && (
                             <div className="h-full overflow-y-auto">
                                <SprintManagement />
                            </div>
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
