// @ts-nocheck
// =====================================
// FLUX - Create Task Modal
// Dynamic workflow support: Agile, CCaaS, ITSM
// =====================================

import { useState, useEffect, useMemo } from 'react';
import { useFluxStore } from '@/lib/store';
import { Modal, Button } from '@/components/ui';
import { getWorkflow, getActiveColumns } from '@/lib/workflows';
import type { TaskPriority } from '@/types';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultStatus?: string;
}

export function CreateTaskModal({ isOpen, onClose, defaultStatus }: CreateTaskModalProps) {
    const { createTask, workflowMode } = useFluxStore();
    
    // Get workflow-aware statuses
    const workflow = useMemo(() => getWorkflow(workflowMode), [workflowMode]);
    const availableStatuses = useMemo(() => getActiveColumns(workflowMode), [workflowMode]);
    const priorities = useMemo(() => workflow.priorities, [workflow]);
    
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<TaskPriority>('medium');
    const [status, setStatus] = useState(defaultStatus || availableStatuses[0]?.id || 'backlog');
    const [isLoading, setIsLoading] = useState(false);

    // Update status when defaultStatus or workflow changes
    useEffect(() => {
        if (defaultStatus) {
            setStatus(defaultStatus);
        } else if (availableStatuses.length > 0) {
            setStatus(availableStatuses[0].id);
        }
    }, [defaultStatus, availableStatuses]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            return;
        }

        setIsLoading(true);
        await createTask({
            title,
            description,
            priority,
            status,
            order: 0,
        });
        setIsLoading(false);
        onClose();
        setTitle('');
        setDescription('');
        setPriority('medium');
        setStatus(defaultStatus || availableStatuses[0]?.id || 'backlog');
    };

    // Get workflow-specific labels
    const getItemLabel = () => {
        switch (workflowMode) {
            case 'ccaas': return 'Ticket';
            case 'itsm': return 'Incident';
            default: return 'Task';
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Create New ${getItemLabel()}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-card-foreground">{getItemLabel()} Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={workflowMode === 'ccaas' ? 'Customer inquiry about...' : workflowMode === 'itsm' ? 'Describe the incident...' : 'What needs to be done?'}
                        className="flex h-10 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-50"
                        autoFocus
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-card-foreground">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Add details..."
                        className="flex min-h-[80px] w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-50"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-card-foreground">Status</label>
                    <div className="flex flex-wrap gap-2">
                        {availableStatuses.slice(0, 4).map((s) => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => setStatus(s.id)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${status === s.id
                                    ? `${s.color} ${s.darkColor} ring-2 ring-violet-500/20`
                                    : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {s.title}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-card-foreground">Priority</label>
                    <div className="flex flex-wrap gap-2">
                        {priorities.map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => setPriority(p.id as TaskPriority)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${priority === p.id
                                    ? `${p.color} ring-2 ring-violet-500/20`
                                    : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading || !title.trim()}>
                        {isLoading ? 'Creating...' : `Create ${getItemLabel()}`}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
