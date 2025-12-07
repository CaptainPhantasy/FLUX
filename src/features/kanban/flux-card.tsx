// @ts-nocheck
// =====================================
// FLUX - Kanban Feature - FluxCard
// Style: Clean Modern SaaS (SlothUI Card)
// =====================================

import { useState } from 'react';
import { Calendar, MoreHorizontal, Edit, Trash2, Archive } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import type { Task } from '@/types';
import { cn, getPriorityColor, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui';
import { useFluxStore } from '@/lib/store';

interface FluxCardProps {
    task: Task;
    isOverlay?: boolean;
    isDragging?: boolean;
}

function PriorityBadge({ priority }: { priority: Task['priority'] }) {
    if (priority === 'medium') return null; // Reduce noise for medium priority

    return (
        <span className={cn(
            "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded",
            getPriorityColor(priority)
        )}>
            {priority}
        </span>
    );
}

export function FluxCard({ task, isOverlay, isDragging }: FluxCardProps) {
    const { deleteTask, updateTask, archiveTasks } = useFluxStore();
    const [showMenu, setShowMenu] = useState(false);

    const handleEdit = () => {
        // TODO: Open edit modal
        console.log('Edit task:', task.id);
        setShowMenu(false);
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            await deleteTask(task.id);
        }
        setShowMenu(false);
    };

    const handleArchive = async () => {
        await archiveTasks([task.id]);
        setShowMenu(false);
    };

    return (
        <Card
            variant={isOverlay ? "default" : "hover"}
            padding="md"
            className={cn(
                "group relative transition-all duration-200",
                // Interactive states
                !isOverlay && "cursor-grab active:cursor-grabbing",
                // Drag Overlay styles
                isOverlay && "rotate-2 scale-105 shadow-2xl border-violet-500 ring-2 ring-violet-500/20 cursor-grabbing z-50",
                // Dragging placeholder (ghost)
                isDragging && "opacity-30 grayscale border-dashed border-slate-300 bg-slate-50",
                "flex flex-col gap-3"
            )}
        >
            <div className="flex justify-between items-start">
                <PriorityBadge priority={task.priority} />

                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="text-slate-300 hover:text-slate-500 dark:hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity ml-auto p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                    >
                        <MoreHorizontal size={16} />
                    </button>

                    {/* Dropdown Menu */}
                    {showMenu && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50">
                            <button
                                onClick={handleEdit}
                                className="w-full px-3 py-2 text-sm text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                            >
                                <Edit size={14} />
                                Edit
                            </button>
                            <button
                                onClick={handleArchive}
                                className="w-full px-3 py-2 text-sm text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                            >
                                <Archive size={14} />
                                Archive
                            </button>
                            <button
                                onClick={handleDelete}
                                className="w-full px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                            >
                                <Trash2 size={14} />
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div>
                <h3 className="text-foreground font-semibold text-sm leading-snug">
                    {task.title}
                </h3>
                {task.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {task.description}
                    </p>
                )}
            </div>

            {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {task.tags.slice(0, 3).map((tag) => (
                        <span
                            key={tag}
                            className="px-2 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted rounded-md border border-border"
                        >
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-800 mt-1">
                <div className="flex items-center text-slate-400 dark:text-slate-500 text-xs font-medium">
                    {task.dueDate && (
                        <>
                            <Calendar size={12} className="mr-1.5" />
                            <span>{formatDate(task.dueDate)}</span>
                        </>
                    )}
                </div>

                {task.assignee && (
                    <div className="flex items-center -space-x-2">
                        <img
                            src={task.assignee.avatar}
                            alt={task.assignee.name}
                            className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900"
                            title={task.assignee.name}
                        />
                    </div>
                )}
            </div>
        </Card>
    );
}
