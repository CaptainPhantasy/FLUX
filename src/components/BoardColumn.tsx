// @ts-nocheck
import React, { useMemo } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Task } from '../../types';
import { BoardCard } from './BoardCard';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';

interface BoardColumnProps {
  id: string;
  title: string;
  tasks: Task[];
}

export const BoardColumn: React.FC<BoardColumnProps> = ({ id, title, tasks }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    data: {
      type: 'Column',
      id,
    },
  });

  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

  return (
    <div className="flex flex-col h-full w-80 shrink-0">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          {title}
        </h2>
        <span className="flex items-center justify-center bg-gray-200/50 text-gray-500 text-xs font-bold rounded-full min-w-[24px] h-6 px-2">
          {tasks.length}
        </span>
      </div>

      {/* Sortable Area */}
      <div
        ref={setNodeRef}
        className={clsx(
          "flex-1 rounded-xl transition-colors duration-200 p-2 -mx-2",
          // Use a subtle background change when hovering over the column with a card
          isOver ? "bg-gray-100/50 ring-2 ring-indigo-500/10" : "bg-transparent"
        )}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3 min-h-[150px]">
             {/* 
               We render tasks directly here. 
               Animation is handled by dnd-kit for sorting.
             */}
            {tasks.map((task) => (
              <BoardCard key={task.id} task={task} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};
