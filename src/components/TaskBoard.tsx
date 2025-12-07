import React, { useState } from 'react';
import { Column, Task } from '../types';

const INITIAL_TASKS: Task[] = [
  { id: '1', title: 'Refine Design System', description: 'Standardize the violet color palette across all modules.', status: 'todo', priority: 'high', tags: ['Design', 'UI'] },
  { id: '2', title: 'Gemini AI Integration', description: 'Connect text generation API to task creator.', status: 'in-progress', priority: 'high', tags: ['Dev', 'AI'] },
  { id: '3', title: 'User Testing', description: 'Conduct sessions with 5 beta users.', status: 'done', priority: 'medium', tags: ['Research'] },
  { id: '4', title: 'Animation Polish', description: 'Add micro-interactions to buttons.', status: 'code-review', priority: 'low', tags: ['Frontend'] },
];

const COLUMNS: Column[] = [
  { id: 'col-1', title: 'To Do', status: 'todo' },
  { id: 'col-2', title: 'In Progress', status: 'in-progress' },
  { id: 'col-3', title: 'Code Review', status: 'code-review' },
  { id: 'col-4', title: 'Done', status: 'done' },
];

export const TaskBoard: React.FC = () => {
  const [tasks] = useState<Task[]>(INITIAL_TASKS);

  const getPriorityColor = (p: string) => {
    switch (p) {
        case 'high': return 'bg-red-500/20 text-red-200 border-red-500/30';
        case 'medium': return 'bg-orange-500/20 text-orange-200 border-orange-500/30';
        case 'low': return 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30';
        default: return 'bg-slate-500/20 text-slate-200';
    }
  };

  return (
    <div className="h-full w-full p-8 overflow-x-auto">
        <div className="flex gap-6 h-full min-w-max">
            {COLUMNS.map((col) => (
                <div key={col.id} className="w-80 flex flex-col gap-4">
                    {/* Column Header */}
                    <div className="flex items-center justify-between px-2">
                        <h3 className="font-semibold text-white/90">{col.title}</h3>
                        <span className="bg-white/10 text-xs px-2 py-1 rounded-full text-white/60 font-mono">
                            {tasks.filter(t => t.status === col.status).length}
                        </span>
                    </div>

                    {/* Drop Zone / Card List */}
                    <div className="flex-1 rounded-2xl bg-white/5 border border-white/5 p-3 space-y-3 overflow-y-auto custom-scrollbar">
                        {tasks.filter(t => t.status === col.status).map(task => (
                            <div key={task.id} className="group relative bg-slate-900/60 hover:bg-slate-800/80 backdrop-blur-md border border-white/10 p-5 rounded-2xl transition-all duration-300 hover:shadow-[0_0_25px_rgba(124,58,237,0.15)] hover:border-violet-500/30 cursor-grab active:cursor-grabbing">
                                <div className="flex justify-between items-start mb-3">
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                                        {task.priority}
                                    </span>
                                    <button className="text-white/20 hover:text-white transition-colors">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="12" cy="19" r="2"/></svg>
                                    </button>
                                </div>
                                <h4 className="text-sm font-medium text-white mb-2 leading-snug">{task.title}</h4>
                                <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{task.description}</p>
                                
                                <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                                    <div className="flex -space-x-2">
                                         <div className="w-6 h-6 rounded-full bg-indigo-500 border border-slate-900 flex items-center justify-center text-[9px] text-white">AJ</div>
                                    </div>
                                    <div className="flex gap-1">
                                        {task.tags?.map(tag => (
                                            <span key={tag} className="text-[10px] text-violet-300/80 bg-violet-500/10 px-1.5 py-0.5 rounded">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                                {/* Shine effect on hover */}
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
                            </div>
                        ))}
                         
                        <button className="w-full py-3 rounded-xl border border-dashed border-white/10 text-white/40 text-sm hover:bg-white/5 hover:text-white/80 hover:border-white/20 transition-all flex items-center justify-center gap-2">
                            <span>+ Add Task</span>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};