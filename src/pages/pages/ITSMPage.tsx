// @ts-nocheck
// =====================================
// FLUX - ITSM Service Desk
// Style: Glassmorphism & Glowing Accents
// Last Updated: 21:14:00 Dec 06, 2025
// =====================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldAlert,
    ShoppingBag,
    GitPullRequest,
    Activity,
    LayoutGrid
} from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { IncidentManagement } from '@/components/IncidentManagement';
import { ServiceCatalog } from '@/components/ServiceCatalog';
import { ChangeManagement } from '@/components/ChangeManagement';
import { SLATracker } from '@/components/SLATracker';

export default function ITSMPage() {
    const [activeTab, setActiveTab] = useState('incidents');

    const tabs = [
        { id: 'incidents', label: 'Incident Console', icon: ShieldAlert },
        { id: 'catalog', label: 'Service Catalog', icon: ShoppingBag },
        { id: 'changes', label: 'Change Management', icon: GitPullRequest },
        { id: 'sla', label: 'SLA Tracker', icon: Activity },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-violet-500/10 text-violet-500">
                            <LayoutGrid size={24} />
                        </div>
                        IT Service Desk
                    </h1>
                    <p className="text-muted-foreground mt-1 font-medium ml-12">
                        Manage incidents, requests, and change orders from a centralized command center.
                    </p>
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
                                    ? 'text-violet-600 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-900/10' 
                                    : 'text-muted-foreground hover:text-foreground hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                }
                            `}
                        >
                            <tab.icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                            {tab.label}
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabIndicator"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500"
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'incidents' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-3">
                                        <IncidentManagement />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'catalog' && (
                            <div className="max-w-5xl mx-auto">
                                <ServiceCatalog />
                            </div>
                        )}

                        {activeTab === 'changes' && (
                            <ChangeManagement />
                        )}

                        {activeTab === 'sla' && (
                            <div className="space-y-6">
                                <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
                                    <h3 className="text-lg font-semibold mb-4">Service Level Agreements</h3>
                                    <SLATracker />
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
            
            <div className="text-xs text-slate-400 mt-12 border-t border-border pt-4 flex justify-between">
                 <span>Flux ITSM Module v1.0</span>
                 <span>21:14:00 Dec 06, 2025</span>
            </div>
        </div>
    );
}
