// @ts-nocheck
import React, { useState } from 'react';
import { AutomationRule, Action, Condition, Trigger } from '../types';
import { Sparkles, Play, Plus, Trash2, Clock, Zap, MessageSquare } from 'lucide-react';
import { generateRuleFromText } from '../services/geminiService';

const AutomationRules: React.FC = () => {
  const [rules, setRules] = useState<AutomationRule[]>([
    {
      id: '1',
      name: 'Auto-assign Bug Reports',
      enabled: true,
      projectId: 'proj-1',
      executionCount: 124,
      lastExecuted: '2023-10-24T10:00:00Z',
      trigger: { type: 'issue_created', params: {} },
      conditions: [{ field: 'type', operator: 'equals', value: 'Bug' }],
      actions: [{ type: 'assign_user', params: { userId: 'qa-lead' } }]
    },
    {
      id: '2',
      name: 'Close stale tickets',
      enabled: false,
      projectId: 'proj-1',
      executionCount: 0,
      trigger: { type: 'issue_updated', params: {} },
      conditions: [{ field: 'status', operator: 'equals', value: 'Resolved' }],
      actions: [{ type: 'transition_issue', params: { to: 'Closed' } }]
    }
  ]);

  const [nlPrompt, setNlPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showWizard, setShowWizard] = useState(false);

  const handleGenerateRule = async () => {
    if (!nlPrompt.trim()) return;
    setIsGenerating(true);
    
    const partialRule = await generateRuleFromText(nlPrompt);
    
    const newRule: AutomationRule = {
      id: `rule-${Date.now()}`,
      name: partialRule.name || 'AI Generated Rule',
      enabled: true,
      projectId: 'current',
      executionCount: 0,
      trigger: partialRule.trigger as Trigger || { type: 'issue_created', params: {} },
      conditions: partialRule.conditions as Condition[] || [],
      actions: partialRule.actions as Action[] || [],
    };

    setRules(prev => [newRule, ...prev]);
    setIsGenerating(false);
    setNlPrompt('');
    setShowWizard(false);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Automation Rules</h2>
          <p className="text-slate-500 dark:text-slate-400">Manage automatic actions and triggers for your project.</p>
        </div>
        <button 
          onClick={() => setShowWizard(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-lg shadow-purple-600/20"
        >
          <Sparkles size={18} />
          <span>Create with AI</span>
        </button>
      </div>

      {showWizard && (
        <div className="mb-8 bg-white dark:bg-slate-800 rounded-xl p-6 border border-purple-200 dark:border-purple-900/50 shadow-xl">
          <div className="flex items-start space-x-4">
            <div className="bg-purple-100 dark:bg-purple-900/50 p-3 rounded-full">
              <Sparkles className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Describe your automation</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Use natural language. For example: "When a high priority bug is created, send a Slack message to the #engineering channel."
              </p>
              <textarea
                value={nlPrompt}
                onChange={(e) => setNlPrompt(e.target.value)}
                placeholder="Type your rule description here..."
                className="w-full p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 outline-none text-slate-800 dark:text-slate-200 h-24 resize-none mb-4"
              />
              <div className="flex justify-end space-x-3">
                <button 
                  onClick={() => setShowWizard(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleGenerateRule}
                  disabled={isGenerating || !nlPrompt}
                  className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-medium disabled:opacity-50 flex items-center space-x-2"
                >
                  {isGenerating ? <span>Generating...</span> : <span>Generate Rule</span>}
                  {!isGenerating && <ArrowRight size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {rules.map(rule => (
          <div key={rule.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:border-purple-300 dark:hover:border-purple-700 transition-colors group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${rule.enabled ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                  <Zap size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-lg">{rule.name}</h3>
                  <div className="text-sm text-slate-500 flex items-center space-x-2">
                    <span className="flex items-center"><Play size={12} className="mr-1"/> {rule.executionCount} runs</span>
                    <span>•</span>
                    <span className="flex items-center"><Clock size={12} className="mr-1"/> Last run: {rule.lastExecuted ? new Date(rule.lastExecuted).toLocaleDateString() : 'Never'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={rule.enabled} 
                    onChange={() => setRules(prev => prev.map(r => r.id === rule.id ? {...r, enabled: !r.enabled} : r))}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                </label>
                <button className="text-slate-400 hover:text-red-500 transition-colors p-2">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-sm">
              <div className="bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                <span className="font-bold text-slate-500 dark:text-slate-500 mr-2">IF</span>
                {rule.trigger.type.replace('_', ' ')}
              </div>
              
              {rule.conditions.length > 0 && (
                <>
                  <div className="w-4 h-px bg-slate-300 dark:bg-slate-600"></div>
                  <div className="bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                    <span className="font-bold text-slate-500 dark:text-slate-500 mr-2">AND</span>
                    {rule.conditions.length} conditions
                  </div>
                </>
              )}

              <div className="w-8 flex justify-center text-slate-300 dark:text-slate-600">
                <ArrowRight size={16} />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/30">
                <span className="font-bold text-blue-400 dark:text-blue-500 mr-2">THEN</span>
                {rule.actions.map(a => a.type.replace('_', ' ')).join(', ')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function ArrowRight({ size }: { size: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

export default AutomationRules;
