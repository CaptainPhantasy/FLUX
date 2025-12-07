// @ts-nocheck
// =====================================
// FLUX - Automation & Workflows
// Style: Glassmorphism & Glowing Accents
// Last Updated: 21:16:00 Dec 06, 2025
// =====================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Workflow,
    Zap,
    Database,
    Bot,
    Settings2
} from 'lucide-react';
import { Button } from '@/components/ui';
import WorkflowBuilder from '@/components/WorkflowBuilder';
import AutomationRules from '@/components/AutomationRules';
import CustomFieldBuilder from '@/components/CustomFieldBuilder';

export default function WorkflowPage() {
    const [activeTab, setActiveTab] = useState('builder');

    const tabs = [
        { id: 'builder', label: 'Workflow Designer', icon: Workflow },
        { id: 'rules', label: 'Automation Rules', icon: Zap },
        { id: 'fields', label: 'Custom Fields', icon: Database },
    ];

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 min-h-screen">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-fuchsia-500/10 text-fuchsia-500">
                            <Bot size={24} />
                        </div>
                        Automation & Configuration
                    </h1>
                    <p className="text-muted-foreground mt-1 font-medium ml-12">
                        Design workflows, set up automation triggers, and configure custom data schemas.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline">
                        <Settings2 size={16} className="mr-2" />
                        Global Settings
                    </Button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-border/50 pb-1">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                relative flex items-center gap-2 px-4 py-3 rounded-t-lg font-medium text-sm transition-all
                                ${isActive 
                                    ? 'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-50/50 dark:bg-fuchsia-900/10' 
                                    : 'text-muted-foreground hover:text-foreground hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                }
                            `}
                        >
                            <tab.icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                            {tab.label}
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabIndicator"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-fuchsia-500"
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="relative h-[calc(100vh-250px)]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="h-full"
                    >
                        {activeTab === 'builder' && (
                            <div className="h-full border border-border rounded-2xl overflow-hidden bg-card shadow-sm">
                                <WorkflowBuilder />
                            </div>
                        )}

                        {activeTab === 'rules' && (
                            <div className="h-full overflow-y-auto pr-2">
                                <AutomationRules />
                            </div>
                        )}

                        {activeTab === 'fields' && (
                            <div className="h-full overflow-y-auto pr-2 max-w-4xl mx-auto">
                                <CustomFieldBuilder />
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
            
             <div className="text-xs text-slate-400 mt-4 border-t border-border pt-4 flex justify-between">
                 <span>Flux Automation Engine v2.1</span>
                 <span>21:16:00 Dec 06, 2025</span>
            </div>
        </div>
    );
}
