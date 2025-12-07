// @ts-nocheck
// =====================================
// FLUX - Kanban Feature - BoardColumn
// Dynamic workflow support - Buttery Smooth
// =====================================

import { useMemo, useState } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import type { Task } from '@/types';
import { BoardCard } from './board-card';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { useFluxStore } from '@/lib/store';
import { Badge } from '@/components/ui';
import { CreateTaskModal } from '@/features/tasks/CreateTaskModal';
import { getWorkflow, getColumnById } from '@/lib/workflows';

interface BoardColumnProps {
    id: string;
    title: string;
    tasks: Task[];
    onEditTask?: (task: Task) => void;
}

export function BoardColumn({ id, title, tasks, onEditTask }: BoardColumnProps) {
    const { workflowMode } = useFluxStore();
    const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

    // Get dynamic color from workflow configuration
    const column = useMemo(() => getColumnById(workflowMode, id), [workflowMode, id]);
    const columnColor = column ? `${column.color} ${column.darkColor}` : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';

    const { setNodeRef, isOver } = useDroppable({
        id: id,
        data: {
            type: 'Column',
            id,
        },
    });

    const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

    // Container animation variants
    const containerVariants = {
        initial: { opacity: 0, y: 10 },
        animate: { 
            opacity: 1, 
            y: 0,
            transition: {
                duration: 0.3,
                ease: [0.25, 0.46, 0.45, 0.94],
                staggerChildren: 0.03,
            }
        },
    };

    return (
        <motion.div 
            className="flex flex-col h-full w-[280px] shrink-0 group"
            variants={containerVariants}
            initial="initial"
            animate="animate"
        >
            {/* Column Header - Clean & Sharp */}
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-3">
                    <Badge className={cn("px-2.5 py-1 rounded-lg uppercase tracking-wider font-bold text-[11px] transition-colors duration-200", columnColor)}>
                        {title}
                    </Badge>
                    <motion.span 
                        className="text-slate-400 text-xs font-semibold tabular-nums"
                        key={tasks.length}
                        initial={{ scale: 1.2, opacity: 0.5 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        {tasks.length}
                    </motion.span>
                </div>
                <motion.button
                    onClick={() => setIsCreateTaskOpen(true)}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-violet-600"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                >
                    <Plus size={16} />
                </motion.button>
            </div>

            {/* Sortable Area - Smooth Drop Zone */}
            <motion.div
                ref={setNodeRef}
                className={cn(
                    "flex-1 rounded-2xl -mx-2 px-2 min-h-[200px]",
                    // Buttery smooth transition for drop zone
                    "transition-all duration-300 ease-out",
                    // Only show background when dragging over to indicate drop zone
                    isOver
                        ? "bg-orange-50/70 dark:bg-orange-900/20 ring-2 ring-orange-500/30 ring-inset scale-[1.01]"
                        : "bg-transparent scale-100"
                )}
                animate={{
                    backgroundColor: isOver ? 'rgba(230, 125, 34, 0.12)' : 'transparent',
                }}
                transition={{ duration: 0.2 }}
            >
                <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                    <AnimatePresence mode="popLayout">
                        <motion.div 
                            className="flex flex-col gap-3 pb-4"
                            layout
                        >
                            {tasks.map((task, index) => (
                                <BoardCard key={task.id} task={task} onEdit={onEditTask} />
                        ))}
                        </motion.div>
                    </AnimatePresence>
                </SortableContext>
            </motion.div>

            <CreateTaskModal isOpen={isCreateTaskOpen} onClose={() => setIsCreateTaskOpen(false)} defaultStatus={id} />
        </motion.div>
    );
}
