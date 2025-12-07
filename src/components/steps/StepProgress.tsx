// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

type ImportSource = 'jira' | 'asana' | 'trello' | 'monday' | 'linear' | 'csv';

interface StepProgressProps {
  source: ImportSource;
  onComplete: () => void;
}

export const StepProgress: React.FC<StepProgressProps> = ({ source, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'importing' | 'success' | 'error'>('importing');
  const [currentTask, setCurrentTask] = useState('Connecting to API...');

  const tasks = [
    'Connecting to API...',
    'Fetching projects...',
    'Importing tasks...',
    'Mapping statuses...',
    'Creating relationships...',
    'Finalizing import...',
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let taskIndex = 0;

    interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setStatus('success');
          setTimeout(onComplete, 1500);
          return 100;
        }
        
        const newProgress = prev + Math.random() * 15 + 5;
        const newTaskIndex = Math.min(Math.floor(newProgress / 20), tasks.length - 1);
        
        if (newTaskIndex !== taskIndex) {
          taskIndex = newTaskIndex;
          setCurrentTask(tasks[taskIndex]);
        }
        
        return Math.min(newProgress, 100);
      });
    }, 800);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="space-y-8 py-8">
      <div className="text-center">
        {status === 'importing' && (
          <Loader2 size={48} className="mx-auto text-violet-600 animate-spin mb-4" />
        )}
        {status === 'success' && (
          <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4" />
        )}
        {status === 'error' && (
          <XCircle size={48} className="mx-auto text-red-500 mb-4" />
        )}
        
        <h3 className="text-xl font-semibold mb-2">
          {status === 'importing' && 'Importing from ' + source}
          {status === 'success' && 'Import Complete!'}
          {status === 'error' && 'Import Failed'}
        </h3>
        
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {status === 'importing' && currentTask}
          {status === 'success' && 'All your tasks have been imported successfully.'}
          {status === 'error' && 'Something went wrong. Please try again.'}
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${
              status === 'error' ? 'bg-red-500' : 'bg-violet-600'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
