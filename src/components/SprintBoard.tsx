// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Issue, Sprint, SprintIssue } from '../types';
import { AIService } from '../services/aiService';
import { MoreVertical, AlertTriangle, Sparkles, CheckCircle, ArrowRight, X } from 'lucide-react';

interface SprintBoardProps {
  sprint: Sprint;
  backlog: Issue[];
  onMoveIssue: (issueId: string, to: 'sprint' | 'backlog') => void;
  onUpdateSprint: (sprintId: string, updates: Partial<Sprint>) => void;
}

const SprintBoard: React.FC<SprintBoardProps> = ({ sprint, backlog, onMoveIssue, onUpdateSprint }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ issueIds: string[], reasoning: string, risk: string } | null>(null);

  const committedPoints = sprint.issues.reduce((sum, i) => sum + (i.issue.points || 0), 0);
  const capacityPercent = Math.min((committedPoints / sprint.capacity) * 100, 100);
  
  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string, source: 'sprint' | 'backlog') => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ id, source }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, target: 'sprint' | 'backlog') => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    if (data.source !== target) {
      onMoveIssue(data.id, target);
    }
  };

  const handleAIOptimize = async () => {
    setIsAnalyzing(true);
    try {
      const result = await AIService.optimizeSprint(backlog, sprint.capacity, 25); // Mock hist velocity
      setAiSuggestion({
        issueIds: result.issueIds,
        reasoning: result.reasoning,
        risk: result.riskAnalysis
      });
    } catch (err) {
      alert("AI Service unavailable. Ensure API Key is set.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyAISuggestion = () => {
    if (aiSuggestion) {
      aiSuggestion.issueIds.forEach(id => onMoveIssue(id, 'sprint'));
      setAiSuggestion(null);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header Stats */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {sprint.name} 
              <span className={`text-xs px-2 py-1 rounded-full ${sprint.state === 'active' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                {sprint.state.toUpperCase()}
              </span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Goal: {sprint.goal || "No goal set"}</p>
          </div>
          <div className="text-right">
             <button 
              onClick={handleAIOptimize}
              disabled={isAnalyzing}
              className="flex items-center gap-2 bg-gradient-to-r from-flux-600 to-flux-500 hover:from-flux-700 hover:to-flux-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {isAnalyzing ? (
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"/>
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isAnalyzing ? 'Analyzing...' : 'AI Optimize'}
            </button>
          </div>
        </div>

        {/* Capacity Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">Capacity Utilization</span>
            <span className="font-medium text-gray-900 dark:text-white">{committedPoints} / {sprint.capacity} pts</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${capacityPercent > 100 ? 'bg-red-500' : 'bg-flux-500'}`}
              style={{ width: `${Math.min(capacityPercent, 100)}%` }}
            />
          </div>
          {capacityPercent > 100 && (
            <div className="flex items-center gap-1 text-xs text-red-500 mt-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Sprint is over capacity! Consider removing low priority items.</span>
            </div>
          )}
        </div>
      </div>

      {/* AI Suggestion Panel */}
      {aiSuggestion && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-4 rounded-xl animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-start">
            <div className="flex gap-3">
              <div className="bg-indigo-100 dark:bg-indigo-800 p-2 rounded-lg text-indigo-600 dark:text-indigo-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">AI Optimization Plan</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{aiSuggestion.reasoning}</p>
                <div className="mt-2 text-xs font-medium text-orange-600 dark:text-orange-400 flex items-center gap-1">
                   <AlertTriangle className="w-3 h-3" /> Risk Analysis: {aiSuggestion.risk}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
               <button 
                onClick={() => setAiSuggestion(null)}
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
              <button 
                onClick={applyAISuggestion}
                className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Board Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px]">
        {/* Backlog Column */}
        <div 
          className="flex flex-col bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'backlog')}
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold text-gray-700 dark:text-gray-200">Backlog</h3>
            <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded text-xs">
              {backlog.length} issues
            </span>
          </div>
          <div className="p-4 flex-1 space-y-3 overflow-y-auto max-h-[600px]">
            {backlog.map(issue => (
              <IssueCard 
                key={issue.id} 
                issue={issue} 
                source="backlog"
                onDragStart={handleDragStart} 
                onMove={() => onMoveIssue(issue.id, 'sprint')}
              />
            ))}
            {backlog.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                Backlog is empty
              </div>
            )}
          </div>
        </div>

        {/* Sprint Column */}
        <div 
          className="flex flex-col bg-white dark:bg-gray-800 rounded-xl border-2 border-flux-100 dark:border-flux-900 shadow-sm"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'sprint')}
        >
           <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-flux-50 dark:bg-flux-900/30 rounded-t-lg">
            <h3 className="font-semibold text-flux-900 dark:text-flux-100">Sprint Backlog</h3>
            <span className="bg-flux-100 dark:bg-flux-800 text-flux-700 dark:text-flux-200 px-2 py-0.5 rounded text-xs">
              {sprint.issues.length} issues
            </span>
          </div>
          <div className="p-4 flex-1 space-y-3 overflow-y-auto max-h-[600px]">
            {sprint.issues.map(({ issue }) => (
              <IssueCard 
                key={issue.id} 
                issue={issue} 
                source="sprint"
                onDragStart={handleDragStart}
                onMove={() => onMoveIssue(issue.id, 'backlog')}
              />
            ))}
             {sprint.issues.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                Drop items here to add to sprint
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const IssueCard: React.FC<{
  issue: Issue; 
  source: 'sprint' | 'backlog';
  onDragStart: (e: React.DragEvent, id: string, source: 'sprint' | 'backlog') => void;
  onMove: () => void;
}> = ({ issue, source, onDragStart, onMove }) => {
  const priorityColor = {
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }[issue.priority];

  return (
    <div 
      draggable 
      onDragStart={(e) => onDragStart(e, issue.id, source)}
      className="group bg-white dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-all cursor-move flex flex-col gap-2 relative"
    >
      <div className="flex justify-between items-start">
        <span className="text-xs text-gray-500 font-mono">{issue.id}</span>
        <button onClick={onMove} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-flux-500">
           {source === 'backlog' ? <ArrowRight className="w-4 h-4"/> : <X className="w-4 h-4"/>}
        </button>
      </div>
      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">{issue.title}</h4>
      <div className="flex items-center justify-between mt-1">
        <div className="flex gap-2">
           <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${priorityColor}`}>
            {issue.priority}
           </span>
           <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
             {issue.type}
           </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs font-bold bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-full w-6 h-6 flex items-center justify-center">
            {issue.points}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SprintBoard;