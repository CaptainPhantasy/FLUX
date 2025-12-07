// @ts-nocheck
import { useState } from 'react';
import { useFluxStore } from '@/lib/store';
import { Modal, Button } from '@/components/ui';

export function CreateTaskModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { createTask } = useFluxStore();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('[CreateTaskModal] handleSubmit called');
        console.log('[CreateTaskModal] Title:', title);

        if (!title.trim()) {
            console.log('[CreateTaskModal] Title is empty, returning');
            return;
        }

        console.log('[CreateTaskModal] Calling createTask...');
        setIsLoading(true);
        const result = await createTask({
            title,
            description,
            priority,
            status: 'todo',
            order: 0,
        });
        console.log('[CreateTaskModal] createTask result:', result);
        setIsLoading(false);
        onClose();
        setTitle('');
        setDescription('');
        setPriority('medium');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Task">
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

                <div className="space-y-2">
                    <label className="text-sm font-medium text-card-foreground">Priority</label>
                    <div className="flex gap-2">
                        {(['low', 'medium', 'high'] as const).map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setPriority(p)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${priority === p
                                    ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 ring-2 ring-violet-500/20'
                                    : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading || !title.trim()}>
                        {isLoading ? 'Creating...' : 'Create Task'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
