// @ts-nocheck
// =====================================
// FLUX - Kanban Feature - FluxBoard
// Refactored from fluxboard-kanban prototype
// =====================================

import { useState, useEffect, useCallback } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    defaultDropAnimationSideEffects,
    DropAnimation,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import { useFluxStore } from '@/lib/store';
import type { Task, TaskStatus } from '@/types';
import { BoardColumn } from './board-column';
import { FluxCard } from './flux-card';

const dropAnimationConfig: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: '0.4',
            },
        },
    }),
};

// Column configuration mapped to our TaskStatus type
const COLUMNS: { id: TaskStatus; title: string }[] = [
    { id: 'todo', title: 'To Do' },
    { id: 'in-progress', title: 'In Progress' },
    { id: 'review', title: 'Review' },
    { id: 'done', title: 'Done' },
];

interface FluxBoardProps {
    tasks: Task[];
}

export function FluxBoard({ tasks }: FluxBoardProps) {
    const { moveTask } = useFluxStore();

    // Local state for optimistic drag updates
    const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
    const [activeId, setActiveId] = useState<string | null>(null);

    // Sync with props
    useEffect(() => {
        setLocalTasks(tasks);
    }, [tasks]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Prevent accidental drags
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

    const onDragOver = useCallback((event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        if (activeId === overId) return;

        const isActiveTask = active.data.current?.type === 'Task';
        const isOverTask = over.data.current?.type === 'Task';
        const isOverColumn = over.data.current?.type === 'Column';

        if (!isActiveTask) return;

        // Dragging over another task
        if (isActiveTask && isOverTask) {
            setLocalTasks((tasks) => {
                const activeIndex = tasks.findIndex((t) => t.id === activeId);
                const overIndex = tasks.findIndex((t) => t.id === overId);

                if (tasks[activeIndex].status !== tasks[overIndex].status) {
                    const newTasks = [...tasks];
                    newTasks[activeIndex] = {
                        ...newTasks[activeIndex],
                        status: tasks[overIndex].status,
                    };
                    return arrayMove(newTasks, activeIndex, overIndex - 1 >= 0 ? overIndex - 1 : overIndex);
                }

                return arrayMove(tasks, activeIndex, overIndex);
            });
        }

        // Dragging over a column
        if (isActiveTask && isOverColumn) {
            setLocalTasks((tasks) => {
                const activeIndex = tasks.findIndex((t) => t.id === activeId);
                const newStatus = overId as TaskStatus;

                if (tasks[activeIndex].status !== newStatus) {
                    const newTasks = [...tasks];
                    newTasks[activeIndex] = {
                        ...newTasks[activeIndex],
                        status: newStatus,
                    };
                    return arrayMove(newTasks, activeIndex, activeIndex);
                }
                return tasks;
            });
        }
    }, []);

    const onDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;
        const draggedId = active.id as string;

        setActiveId(null);

        if (!over) return;

        const overId = over.id as string;
        const activeTask = localTasks.find((t) => t.id === draggedId);

        if (!activeTask) return;

        // Determine final status
        const columnIds = COLUMNS.map(c => c.id);
        const isOverColumn = columnIds.includes(overId as TaskStatus);
        const overTask = localTasks.find(t => t.id === overId);

        let finalStatus = activeTask.status;

        if (isOverColumn) {
            finalStatus = overId as TaskStatus;
        } else if (overTask) {
            finalStatus = overTask.status;
        }

        // Calculate new order
        const tasksInColumn = localTasks.filter(t => t.status === finalStatus);
        const newOrder = tasksInColumn.findIndex(t => t.id === draggedId);

        // If status or order changed, persist to store
        if (finalStatus !== activeTask.status || draggedId !== overId) {
            await moveTask(draggedId, finalStatus, newOrder >= 0 ? newOrder : undefined);
        }
    }, [localTasks, moveTask]);

    // Group tasks by column
    const tasksByColumn = COLUMNS.reduce((acc, col) => {
        acc[col.id] = localTasks.filter((task) => task.status === col.id);
        return acc;
    }, {} as Record<TaskStatus, Task[]>);

    const activeTask = activeId ? getTask(activeId) : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
        >
            <div className="flex h-full gap-6 overflow-x-auto pb-4 px-2 items-start">
                {COLUMNS.map((col) => (
                    <BoardColumn
                        key={col.id}
                        id={col.id}
                        title={col.title}
                        tasks={tasksByColumn[col.id] || []}
                    />
                ))}
            </div>

            {createPortal(
                <DragOverlay dropAnimation={dropAnimationConfig}>
                    {activeTask ? (
                        <div className="w-80 cursor-grabbing">
                            <FluxCard task={activeTask} isOverlay />
                        </div>
                    ) : null}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    );
}
