// @ts-nocheck
import React, { useEffect, useState, useMemo } from 'react';
import { useFluxStore } from '@/lib/store';
import { Clock, TrendingUp, AlertTriangle, CheckCircle, Activity, BrainCircuit } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { predictSLABreaches, SLARiskAnalysis } from '../services/geminiService';
import { calculateSLAStatus, findSLABreaches, findSLAAtRisk, getDefaultSLAConfigs } from '@/lib/sla';
import { getAdapter, isDbInitialized } from '@/lib/db';
import type { SLAStatus } from '@/lib/sla';

export const SLATracker: React.FC = () => {
  const { tasks, slaConfigs, fetchSLAConfigs, fetchTasks, workflowMode } = useFluxStore();
  const [slaStatuses, setSlaStatuses] = useState<SLAStatus[]>([]);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState<SLARiskAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch SLA configs and tasks on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await fetchSLAConfigs();
        await fetchTasks();
        
        // Initialize default SLA configs if none exist
        // Get the updated value from the store after fetch completes
        const updatedConfigs = useFluxStore.getState().slaConfigs;
        if (updatedConfigs.length === 0 && isDbInitialized()) {
          const defaults = getDefaultSLAConfigs();
          const db = getAdapter(useFluxStore.getState().config.storageMode);
          for (const config of defaults) {
            await db.createSLAConfig(config);
          }
          await fetchSLAConfigs();
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchSLAConfigs, fetchTasks]);

  // Calculate SLA statuses for all active tasks
  useEffect(() => {
    const calculateStatuses = async () => {
      if (!isDbInitialized() || tasks.length === 0 || slaConfigs.length === 0) {
        setSlaStatuses([]);
        return;
      }

      const db = getAdapter(useFluxStore.getState().config.storageMode);
      const statuses: SLAStatus[] = [];

      // Build activities map
      const activitiesByTask = new Map<string, any[]>();
      for (const task of tasks) {
        // Only process active tasks
        if (task.status === 'archived' || task.status === 'done' || task.status === 'closed' || task.status === 'resolved') {
          continue;
        }
        const activities = await db.getActivity(task.id);
        activitiesByTask.set(task.id, activities);
      }

      // Calculate status for each task
      for (const task of tasks) {
        if (task.status === 'archived' || task.status === 'done' || task.status === 'closed' || task.status === 'resolved') {
          continue;
        }

        const slaConfig = slaConfigs.find(c => c.priority === task.priority && c.workflow === workflowMode);
        if (!slaConfig) continue;

        const activities = activitiesByTask.get(task.id) || [];
        const status = calculateSLAStatus(task, slaConfig, activities);
        statuses.push(status);
      }

      setSlaStatuses(statuses);
    };

    calculateStatuses();
  }, [tasks, slaConfigs, workflowMode]);

  // Update statuses periodically
  useEffect(() => {
    const interval = setInterval(() => {
      // Recalculate to update remaining times
      const calculateStatuses = async () => {
        if (!isDbInitialized() || tasks.length === 0 || slaConfigs.length === 0) return;

        const db = getAdapter(useFluxStore.getState().config.storageMode);
        const statuses: SLAStatus[] = [];

        const activitiesByTask = new Map<string, any[]>();
        for (const task of tasks) {
          if (task.status === 'archived' || task.status === 'done' || task.status === 'closed' || task.status === 'resolved') {
            continue;
          }
          const activities = await db.getActivity(task.id);
          activitiesByTask.set(task.id, activities);
        }

        for (const task of tasks) {
          if (task.status === 'archived' || task.status === 'done' || task.status === 'closed' || task.status === 'resolved') {
            continue;
          }

          const slaConfig = slaConfigs.find(c => c.priority === task.priority && c.workflow === workflowMode);
          if (!slaConfig) continue;

          const activities = activitiesByTask.get(task.id) || [];
          const status = calculateSLAStatus(task, slaConfig, activities);
          statuses.push(status);
        }

        setSlaStatuses(statuses);
      };
      calculateStatuses();
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [tasks, slaConfigs, workflowMode]);

  const handlePredictiveAnalysis = async () => {
    setIsPredicting(true);
    try {
        // Convert SLAStatuses to format expected by predictSLABreaches
        const slaData = slaStatuses.map(s => ({
          id: s.taskId,
          name: s.taskTitle,
          target: s.responseTimeMinutes,
          remaining: s.responseTimeRemaining || 0,
          metric: 'response' as const,
          breached: s.responseBreached,
          startTime: s.createdAt,
        }));
        const analysis = await predictSLABreaches(slaData);
        setPredictionResult(analysis);
    } finally {
        setIsPredicting(false);
    }
  };

  const getSLAColor = (remaining: number | undefined, target: number) => {
    if (remaining === undefined || remaining < 0) return 'text-red-600 dark:text-red-400';
    if (remaining < target * 0.25) return 'text-orange-500 dark:text-orange-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getProgressWidth = (remaining: number | undefined, target: number) => {
      if (remaining === undefined || remaining < 0) return '0%';
      const percentage = Math.max(0, Math.min(100, (remaining / target) * 100));
      return `${percentage}%`;
  };

  // Calculate compliance metrics
  const metrics = useMemo(() => {
    const total = slaStatuses.length;
    const breached = slaStatuses.filter(s => s.responseBreached || s.resolutionBreached).length;
    const atRisk = slaStatuses.filter(s => 
      (s.responseAtRisk || s.resolutionAtRisk) && !s.responseBreached && !s.resolutionBreached
    ).length;
    const met = total - breached - atRisk;

    return {
      total,
      breached,
      atRisk,
      met,
      data: [
        { name: 'Met', value: met },
        { name: 'Breached', value: breached },
        { name: 'At Risk', value: atRisk },
      ],
    };
  }, [slaStatuses]);

  const COLORS = ['#10b981', '#ef4444', '#f59e0b'];

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading SLA data...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6 overflow-y-auto pr-2">
        <div className="flex justify-between items-end">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">SLA Performance</h2>
                <p className="text-gray-500 dark:text-gray-400">Real-time service level tracking and predictive analytics.</p>
            </div>
            <button 
                onClick={handlePredictiveAnalysis}
                disabled={isPredicting}
                className="bg-flux-600 hover:bg-flux-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
            >
                {isPredicting ? <span className="animate-spin">⌛</span> : <BrainCircuit size={18} />}
                {isPredicting ? 'Analyzing...' : 'Run AI Forecast'}
            </button>
        </div>

        {/* AI Analysis Panel */}
        {predictionResult && (
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800 animate-in slide-in-from-top-4">
                <div className="flex items-start gap-4">
                    <div className="bg-white dark:bg-indigo-900 p-3 rounded-full shadow-sm">
                        <TrendingUp className="text-indigo-600 dark:text-indigo-400" size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            Predictive Risk Assessment
                            <span className={`text-xs px-2 py-1 rounded-full uppercase ${predictionResult.overallRisk === 'high' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                {predictionResult.overallRisk} Risk
                            </span>
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">{predictionResult.analysis}</p>
                        
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {predictionResult.recommendations.map((rec, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-white/60 dark:bg-gray-800/60 p-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 border border-indigo-100 dark:border-indigo-800/50">
                                    <CheckCircle size={14} className="text-indigo-500" />
                                    {rec}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Active SLAs</h3>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{metrics.total}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Breach Risk</h3>
                <p className="text-3xl font-bold text-orange-500 mt-2">{metrics.atRisk}</p>
                {metrics.atRisk > 0 && (
                  <span className="text-xs text-orange-500 bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded-full mt-2 inline-block">Needs Attention</span>
                )}
            </div>
             <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Breached</h3>
                <p className="text-3xl font-bold text-red-500 mt-2">{metrics.breached}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Met</h3>
                <p className="text-3xl font-bold text-green-500 mt-2">{metrics.met}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold text-gray-900 dark:text-white">Live Timers</h3>
                </div>
                <div className="p-6 space-y-6">
                    {slaStatuses.length === 0 ? (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                            No active SLAs to track. Create tasks to see SLA status.
                        </div>
                    ) : (
                        slaStatuses.map(status => {
                            const responseRemaining = status.responseTimeRemaining;
                            const resolutionRemaining = status.resolutionTimeRemaining;
                            const isResponseBreached = status.responseBreached;
                            const isResolutionBreached = status.resolutionBreached;
                            const isResponseAtRisk = status.responseAtRisk;
                            const isResolutionAtRisk = status.resolutionAtRisk;

                            return (
                                <div key={status.taskId} className="relative">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate flex-1 mr-2">
                                            {status.taskTitle}
                                        </span>
                                        <span className={`text-xs font-mono font-bold ${getSLAColor(responseRemaining, status.responseTimeMinutes)}`}>
                                            {isResponseBreached ? 'RESPONSE BREACHED' : 
                                             isResponseAtRisk ? `${Math.floor(responseRemaining || 0)}m` : 
                                             `${Math.floor(responseRemaining || 0)}m`}
                                        </span>
                                    </div>
                                    <div className="mb-2">
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Response SLA</div>
                                        <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-1000 ${
                                                    isResponseBreached ? 'bg-red-500' : 
                                                    isResponseAtRisk ? 'bg-orange-500' : 
                                                    'bg-green-500'
                                                }`} 
                                                style={{ width: getProgressWidth(responseRemaining, status.responseTimeMinutes) }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Resolution SLA</div>
                                        <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-1000 ${
                                                    isResolutionBreached ? 'bg-red-500' : 
                                                    isResolutionAtRisk ? 'bg-orange-500' : 
                                                    'bg-green-500'
                                                }`} 
                                                style={{ width: getProgressWidth(resolutionRemaining, status.resolutionTimeMinutes) }}
                                            />
                                        </div>
                                    </div>
                                    {(isResponseAtRisk || isResolutionAtRisk) && !isResponseBreached && !isResolutionBreached && (
                                        <div className="mt-2 flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                                            <AlertTriangle size={12} />
                                            <span>Approaching breach threshold. Priority escalation recommended.</span>
                                        </div>
                                    )}
                                    {(isResponseBreached || isResolutionBreached) && (
                                        <div className="mt-2 flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                            <AlertTriangle size={12} />
                                            <span>SLA breached. Immediate action required.</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold text-gray-900 dark:text-white">Compliance Overview</h3>
                </div>
                <div className="p-6 flex-1 min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={metrics.data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {metrics.data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <RechartsTooltip 
                                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                                itemStyle={{ color: '#f3f4f6' }}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    </div>
  );
};
