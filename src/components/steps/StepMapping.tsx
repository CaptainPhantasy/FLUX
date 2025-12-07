// @ts-nocheck
import React from 'react';
import { ArrowRight, ArrowLeft, ArrowRightLeft } from 'lucide-react';

type ImportSource = 'jira' | 'asana' | 'trello' | 'monday' | 'linear' | 'csv';

const MOCK_SOURCE_STATUSES = ['To Do', 'In Progress', 'Done', 'Blocked'];
const FLUX_STATUSES = ['todo', 'in-progress', 'review', 'done'];

interface StepMappingProps {
  source: ImportSource;
  mappings: Record<string, string>;
  onMappingChange: (sourceStatus: string, fluxStatus: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const StepMapping: React.FC<StepMappingProps> = ({ source, mappings, onMappingChange, onNext, onBack }) => {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Map your {source} statuses to Flux statuses. This ensures your tasks appear in the correct columns.
        </p>
      </div>

      <div className="space-y-4">
        {MOCK_SOURCE_STATUSES.map(sourceStatus => (
          <div key={sourceStatus} className="flex items-center gap-4">
            <div className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-medium">
              {sourceStatus}
            </div>
            
            <ArrowRightLeft size={20} className="text-slate-400" />
            
            <select
              value={mappings[sourceStatus] || ''}
              onChange={(e) => onMappingChange(sourceStatus, e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700
                bg-white dark:bg-slate-800 focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Select status...</option>
              {FLUX_STATUSES.map(status => (
                <option key={status} value={status}>
                  {status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2.5 text-slate-600 hover:text-slate-800 rounded-lg font-medium
            flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2.5 bg-violet-600 text-white rounded-lg font-medium
            hover:bg-violet-700 transition-colors flex items-center gap-2"
        >
          Start Import
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
