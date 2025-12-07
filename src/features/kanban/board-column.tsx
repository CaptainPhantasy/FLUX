// @ts-nocheck
// =====================================
// FLUX - Kanban Feature - BoardColumn
// Style: Clean Modern SaaS (SlothUI - Transparent Columns)
// =====================================

import { useMemo, useState } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import type { Task, TaskStatus } from '@/types';
import { BoardCard } from './board-card';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { useFluxStore } from '@/lib/store';
import { Badge } from '@/components/ui';
import { CreateTaskModal } from '@/features/tasks/CreateTaskModal';

interface BoardColumnProps {
    id: TaskStatus;
    title: string;
    tasks: Task[];
}

const columnBadges: Record<TaskStatus, string> = {
    'todo': 'bg-slate-100 text-slate-600',
    'in-progress': 'bg-blue-50 text-blue-700',
    'review': 'bg-amber-50 text-amber-700',
    'done': 'bg-emerald-50 text-emerald-700',
    'archived': 'bg-slate-100 text-slate-500',
};

export function BoardColumn({ id, title, tasks }: BoardColumnProps) {
    const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

    const { setNodeRef, isOver } = useDroppable({
        id: id,
        data: {
            type: 'Column',
            id,
        },
    });

    const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

    return (
        <div className="flex flex-col h-full w-[340px] shrink-0 group">
            {/* Column Header - Clean & Sharp */}
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-3">
                    <Badge className={cn("px-2.5 py-1 rounded-lg uppercase tracking-wider font-bold text-[11px]", columnBadges[id])}>
                        {title}
                    </Badge>
                    <span className="text-slate-400 text-xs font-semibold">
                        {tasks.length}
                    </span>
                </div>
                <button
                    onClick={() => setIsCreateTaskOpen(true)}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all text-slate-400 hover:text-violet-600"
                >
                    <Plus size={16} />
                </button>
            </div>

            {/* Sortable Area - Transparent Container */}
            <div
                ref={setNodeRef}
                className={cn(
                    "flex-1 rounded-2xl transition-all duration-300 -mx-2 px-2",
                    // Only show background when dragging over to indicate drop zone
                    isOver
                        ? "bg-violet-50/50 dark:bg-violet-900/10 ring-2 ring-violet-500/20 ring-inset"
                        : "bg-transparent"
                )}
            >
                <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-3 pb-4">
                        {tasks.map((task) => (
                            <BoardCard key={task.id} task={task} />
                        ))}
                    </div>
                </SortableContext>
            </div>

            <CreateTaskModal isOpen={isCreateTaskOpen} onClose={() => setIsCreateTaskOpen(false)} />
        </div>
    );
}
