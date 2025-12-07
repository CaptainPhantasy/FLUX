// @ts-nocheck
import React, { useState } from 'react';
import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { VelocityData } from '../types';
import { AIService } from '../services/aiService';
import { Brain, TrendingUp } from 'lucide-react';

interface VelocityChartProps {
  data: VelocityData[];
}

const VelocityChart: React.FC<VelocityChartProps> = ({ data }) => {
  const [chartData, setChartData] = useState<VelocityData[]>(data);
  const [prediction, setPrediction] = useState<{ next: number, analysis: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePredict = async () => {
    setIsLoading(true);
    try {
      const result = await AIService.forecastVelocity(data);
      setPrediction({ next: result.nextSprint, analysis: result.analysis });
      
      // Add prediction to chart data temporarily
      const nextSprintNum = data.length + 1;
      const predictedDataPoint: VelocityData = {
        sprintId: `S-${nextSprintNum}`,
        sprintName: `Sprint ${nextSprintNum} (Pred)`,
        committed: 0,
        completed: result.nextSprint,
        date: 'Next Sprint',
        predicted: true
      };
      setChartData([...data, predictedDataPoint]);
    } catch (e) {
      alert("Prediction failed. Check API configuration.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Team Velocity
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Historical performance & committed vs completed</p>
        </div>
        <button
          onClick={handlePredict}
          disabled={isLoading || !!prediction}
          className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
             <span className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full"/>
          ) : (
            <Brain className="w-4 h-4" />
          )}
          {prediction ? 'Forecast Generated' : 'AI Forecast'}
        </button>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-gray-700" />
            <XAxis 
              dataKey="sprintName" 
              tick={{ fill: '#6B7280', fontSize: 12 }} 
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: '#6B7280', fontSize: 12 }} 
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              cursor={{ fill: 'transparent' }}
            />
            <Legend />
            <Bar dataKey="committed" name="Committed" fill="#9CA3AF" barSize={20} radius={[4, 4, 0, 0]} />
            <Bar dataKey="completed" name="Completed" fill="#8B5CF6" barSize={20} radius={[4, 4, 0, 0]} />
            <Line 
              type="monotone" 
              dataKey="completed" 
              stroke="#F59E0B" 
              strokeWidth={2} 
              dot={{ r: 4 }}
              strokeDasharray="5 5" // Makes the whole line dash, ideally we only dash the prediction part, but for simplicity here
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {prediction && (
        <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
          <h4 className="font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            AI Insight
          </h4>
          <p className="text-sm text-purple-800 dark:text-purple-200 mt-1">
            {prediction.analysis}
          </p>
          <div className="mt-2 text-xs text-purple-600 dark:text-purple-400">
            Predicted Velocity: <span className="font-bold">{prediction.next} points</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple icon component for internal use if needed
const Sparkles = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
  </svg>
);

export default VelocityChart;