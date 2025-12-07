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
// Using inline placeholder until components are properly wired
// import WorkflowBuilder from '@/components/WorkflowBuilder';
// import AutomationRules from '@/components/AutomationRules';
// import CustomFieldBuilder from '@/components/CustomFieldBuilder';

import { Card } from '@/components/ui';
import { Plus, Play, Pause, Trash2 } from 'lucide-react';

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
                            <Card variant="elevated" padding="lg" className="h-full">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-semibold">Workflow Designer</h3>
                                    <Button variant="primary" size="sm">
                                        <Plus size={16} className="mr-2" />
                                        New Workflow
                                    </Button>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    {['Issue Created', 'Status Changed', 'Assignment Updated'].map((trigger, i) => (
                                        <Card key={i} variant="hover" padding="md" className="cursor-pointer">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium">{trigger}</span>
                                                <span className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {i === 0 ? 'Auto-assign and notify team' : 'Configure trigger actions'}
                                            </p>
                                            <div className="flex gap-2 mt-3">
                                                <button className="p-1.5 rounded bg-muted hover:bg-muted/80">
                                                    <Play size={14} />
                                                </button>
                                                <button className="p-1.5 rounded bg-muted hover:bg-muted/80">
                                                    <Pause size={14} />
                                                </button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {activeTab === 'rules' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold">Automation Rules</h3>
                                    <Button variant="primary" size="sm">
                                        <Plus size={16} className="mr-2" />
                                        Add Rule
                                    </Button>
                                </div>
                                {['Auto-close stale issues', 'Notify on high priority', 'SLA breach escalation'].map((rule, i) => (
                                    <Card key={i} variant="hover" padding="md" className="flex justify-between items-center">
                                        <div>
                                            <p className="font-medium">{rule}</p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {i === 0 ? 'Close issues inactive for 30 days' : `Rule ${i + 1} configuration`}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${i === 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                                {i === 0 ? 'Active' : 'Disabled'}
                                            </span>
                                            <button className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {activeTab === 'fields' && (
                            <div className="max-w-2xl mx-auto space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold">Custom Fields</h3>
                                    <Button variant="primary" size="sm">
                                        <Plus size={16} className="mr-2" />
                                        Add Field
                                    </Button>
                                </div>
                                <Card variant="elevated" padding="lg">
                                    <p className="text-muted-foreground mb-4">Define custom fields for your issues and projects.</p>
                                    <div className="space-y-3">
                                        {['Customer ID', 'Environment', 'Release Version'].map((field, i) => (
                                            <div key={i} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                                                <div>
                                                    <p className="font-medium">{field}</p>
                                                    <p className="text-xs text-muted-foreground">{['Text', 'Select', 'Text'][i]}</p>
                                                </div>
                                                <button className="text-muted-foreground hover:text-foreground">Edit</button>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
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
