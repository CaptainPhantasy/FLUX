// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
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
import { BoardProps, Task } from '../../types';
import { BoardColumn } from './BoardColumn';
import { FluxCard } from './FluxCard';

const dropAnimationConfig: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.4',
      },
    },
  }),
};

export const FluxBoard: React.FC<BoardProps> = ({ data, columns, onCardMove }) => {
  // Local state for optimistic updates
  const [tasks, setTasks] = useState<Task[]>(data);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setTasks(data);
  }, [data]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Prevent accidental drags on clicks
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getTask = (id: string) => tasks.find((t) => t.id === id);

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  };

  const onDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveTask) return;

    // Scenario 1: Dragging over another task
    if (isActiveTask && isOverTask) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        const overIndex = tasks.findIndex((t) => t.id === overId);

        if (tasks[activeIndex].status !== tasks[overIndex].status) {
          // Moving between columns via hovering another task
          const newTasks = [...tasks];
          newTasks[activeIndex] = {
            ...newTasks[activeIndex],
            status: tasks[overIndex].status,
          };
          return arrayMove(newTasks, activeIndex, overIndex - 1 >= 0 ? overIndex - 1 : overIndex); // Insert somewhat near
        }

        // Reordering in same column
        return arrayMove(tasks, activeIndex, overIndex);
      });
    }

    // Scenario 2: Dragging over an empty column area
    if (isActiveTask && isOverColumn) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        const newStatus = overId as string;

        if (tasks[activeIndex].status !== newStatus) {
          const newTasks = [...tasks];
          newTasks[activeIndex] = {
            ...newTasks[activeIndex],
            status: newStatus,
          };
          return arrayMove(newTasks, activeIndex, activeIndex); // Just update status, position handles itself via render logic usually
        }
        return tasks;
      });
    }
  }, []);

  const onDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    const activeId = active.id as string;
    
    // Cleanup active state
    setActiveId(null);

    if (!over) return;

    const overId = over.id as string;
    const activeTask = tasks.find((t) => t.id === activeId);
    
    if (!activeTask) return;

    // Determine final status
    // If we dropped on a column directly
    const isOverColumn = columns.includes(overId);
    // If we dropped on a task, find that task's status
    const overTask = tasks.find(t => t.id === overId);
    
    let finalStatus = activeTask.status;

    if (isOverColumn) {
      finalStatus = overId;
    } else if (overTask) {
      finalStatus = overTask.status;
    }

    // If status changed or position changed, fire update
    if (finalStatus !== activeTask.status || activeId !== overId) {
       // Optimistic state is already partially handled by onDragOver for visuals
       // Here we finalize the data structure for the parent
       await onCardMove(activeId, finalStatus);
    }
  }, [tasks, columns, onCardMove]);

  // Group tasks by column for rendering
  const tasksByColumn = columns.reduce((acc, col) => {
    acc[col] = tasks.filter((task) => task.status === col);
    return acc;
  }, {} as Record<string, Task[]>);

  const activeTask = activeId ? getTask(activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex h-full gap-8 overflow-x-auto pb-4 px-4 items-start no-scrollbar">
        {columns.map((colId) => (
          <BoardColumn
            key={colId}
            id={colId}
            title={colId}
            tasks={tasksByColumn[colId] || []}
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
};
