// @ts-nocheck
// =====================================
// FLUX - Edit Task Modal
// Last Updated: Dec 07, 2025
// =====================================

import { useState, useEffect } from 'react';
import { useFluxStore } from '@/lib/store';
import { Modal, Button } from '@/components/ui';
import { Trash2 } from 'lucide-react';
import type { Task, TaskStatus, TaskPriority } from '@/types';

interface EditTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task | null;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
    { value: 'backlog', label: 'Backlog' },
    { value: 'ready', label: 'Ready' },
    { value: 'todo', label: 'To Do' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'code-review', label: 'Code Review' },
    { value: 'testing', label: 'Testing' },
    { value: 'done', label: 'Done' },
];

export function EditTaskModal({ isOpen, onClose, task }: EditTaskModalProps) {
    const { updateTask, deleteTask } = useFluxStore();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<TaskPriority>('medium');
    const [status, setStatus] = useState<TaskStatus>('todo');
    const [dueDate, setDueDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Sync form with task when it changes
    useEffect(() => {
        if (task) {
            setTitle(task.title || '');
            setDescription(task.description || '');
            setPriority(task.priority || 'medium');
            setStatus(task.status || 'todo');
            setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
        }
    }, [task]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!task || !title.trim()) return;

        setIsLoading(true);
        await updateTask(task.id, {
            title,
            description,
            priority,
            status,
            dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        });
        setIsLoading(false);
        onClose();
    };

    const handleDelete = async () => {
        if (!task) return;
        
        setIsLoading(true);
        await deleteTask(task.id);
        setIsLoading(false);
        setShowDeleteConfirm(false);
        onClose();
    };

    const handleClose = () => {
        setShowDeleteConfirm(false);
        onClose();
    };

    if (!task) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Edit Task">
            {showDeleteConfirm ? (
                <div className="space-y-4">
                    <p className="text-card-foreground">
                        Are you sure you want to delete "{task.title}"? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                            Cancel
                        </Button>
                        <Button 
                            type="button" 
                            variant="destructive" 
                            onClick={handleDelete}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Deleting...' : 'Delete Task'}
                        </Button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-card-foreground">Task Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="What needs to be done?"
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-card-foreground">Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                                className="flex h-10 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-slate-50"
                            >
                                {STATUS_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value} className="bg-card text-card-foreground">
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-card-foreground">Due Date</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-slate-50"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-card-foreground">Priority</label>
                        <div className="flex gap-2">
                            {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPriority(p)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${priority === p
                                        ? p === 'urgent' 
                                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 ring-2 ring-red-500/20'
                                            : 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 ring-2 ring-violet-500/20'
                                        : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-border">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => setShowDeleteConfirm(true)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            <Trash2 size={16} className="mr-2" />
                            Delete
                        </Button>
                        <div className="flex gap-3">
                            <Button type="button" variant="ghost" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading || !title.trim()}>
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </form>
            )}
        </Modal>
    );
}

