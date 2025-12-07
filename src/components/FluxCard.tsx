// @ts-nocheck
import React from 'react';
import { Calendar, Tag, MoreHorizontal } from 'lucide-react';
import { Task } from '../../types';
import clsx from 'clsx';

interface FluxCardProps {
  task: Task;
  isOverlay?: boolean;
  isDragging?: boolean;
}

const PriorityBadge = ({ priority }: { priority?: string }) => {
  if (!priority) return null;
  const colors = {
    low: 'bg-blue-100 text-blue-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-red-100 text-red-700',
  };
  return (
    <span className={clsx("text-[10px] uppercase font-bold px-1.5 py-0.5 rounded", colors[priority as keyof typeof colors] || colors.low)}>
      {priority}
    </span>
  );
};

export const FluxCard: React.FC<FluxCardProps> = ({ task, isOverlay, isDragging }) => {
  return (
    <div
      className={clsx(
        "group relative bg-white p-4 rounded-xl border border-gray-200 transition-all duration-200 ease-out",
        // Interactive states
        !isOverlay && "hover:border-indigo-300 hover:shadow-md cursor-grab active:cursor-grabbing",
        // Drag Overlay specific styles
        isOverlay && "rotate-2 scale-105 shadow-2xl border-indigo-500 ring-2 ring-indigo-500/20 cursor-grabbing z-50",
        // Dragging placeholder style (ghost)
        isDragging && "opacity-30 grayscale"
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex gap-2 items-center">
          <PriorityBadge priority={task.priority} />
        </div>
        <button className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal size={16} />
        </button>
      </div>

      <h3 className="text-gray-800 font-medium text-sm mb-3 leading-snug">
        {task.title}
      </h3>

      <div className="flex flex-wrap gap-1 mb-3">
        {task.tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center text-[10px] font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100"
          >
            <Tag size={10} className="mr-1 opacity-60" />
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <div className="flex items-center text-gray-400 text-xs">
          {task.dueDate && (
            <>
              <Calendar size={12} className="mr-1.5" />
              <span>{task.dueDate}</span>
            </>
          )}
        </div>
        
        {task.assignee && (
          <div className="flex items-center">
            <img 
              src={task.assignee.avatar} 
              alt={task.assignee.name} 
              className="w-6 h-6 rounded-full border-2 border-white shadow-sm object-cover"
              title={task.assignee.name}
            />
          </div>
        )}
      </div>
    </div>
  );
};
