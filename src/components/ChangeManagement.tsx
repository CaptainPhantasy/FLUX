// @ts-nocheck
import React, { useState } from 'react';
import { ChangeRequest, ChangeStatus } from '../types';
import { analyzeChangeImpact } from '../services/geminiService';
import { Calendar, CheckSquare, AlertOctagon, ArrowRight, ShieldAlert, Sparkles, X, Check, Clock } from 'lucide-react';

const MOCK_CHANGES: ChangeRequest[] = [
  {
    id: 'c1',
    number: 'CHG00451',
    title: 'Upgrade Core Switch Firmware',
    description: 'Updating the core network switches to v14.2 to patch security vulnerabilities.',
    type: 'normal',
    risk: 'high',
    status: 'CAB Approval',
    plannedDate: '2023-11-15T02:00:00Z',
    approvers: [],
    implementationPlan: '1. Backup configs. 2. Upload firmware. 3. Reboot secondary. 4. Reboot primary.',
    rollbackPlan: 'Boot from previous partition.',
    impactAnalysis: 'Network interruption for 15 minutes.',
    category: 'Network'
  },
  {
    id: 'c2',
    number: 'CHG00452',
    title: 'Deploy Hotfix to Payment Gateway',
    description: 'Fixing a rounding error in currency conversion.',
    type: 'emergency',
    risk: 'medium',
    status: 'Implementation',
    plannedDate: '2023-10-28T22:00:00Z',
    approvers: [],
    implementationPlan: 'Deploy container tag v2.1.1',
    rollbackPlan: 'Revert to v2.1.0',
    impactAnalysis: 'No downtime expected.',
    category: 'Application'
  }
];

