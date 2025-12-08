// @ts-nocheck
// =====================================
// FLUX - Automation & Workflows
// Style: Glassmorphism & Glowing Accents
// Last Updated: Dec 07, 2025
// =====================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Workflow,
    Zap,
    Database,
    Bot,
    Settings2,
    X
} from 'lucide-react';
import { Button, Modal, Badge } from '@/components/ui';
import { Card } from '@/components/ui';
import { Plus, Play, Pause, Trash2, Edit } from 'lucide-react';

// Storage keys
const WORKFLOWS_KEY = 'flux_workflows';
const RULES_KEY = 'flux_automation_rules';
const FIELDS_KEY = 'flux_custom_fields';

// Default data
const DEFAULT_WORKFLOWS = [
    { id: '1', name: 'Issue Created', description: 'Auto-assign and notify team', isActive: true },
    { id: '2', name: 'Status Changed', description: 'Trigger notifications on status change', isActive: false },
    { id: '3', name: 'Assignment Updated', description: 'Notify assignee when assigned', isActive: false },
];

const DEFAULT_RULES = [
    { id: '1', name: 'Auto-close stale issues', description: 'Close issues inactive for 30 days', isActive: true },
    { id: '2', name: 'Notify on high priority', description: 'Send alerts for urgent items', isActive: false },
    { id: '3', name: 'SLA breach escalation', description: 'Escalate before SLA breach', isActive: false },
];

const DEFAULT_FIELDS = [
    { id: '1', name: 'Customer ID', type: 'text' },
    { id: '2', name: 'Environment', type: 'select' },
    { id: '3', name: 'Release Version', type: 'text' },
];

// Persistence helpers
const loadData = (key: string, defaultData: any[]) => {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : defaultData;
    } catch {
        return defaultData;
    }
};

const saveData = (key: string, data: any[]) => {
    localStorage.setItem(key, JSON.stringify(data));
};

