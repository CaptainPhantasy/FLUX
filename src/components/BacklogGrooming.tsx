// @ts-nocheck
import React, { useState } from 'react';
import { Issue } from '../types';
import { AIService } from '../services/aiService';
import { Wand2, Plus, Filter, Search, MoreHorizontal } from 'lucide-react';

interface BacklogGroomingProps {
  issues: Issue[];
  onUpdateIssue: (id: string, updates: Partial<Issue>) => void;
  onCreateIssue: (issue: Partial<Issue>) => void;
}

const BacklogGrooming: React.FC<BacklogGroomingProps> = ({ issues, onUpdateIssue, onCreateIssue }) => {
  const [filter, setFilter] = useState('');
  const [isEstimating, setIsEstimating] = useState(false);

  const unestimatedIssues = issues.filter(i => i.points === 0);

  const handleAIEstimate = async () => {
    if (unestimatedIssues.length === 0) return;
    setIsEstimating(true);
    try {
      const result = await AIService.estimateIssues(unestimatedIssues);
      result.estimates.forEach(est => {
        onUpdateIssue(est.id, { points: est.points });
      });
    } catch (e) {
      alert("Estimation failed. Check API Key.");
    } finally {
      setIsEstimating(false);
    }
  };

  const filteredIssues = issues.filter(i => 
    i.title.toLowerCase().includes(filter.toLowerCase()) || 
    i.id.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Search backlog..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-flux-500 outline-none text-gray-900 dark:text-white"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={handleAIEstimate}
            disabled={isEstimating || unestimatedIssues.length === 0}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors disabled:opacity-50"
          >
            {isEstimating ? <div className="animate-spin h-3 w-3 border-2 border-current rounded-full border-t-transparent" /> : <Wand2 className="w-4 h-4" />}
            Auto-Estimate ({unestimatedIssues.length})
          </button>
          
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-flux-600 text-white rounded-lg text-sm font-medium hover:bg-flux-700 transition-colors">
            <Plus className="w-4 h-4" />
            Create Issue
          </button>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        <div className="col-span-1">ID</div>
        <div className="col-span-6">Title</div>
        <div className="col-span-2">Priority</div>
        <div className="col-span-1">Pts</div>
        <div className="col-span-1">Status</div>
        <div className="col-span-1 text-right">Actions</div>
      </div>

      {/* Table Body */}
      <div className="overflow-y-auto flex-1 p-2 space-y-1">
        {filteredIssues.map(issue => (
          <div key={issue.id} className="grid grid-cols-12 gap-4 p-3 items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors group">
            <div className="col-span-1 text-xs font-mono text-gray-500">{issue.id}</div>
            <div className="col-span-6">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{issue.title}</div>
              <div className="text-xs text-gray-500 flex items-center gap-2">
                 <span className={`w-2 h-2 rounded-full ${issue.type === 'bug' ? 'bg-red-500' : issue.type === 'story' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                 {issue.type}
              </div>
            </div>
            <div className="col-span-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                ${issue.priority === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 
                  issue.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' : 
                  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}`}>
                {issue.priority}
              </span>
            </div>
            <div className="col-span-1">
              {issue.points > 0 ? (
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300">
                  {issue.points}
                </span>
              ) : (
                <span className="text-gray-400 text-xs italic">--</span>
              )}
            </div>
            <div className="col-span-1">
              <span className="text-xs text-gray-500 capitalize">{issue.status.replace('_', ' ')}</span>
            </div>
            <div className="col-span-1 text-right opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                <MoreHorizontal className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BacklogGrooming;