export const ChangeManagement: React.FC = () => {
  const [changes, setChanges] = useState<ChangeRequest[]>(MOCK_CHANGES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  
  // State for viewing/editing changes
  const [viewingChange, setViewingChange] = useState<ChangeRequest | null>(null);
  
  // Form State
  const [newChange, setNewChange] = useState<Partial<ChangeRequest>>({
    title: '',
    implementationPlan: '',
    risk: 'low'
  });

  const runImpactAnalysis = async () => {
    if (!newChange.title || !newChange.implementationPlan) return;
    setAnalyzing(true);
    try {
      const result = await analyzeChangeImpact(newChange.title, newChange.implementationPlan);
      setNewChange(prev => ({
        ...prev,
        risk: result.risk,
        impactAnalysis: result.impactAnalysis,
        rollbackPlan: prev.rollbackPlan || result.rollbackSuggestions,
        aiRiskAnalysis: {
            score: result.score,
            reasoning: result.impactAnalysis,
            suggestedRollback: result.rollbackSuggestions
        }
      }));
    } finally {
      setAnalyzing(false);
    }
  };

  const createChange = () => {
    const change: ChangeRequest = {
        id: Math.random().toString(),
        number: `CHG${Math.floor(Math.random()*10000)}`,
        title: newChange.title!,
        description: newChange.description || '',
        type: newChange.type || 'normal',
        risk: newChange.risk || 'low',
        status: 'Draft',
        plannedDate: newChange.plannedDate || new Date().toISOString(),
        approvers: [],
        implementationPlan: newChange.implementationPlan!,
        rollbackPlan: newChange.rollbackPlan || '',
        impactAnalysis: newChange.impactAnalysis || '',
        category: 'General'
    };
    setChanges([...changes, change]);
    setIsModalOpen(false);
    setNewChange({ title: '', implementationPlan: '', risk: 'low' });
  };

  const updateChangeStatus = (id: string, newStatus: ChangeStatus) => {
    setChanges(changes.map(c => c.id === id ? { ...c, status: newStatus } : c));
    setViewingChange(null);
  };

  const openCreateModal = () => {
      setViewingChange(null);
      setNewChange({ title: '', implementationPlan: '', risk: 'low' });
      setIsModalOpen(true);
  };

  const openViewModal = (change: ChangeRequest) => {
      setViewingChange(change);
      setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Change Management</h2>
          <p className="text-gray-500 dark:text-gray-400">Plan, approve, and implement changes with AI risk assessment.</p>
        </div>
        <button onClick={openCreateModal} className="bg-flux-600 hover:bg-flux-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm">
            <Calendar size={18} />
            Schedule Change
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
        {/* Kanban-like Columns */}
        {['CAB Approval', 'Scheduled', 'Implementation'].map(status => (
            <div key={status} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 flex flex-col h-full border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${status === 'CAB Approval' ? 'bg-purple-500' : status === 'Scheduled' ? 'bg-blue-500' : 'bg-orange-500'}`}></span>
                    {status}
                </h3>
                <div className="space-y-3 overflow-y-auto flex-1 pr-2">
                    {changes.filter(c => c.status === status || (status === 'CAB Approval' && c.status === 'Draft')).map(c => (
                        <div 
                          key={c.id} 
                          onClick={() => openViewModal(c)}
                          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-flux-300 dark:hover:border-flux-600 transition-all cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{c.number}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold ${c.risk === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                                    {c.risk} Risk
                                </span>
                            </div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-1">{c.title}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{c.description}</p>
                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock size={12} />
                                  {new Date(c.plannedDate).toLocaleDateString()}
                                </span>
                                {c.status === 'Draft' && <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">DRAFT</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {viewingChange ? `Change Request: ${viewingChange.number}` : 'New Change Request'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-6 space-y-6 flex-1">
                    {viewingChange ? (
                        // READ ONLY / ACTION VIEW
                        <div className="space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{viewingChange.title}</h2>
                                    <p className="text-gray-500 dark:text-gray-400 mt-1">{viewingChange.description}</p>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-sm font-bold uppercase ${viewingChange.status === 'CAB Approval' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                                    {viewingChange.status}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Implementation Plan</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{viewingChange.implementationPlan}</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Rollback Plan</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{viewingChange.rollbackPlan}</p>
                                </div>
                            </div>
                            
                            <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl flex items-start gap-4">
                                <ShieldAlert className="text-red-500 shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-bold text-red-700 dark:text-red-400">Risk Assessment ({viewingChange.risk.toUpperCase()})</h4>
                                    <p className="text-sm text-red-600 dark:text-red-300 mt-1">{viewingChange.impactAnalysis}</p>
                                </div>
                            </div>

                            {/* Workflow Actions */}
                            {viewingChange.status === 'CAB Approval' && (
                                <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <button 
                                        onClick={() => updateChangeStatus(viewingChange.id, 'Scheduled')}
                                        className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2"
                                    >
                                        <CheckSquare size={20} />
                                        Approve & Schedule
                                    </button>
                                    <button 
                                        onClick={() => updateChangeStatus(viewingChange.id, 'Draft')}
                                        className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300 py-3 rounded-xl font-medium"
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}
                             {viewingChange.status === 'Draft' && (
                                <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <button 
                                        onClick={() => updateChangeStatus(viewingChange.id, 'CAB Approval')}
                                        className="flex-1 bg-flux-600 hover:bg-flux-500 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2"
                                    >
                                        Submit for CAB Approval
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        // EDIT / CREATE MODE
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Change Title</label>
                                <input 
                                    value={newChange.title}
                                    onChange={(e) => setNewChange({...newChange, title: e.target.value})}
                                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-flux-500 outline-none"
                                    placeholder="e.g. Upgrade Database Server"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Implementation Plan</label>
                                <textarea 
                                    value={newChange.implementationPlan}
                                    onChange={(e) => setNewChange({...newChange, implementationPlan: e.target.value})}
                                    rows={4}
                                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-flux-500 outline-none"
                                    placeholder="Step by step execution plan..."
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={runImpactAnalysis}
                                    disabled={analyzing || !newChange.title || !newChange.implementationPlan}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50 transition-colors shadow-sm"
                                >
                                    {analyzing ? <span className="animate-spin">⌛</span> : <Sparkles size={16} />}
                                    AI Risk & Impact Analysis
                                </button>
                            </div>

                            {newChange.aiRiskAnalysis && (
                                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 p-4 rounded-xl animate-in slide-in-from-top-2">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-full ${newChange.risk === 'high' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                            <ShieldAlert size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white">Risk Score: {newChange.aiRiskAnalysis.score}/100</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{newChange.aiRiskAnalysis.reasoning}</p>
                                            <div className="mt-2 text-xs font-mono bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                                                <strong>Suggested Rollback:</strong> {newChange.aiRiskAnalysis.suggestedRollback}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Risk Level</label>
                                    <select 
                                        value={newChange.risk}
                                        onChange={(e) => setNewChange({...newChange, risk: e.target.value as any})}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                                    <select 
                                        value={newChange.type}
                                        onChange={(e) => setNewChange({...newChange, type: e.target.value as any})}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white"
                                    >
                                        <option value="standard">Standard</option>
                                        <option value="normal">Normal</option>
                                        <option value="emergency">Emergency</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {!viewingChange && (
                    <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900">Cancel</button>
                        <button onClick={createChange} className="px-4 py-2 bg-flux-600 text-white rounded-lg hover:bg-flux-500 font-medium shadow-sm">Submit Request</button>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};
