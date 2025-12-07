// @ts-nocheck
import React from 'react';
import { Trello, Zap, FileSpreadsheet, Layers, ArrowRight } from 'lucide-react';

// Import Source type inline to avoid rolldown resolution issue
type ImportSource = 'jira' | 'asana' | 'trello' | 'monday' | 'linear' | 'csv';

interface StepSourceProps {
  selected: ImportSource | null;
  onSelect: (source: ImportSource) => void;
  onNext: () => void;
}

const sources = [
  { id: 'jira' as ImportSource, name: 'Jira', icon: Layers, color: 'bg-blue-500' },
  { id: 'trello' as ImportSource, name: 'Trello', icon: Trello, color: 'bg-blue-400' },
  { id: 'asana' as ImportSource, name: 'Asana', icon: Zap, color: 'bg-pink-500' },
  { id: 'linear' as ImportSource, name: 'Linear', icon: Layers, color: 'bg-violet-600' },
  { id: 'monday' as ImportSource, name: 'Monday', icon: Layers, color: 'bg-amber-500' },
  { id: 'csv' as ImportSource, name: 'CSV File', icon: FileSpreadsheet, color: 'bg-emerald-500' },
];

export const StepSource: React.FC<StepSourceProps> = ({ selected, onSelect, onNext }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {sources.map(source => (
          <button
            key={source.id}
            onClick={() => onSelect(source.id)}
            className={`
              p-4 rounded-xl border-2 transition-all duration-200
              flex flex-col items-center gap-3
              ${selected === source.id 
                ? 'border-violet-500 bg-violet-500/10' 
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }
            `}
          >
            <div className={`w-12 h-12 ${source.color} rounded-xl flex items-center justify-center`}>
              <source.icon size={24} className="text-white" />
            </div>
            <span className="font-medium text-sm">{source.name}</span>
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!selected}
          className="px-6 py-2.5 bg-violet-600 text-white rounded-lg font-medium
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:bg-violet-700 transition-colors flex items-center gap-2"
        >
          Continue
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
