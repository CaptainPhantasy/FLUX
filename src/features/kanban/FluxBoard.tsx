// @ts-nocheck
// =====================================
// FLUX - Kanban Feature - FluxBoard
// Dynamic workflow support: Agile, CCaaS, ITSM
// =====================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    defaultDropAnimationSideEffects,
    DropAnimation,
    MeasuringStrategy,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFluxStore } from '@/lib/store';
import { getWorkflow, type WorkflowMode } from '@/lib/workflows';
import type { Task } from '@/types';
import { BoardColumn } from './board-column';
import { FluxCard } from './flux-card';

// Buttery smooth drop animation with spring physics
const dropAnimationConfig: DropAnimation = {
    duration: 350,
    easing: 'cubic-bezier(0.25, 1, 0.5, 1)', // Smooth deceleration
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: '0.5',
            },
        },
    }),
    keyframes({ transform }) {
        return [
            { transform: CSS.Transform.toString(transform.initial), opacity: 1 },
            { 
                transform: CSS.Transform.toString({
                    ...transform.final,
                    scaleX: 1.02,
                    scaleY: 1.02,
                }), 
                opacity: 0.95 
            },
            { transform: CSS.Transform.toString(transform.final), opacity: 1 },
];
    },
};

interface FluxBoardProps {
    tasks: Task[];
    onEditTask?: (task: Task) => void;
}

export function FluxBoard({ tasks, onEditTask }: FluxBoardProps) {
    const { moveTask, workflowMode } = useFluxStore();
    
    // Get dynamic columns based on current workflow mode
    const workflow = useMemo(() => getWorkflow(workflowMode), [workflowMode]);
    const COLUMNS = useMemo(() => 
        workflow.columns.map(col => ({ id: col.id, title: col.title })),
        [workflow]
    );

    // Local state for optimistic drag updates
    const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
    const [activeId, setActiveId] = useState<string | null>(null);

    // Sync with props
    useEffect(() => {
        setLocalTasks(tasks);
    }, [tasks]);

    // Configure sensors for smooth, responsive drag activation
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                // Lower distance for quicker response, small delay for intentionality
                distance: 8,
                delay: 100,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const getTask = (id: string) => localTasks.find((t) => t.id === id);

    const onDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    // Removed aggressive onDragOver - all positioning now handled in onDragEnd
    // This prevents the "jumping" behavior where cards move around erratically

    const onDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;
        const draggedId = active.id as string;

        setActiveId(null);

        if (!over) return;

        const overId = over.id as string;
        const activeTask = localTasks.find((t) => t.id === draggedId);

        if (!activeTask) return;

        // Determine final status and position
        const columnIds = COLUMNS.map(c => c.id);
        const isOverColumn = columnIds.includes(overId);
        const isOverTask = over.data.current?.type === 'Task';
        const overTask = localTasks.find(t => t.id === overId);

        let finalStatus = activeTask.status;
        let targetIndex = -1;

        if (isOverColumn) {
            // Dropped directly on a column - add to end
            finalStatus = overId;
            const tasksInColumn = localTasks.filter(t => t.status === finalStatus && t.id !== draggedId);
            targetIndex = tasksInColumn.length;
        } else if (isOverTask && overTask) {
            // Dropped on another task - insert at that position
            finalStatus = overTask.status;
            const tasksInColumn = localTasks.filter(t => t.status === finalStatus);
            const overIndex = tasksInColumn.findIndex(t => t.id === overId);
            targetIndex = overIndex >= 0 ? overIndex : 0;
        }

        // Only update if something actually changed
        const statusChanged = finalStatus !== activeTask.status;
        const positionChanged = draggedId !== overId;

        if (statusChanged || positionChanged) {
            // Optimistic local update for smooth UX
            setLocalTasks((tasks) => {
                const newTasks = tasks.filter(t => t.id !== draggedId);
                const updatedTask = { ...activeTask, status: finalStatus };
                
                // Find correct insert position
                const tasksInColumn = newTasks.filter(t => t.status === finalStatus);
                const insertIndex = targetIndex >= 0 ? targetIndex : tasksInColumn.length;
                
                // Find global index to insert at
                let globalInsertIndex = 0;
                let columnCount = 0;
                for (let i = 0; i < newTasks.length; i++) {
                    if (newTasks[i].status === finalStatus) {
                        if (columnCount === insertIndex) {
                            globalInsertIndex = i;
                            break;
                        }
                        columnCount++;
                    }
                    globalInsertIndex = i + 1;
                }
                
                newTasks.splice(globalInsertIndex, 0, updatedTask);
                return newTasks;
            });

            // Persist to store
            await moveTask(draggedId, finalStatus, targetIndex >= 0 ? targetIndex : undefined);
        }
    }, [localTasks, moveTask]);

    // Group tasks by column
    const tasksByColumn = useMemo(() => {
        return COLUMNS.reduce((acc, col) => {
        acc[col.id] = localTasks.filter((task) => task.status === col.id);
        return acc;
        }, {} as Record<string, Task[]>);
    }, [COLUMNS, localTasks]);

    const activeTask = activeId ? getTask(activeId) : null;

    // Measuring configuration for better performance
    const measuring = {
        droppable: {
            strategy: MeasuringStrategy.Always,
        },
    };

    // Stagger animation for columns
    const columnsContainerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
                delayChildren: 0.1,
            },
        },
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            measuring={measuring}
        >
            <motion.div 
                className="flex h-full gap-6 overflow-x-auto pb-4 px-2 items-start scroll-smooth"
                variants={columnsContainerVariants}
                initial="hidden"
                animate="visible"
            >
                {COLUMNS.map((col, index) => (
                    <BoardColumn
                        key={col.id}
                        id={col.id}
                        title={col.title}
                        tasks={tasksByColumn[col.id] || []}
                        onEditTask={onEditTask}
                    />
                ))}
            </motion.div>

            {createPortal(
                <DragOverlay dropAnimation={dropAnimationConfig}>
                    <AnimatePresence>
                    {activeTask ? (
                            <motion.div 
                className="w-80 cursor-grabbing"
                                initial={{ scale: 1, opacity: 0.9, rotate: 0 }}
                                animate={{ 
                                    scale: 1.03, 
                                    opacity: 1, 
                                    rotate: 2,
                                    transition: { 
                                        type: "spring", 
                        stiffness: 380, 
                        damping: 28 
                                    }
                                }}
                                exit={{ 
                                    scale: 1, 
                                    opacity: 0,
                                    transition: { duration: 0.15 }
                                }}
                            >
                            <FluxCard task={activeTask} isOverlay />
                            </motion.div>
                    ) : null}
                    </AnimatePresence>
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    );
}
