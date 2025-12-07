// @ts-nocheck
// =====================================
// FLUX - Kanban Feature - FluxCard
// Style: Clean Modern SaaS - Buttery Smooth
// =====================================

import { useState, useRef, useEffect } from 'react';
import { Calendar, MoreHorizontal, Edit, Trash2, Archive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Task } from '@/types';
import { cn, getPriorityColor, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui';
import { useFluxStore } from '@/lib/store';

interface FluxCardProps {
    task: Task;
    isOverlay?: boolean;
    isDragging?: boolean;
    onEdit?: (task: Task) => void;
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

export function FluxCard({ task, isOverlay, isDragging, onEdit }: FluxCardProps) {
    const { deleteTask, updateTask, archiveTasks } = useFluxStore();
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };
        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMenu]);

    const handleEdit = () => {
        if (onEdit) {
            onEdit(task);
        }
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

    // Menu animation variants
    const menuVariants = {
        hidden: { 
            opacity: 0, 
            scale: 0.95, 
            y: -4,
            transition: { duration: 0.1, ease: "easeIn" }
        },
        visible: { 
            opacity: 1, 
            scale: 1, 
            y: 0,
            transition: { 
                duration: 0.15, 
                ease: [0.25, 0.46, 0.45, 0.94] // Custom smooth ease
            }
        },
    };

    const menuItemVariants = {
        hidden: { opacity: 0, x: -8 },
        visible: (i: number) => ({
            opacity: 1,
            x: 0,
            transition: {
                delay: i * 0.03,
                duration: 0.15,
                ease: "easeOut"
            }
        }),
    };

    return (
        <Card
            variant={isOverlay ? "default" : "hover"}
            padding="md"
            className={cn(
                "group relative select-none touch-manipulation",
                // Smooth transitions
                "transition-all duration-300 ease-out",
                // Interactive states
                !isOverlay && "cursor-grab active:cursor-grabbing",
                // Drag Overlay styles - buttery smooth
                isOverlay && "rotate-2 scale-105 shadow-[0_25px_50px_-12px_rgba(230,125,34,0.35)] border-orange-500/60 ring-2 ring-orange-500/30 cursor-grabbing z-50",
                // Dragging placeholder (ghost)
                isDragging && "opacity-20 grayscale border-dashed border-slate-300/50 bg-slate-50/50 dark:bg-slate-900/50",
                "flex flex-col gap-3"
            )}
        >
            <div className="flex justify-between items-start">
                <PriorityBadge priority={task.priority} />

                <div className="relative" ref={menuRef}>
                    <motion.button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(!showMenu);
                        }}
                        className="text-slate-300 hover:text-slate-500 dark:hover:text-slate-300 opacity-0 group-hover:opacity-100 ml-auto p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                    >
                        <MoreHorizontal size={16} />
                    </motion.button>

                    {/* Animated Dropdown Menu */}
                    <AnimatePresence>
                    {showMenu && (
                            <motion.div 
                                className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-lg shadow-black/10 dark:shadow-black/30 border border-slate-200 dark:border-slate-700 py-1.5 z-50 overflow-hidden"
                                variants={menuVariants}
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                            >
                                <motion.button
                                onClick={handleEdit}
                                    className="w-full px-3 py-2 text-sm text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/70 flex items-center gap-2 transition-colors duration-150"
                                    variants={menuItemVariants}
                                    custom={0}
                                    whileHover={{ x: 2 }}
                            >
                                <Edit size={14} />
                                Edit
                                </motion.button>
                                <motion.button
                                onClick={handleArchive}
                                    className="w-full px-3 py-2 text-sm text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/70 flex items-center gap-2 transition-colors duration-150"
                                    variants={menuItemVariants}
                                    custom={1}
                                    whileHover={{ x: 2 }}
                            >
                                <Archive size={14} />
                                Archive
                                </motion.button>
                                <motion.button
                                onClick={handleDelete}
                                    className="w-full px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors duration-150"
                                    variants={menuItemVariants}
                                    custom={2}
                                    whileHover={{ x: 2 }}
                            >
                                <Trash2 size={14} />
                                Delete
                                </motion.button>
                            </motion.div>
                    )}
                    </AnimatePresence>
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