export default function WorkflowPage() {
    const [activeTab, setActiveTab] = useState('builder');
    
    // State for each section
    const [workflows, setWorkflows] = useState(() => loadData(WORKFLOWS_KEY, DEFAULT_WORKFLOWS));
    const [rules, setRules] = useState(() => loadData(RULES_KEY, DEFAULT_RULES));
    const [fields, setFields] = useState(() => loadData(FIELDS_KEY, DEFAULT_FIELDS));
    
    // Modal states
    const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
    const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    
    // Form states
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formType, setFormType] = useState('text');

    // Save to localStorage on change
    useEffect(() => { saveData(WORKFLOWS_KEY, workflows); }, [workflows]);
    useEffect(() => { saveData(RULES_KEY, rules); }, [rules]);
    useEffect(() => { saveData(FIELDS_KEY, fields); }, [fields]);

    // Workflow CRUD
    const toggleWorkflow = (id: string) => {
        setWorkflows(workflows.map(w => w.id === id ? { ...w, isActive: !w.isActive } : w));
    };
    
    const addWorkflow = () => {
        if (!formName.trim()) return;
        const newWorkflow = {
            id: Date.now().toString(),
            name: formName,
            description: formDescription,
            isActive: false
        };
        setWorkflows([...workflows, newWorkflow]);
        setFormName('');
        setFormDescription('');
        setIsWorkflowModalOpen(false);
    };

    const deleteWorkflow = (id: string) => {
        setWorkflows(workflows.filter(w => w.id !== id));
    };

    // Rule CRUD
    const toggleRule = (id: string) => {
        setRules(rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
    };

    const addRule = () => {
        if (!formName.trim()) return;
        const newRule = {
            id: Date.now().toString(),
            name: formName,
            description: formDescription,
            isActive: false
        };
        setRules([...rules, newRule]);
        setFormName('');
        setFormDescription('');
        setIsRuleModalOpen(false);
    };

    const deleteRule = (id: string) => {
        setRules(rules.filter(r => r.id !== id));
    };

    // Field CRUD
    const addField = () => {
        if (!formName.trim()) return;
        const newField = {
            id: Date.now().toString(),
            name: formName,
            type: formType
        };
        setFields([...fields, newField]);
        setFormName('');
        setFormType('text');
        setIsFieldModalOpen(false);
    };

    const deleteField = (id: string) => {
        setFields(fields.filter(f => f.id !== id));
    };

    const tabs = [
        { id: 'builder', label: 'Workflow Designer', icon: Workflow },
        { id: 'rules', label: 'Automation Rules', icon: Zap },
        { id: 'fields', label: 'Custom Fields', icon: Database },
    ];

    return (
        <div className="p-8 pt-16 max-w-[1600px] mx-auto space-y-8 min-h-screen">
            
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
                                    <Button variant="primary" size="sm" onClick={() => setIsWorkflowModalOpen(true)}>
                                        <Plus size={16} className="mr-2" />
                                        New Workflow
                                    </Button>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    {workflows.map((workflow) => (
                                        <Card key={workflow.id} variant="hover" padding="md" className="cursor-pointer group">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium">{workflow.name}</span>
                                                <span className={`w-2 h-2 rounded-full ${workflow.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {workflow.description || 'No description'}
                                            </p>
                                            <div className="flex gap-2 mt-3">
                                                <button 
                                                    className="p-1.5 rounded bg-muted hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:text-emerald-600"
                                                    onClick={() => toggleWorkflow(workflow.id)}
                                                    title={workflow.isActive ? 'Pause' : 'Activate'}
                                                >
                                                    {workflow.isActive ? <Pause size={14} /> : <Play size={14} />}
                                                </button>
                                                <button 
                                                    className="p-1.5 rounded bg-muted hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 opacity-0 group-hover:opacity-100"
                                                    onClick={() => deleteWorkflow(workflow.id)}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </Card>
                                    ))}
                                    {workflows.length === 0 && (
                                        <div className="col-span-3 text-center py-12 text-muted-foreground">
                                            <Workflow size={32} className="mx-auto mb-2 opacity-50" />
                                            <p>No workflows configured</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}

                        {activeTab === 'rules' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold">Automation Rules</h3>
                                    <Button variant="primary" size="sm" onClick={() => setIsRuleModalOpen(true)}>
                                        <Plus size={16} className="mr-2" />
                                        Add Rule
                                    </Button>
                                </div>
                                {rules.map((rule) => (
                                    <Card key={rule.id} variant="hover" padding="md" className="flex justify-between items-center group">
                                        <div>
                                            <p className="font-medium">{rule.name}</p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {rule.description || 'No description'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => toggleRule(rule.id)}
                                                className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                                                    rule.isActive 
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-200' 
                                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                                                }`}
                                            >
                                                {rule.isActive ? 'Active' : 'Disabled'}
                                            </button>
                                            <button 
                                                className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100"
                                                onClick={() => deleteRule(rule.id)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </Card>
                                ))}
                                {rules.length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Zap size={32} className="mx-auto mb-2 opacity-50" />
                                        <p>No automation rules configured</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'fields' && (
                            <div className="max-w-2xl mx-auto space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold">Custom Fields</h3>
                                    <Button variant="primary" size="sm" onClick={() => setIsFieldModalOpen(true)}>
                                        <Plus size={16} className="mr-2" />
                                        Add Field
                                    </Button>
                                </div>
                                <Card variant="elevated" padding="lg">
                                    <p className="text-muted-foreground mb-4">Define custom fields for your issues and projects.</p>
                                    <div className="space-y-3">
                                        {fields.map((field) => (
                                            <div key={field.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg group">
                                                <div>
                                                    <p className="font-medium">{field.name}</p>
                                                    <p className="text-xs text-muted-foreground capitalize">{field.type}</p>
                                                </div>
                                                <button 
                                                    className="text-muted-foreground hover:text-red-600 opacity-0 group-hover:opacity-100"
                                                    onClick={() => deleteField(field.id)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        {fields.length === 0 && (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <Database size={24} className="mx-auto mb-2 opacity-50" />
                                                <p>No custom fields defined</p>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
            
             <div className="text-xs text-slate-400 mt-4 border-t border-border pt-4 flex justify-between">
                 <span>Flux Automation Engine v2.1</span>
                 <span>Dec 07, 2025</span>
            </div>

            {/* Workflow Modal */}
            <Modal isOpen={isWorkflowModalOpen} onClose={() => { setIsWorkflowModalOpen(false); setFormName(''); setFormDescription(''); }} title="New Workflow">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-card-foreground">Workflow Name</label>
                        <input
                            type="text"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            placeholder="e.g., On Issue Created"
                            className="flex h-10 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-slate-50"
                            autoFocus
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-card-foreground">Description</label>
                        <textarea
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            placeholder="Describe what this workflow does..."
                            className="flex min-h-[80px] w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-slate-50"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={() => { setIsWorkflowModalOpen(false); setFormName(''); setFormDescription(''); }}>Cancel</Button>
                        <Button onClick={addWorkflow} disabled={!formName.trim()}>Create Workflow</Button>
                    </div>
                </div>
            </Modal>

            {/* Rule Modal */}
            <Modal isOpen={isRuleModalOpen} onClose={() => { setIsRuleModalOpen(false); setFormName(''); setFormDescription(''); }} title="New Automation Rule">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-card-foreground">Rule Name</label>
                        <input
                            type="text"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            placeholder="e.g., Auto-close stale issues"
                            className="flex h-10 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-slate-50"
                            autoFocus
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-card-foreground">Description</label>
                        <textarea
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            placeholder="Describe what this rule does..."
                            className="flex min-h-[80px] w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-slate-50"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={() => { setIsRuleModalOpen(false); setFormName(''); setFormDescription(''); }}>Cancel</Button>
                        <Button onClick={addRule} disabled={!formName.trim()}>Create Rule</Button>
                    </div>
                </div>
            </Modal>

            {/* Field Modal */}
            <Modal isOpen={isFieldModalOpen} onClose={() => { setIsFieldModalOpen(false); setFormName(''); setFormType('text'); }} title="New Custom Field">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-card-foreground">Field Name</label>
                        <input
                            type="text"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            placeholder="e.g., Customer ID"
                            className="flex h-10 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-slate-50"
                            autoFocus
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-card-foreground">Field Type</label>
                        <select
                            value={formType}
                            onChange={(e) => setFormType(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-slate-50"
                        >
                            <option value="text" className="bg-card">Text</option>
                            <option value="number" className="bg-card">Number</option>
                            <option value="select" className="bg-card">Select</option>
                            <option value="date" className="bg-card">Date</option>
                            <option value="checkbox" className="bg-card">Checkbox</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={() => { setIsFieldModalOpen(false); setFormName(''); setFormType('text'); }}>Cancel</Button>
                        <Button onClick={addField} disabled={!formName.trim()}>Create Field</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
