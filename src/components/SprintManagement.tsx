// @ts-nocheck
import React from 'react';
import { Sprint, BurndownData } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PlayCircle, PauseCircle, CheckSquare, Calendar } from 'lucide-react';

interface SprintManagementProps {
  activeSprint: Sprint;
  burndownData: BurndownData[];
  onSprintAction: (action: 'start' | 'complete' | 'pause') => void;
}

const SprintManagement: React.FC<SprintManagementProps> = ({ activeSprint, burndownData, onSprintAction }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {/* Active Sprint Overview */}
      <div className="md:col-span-1 bg-gradient-to-br from-flux-600 to-flux-800 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-flux-200 text-sm font-medium uppercase tracking-wider">Active Sprint</p>
              <h2 className="text-2xl font-bold mt-1">{activeSprint.name}</h2>
            </div>
            <span className="bg-white/20 px-2 py-1 rounded text-xs font-mono">{activeSprint.state}</span>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-flux-200" />
              <div className="text-sm">
                <p className="opacity-80">Dates</p>
                <p className="font-semibold">{activeSprint.startDate} - {activeSprint.endDate}</p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/20 grid grid-cols-2 gap-4">
               <button 
                onClick={() => onSprintAction('complete')}
                className="bg-white text-flux-900 py-2 rounded-lg text-sm font-bold hover:bg-flux-50 transition-colors flex items-center justify-center gap-2"
               >
                 <CheckSquare className="w-4 h-4"/> Complete
               </button>
               <button 
                className="bg-flux-900/50 text-white py-2 rounded-lg text-sm font-bold hover:bg-flux-900/70 transition-colors flex items-center justify-center gap-2"
               >
                 <PauseCircle className="w-4 h-4"/> Pause
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Burndown Chart */}
      <div className="md:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white">Burndown Chart</h3>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-gray-300 rounded-full"></span> Ideal
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-flux-500 rounded-full"></span> Remaining
            </div>
          </div>
        </div>
        
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={burndownData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRemaining" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-gray-700" />
              <XAxis dataKey="date" tick={{fontSize: 10, fill: '#6B7280'}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize: 10, fill: '#6B7280'}} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Area type="monotone" dataKey="ideal" stroke="#9CA3AF" strokeDasharray="5 5" fill="none" strokeWidth={2} />
              <Area type="monotone" dataKey="remaining" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorRemaining)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SprintManagement;