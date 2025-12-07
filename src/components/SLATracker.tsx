// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { SLA } from '../types';
import { Clock, TrendingUp, AlertTriangle, CheckCircle, Activity, BrainCircuit } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { predictSLABreaches, SLARiskAnalysis } from '../services/geminiService';

const MOCK_SLAS: SLA[] = [
  { id: '1', name: 'P1 Response', target: 15, remaining: 5, metric: 'response', breached: false, startTime: new Date().toISOString() },
  { id: '2', name: 'P2 Resolution', target: 240, remaining: 120, metric: 'resolution', breached: false, startTime: new Date().toISOString() },
  { id: '3', name: 'P3 Resolution', target: 480, remaining: -30, metric: 'resolution', breached: true, startTime: new Date().toISOString() },
  { id: '4', name: 'Service Request Fulfillment', target: 1440, remaining: 1000, metric: 'resolution', breached: false, startTime: new Date().toISOString() }
];

export const SLATracker: React.FC = () => {
  const [slas, setSlas] = useState<SLA[]>(MOCK_SLAS);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState<SLARiskAnalysis | null>(null);

  // Simulate countdown
  useEffect(() => {
    const interval = setInterval(() => {
        setSlas(current => current.map(sla => ({
            ...sla,
            remaining: sla.remaining > -100 ? sla.remaining - 0.1 : sla.remaining // reduce slightly
        })));
    }, 6000); // Update every 6 seconds (simulated minute)
    return () => clearInterval(interval);
  }, []);

  const handlePredictiveAnalysis = async () => {
    setIsPredicting(true);
    try {
        const analysis = await predictSLABreaches(slas);
        setPredictionResult(analysis);
    } finally {
        setIsPredicting(false);
    }
  };

  const getSLAColor = (remaining: number, target: number) => {
    if (remaining < 0) return 'text-red-600 dark:text-red-400';
    if (remaining < target * 0.25) return 'text-orange-500 dark:text-orange-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getProgressWidth = (remaining: number, target: number) => {
      const percentage = Math.max(0, Math.min(100, (remaining / target) * 100));
      return `${percentage}%`;
  };

  const data = [
    { name: 'Met', value: 85 },
    { name: 'Breached', value: 5 },
    { name: 'At Risk', value: 10 },
  ];
  const COLORS = ['#10b981', '#ef4444', '#f59e0b'];

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
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">12</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Breach Risk</h3>
                <p className="text-3xl font-bold text-orange-500 mt-2">3</p>
                <span className="text-xs text-orange-500 bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded-full mt-2 inline-block">High Probability</span>
            </div>
             <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Met Today</h3>
                <p className="text-3xl font-bold text-green-500 mt-2">45</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Avg Resolution</h3>
                <p className="text-3xl font-bold text-flux-600 mt-2">2.4h</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold text-gray-900 dark:text-white">Live Timers</h3>
                </div>
                <div className="p-6 space-y-6">
                    {slas.map(sla => (
                        <div key={sla.id} className="relative">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{sla.name}</span>
                                <span className={`text-sm font-mono font-bold ${getSLAColor(sla.remaining, sla.target)}`}>
                                    {sla.remaining > 0 ? `${Math.floor(sla.remaining)}m remaining` : 'BREACHED'}
                                </span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ${sla.remaining < 0 ? 'bg-red-500' : sla.remaining < sla.target * 0.25 ? 'bg-orange-500' : 'bg-green-500'}`} 
                                    style={{ width: getProgressWidth(sla.remaining, sla.target) }}
                                />
                            </div>
                            {sla.remaining < sla.target * 0.25 && sla.remaining > 0 && (
                                <div className="mt-2 flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                                    <AlertTriangle size={12} />
                                    <span>Approaching breach threshold. Priority escalation recommended.</span>
                                </div>
                            )}
                        </div>
                    ))}
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
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
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
