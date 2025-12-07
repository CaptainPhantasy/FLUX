// @ts-nocheck
import React, { useState } from 'react';
import { 
  Filter, 
  MoreVertical, 
  Plus, 
  Search, 
  Sparkles,
  User as UserIcon,
  Zap,
  Check,
  X,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { Incident } from '../types';
import { analyzeIncident } from '../services/geminiService';

const MOCK_INCIDENTS: Incident[] = [
  {
    id: '1',
    number: 'INC0010234',
    title: 'Email Service Outage',
    description: 'Users report unable to send or receive emails via Outlook.',
    severity: 'critical',
    urgency: 'high',
    impact: 'high',
    status: 'In Progress',
    category: 'Software',
    created: new Date(Date.now() - 3600000).toISOString(),
    assignee: { id: 'u1', name: 'John Doe', role: 'L2 Support' },
    activeSLAs: [{ id: 'sla1', name: 'Resolution Time', target: 240, remaining: 180, metric: 'resolution', breached: false, startTime: new Date().toISOString() }],
    breachedSLAs: []
  },
  {
    id: '2',
    number: 'INC0010235',
    title: 'Printer on 3rd Floor Jammed',
    description: 'Paper jam in the main corridor printer.',
    severity: 'low',
    urgency: 'low',
    impact: 'low',
    status: 'New',
    category: 'Hardware',
    created: new Date(Date.now() - 7200000).toISOString(),
    activeSLAs: [],
    breachedSLAs: []
  }
];

export const IncidentManagement: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>(MOCK_INCIDENTS);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newIncidentDesc, setNewIncidentDesc] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [formData, setFormData] = useState<Partial<Incident>>({
    title: '',
    severity: 'low',
    category: '',
    description: ''
  });

  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'All' | 'New' | 'In Progress' | 'Resolved'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Action Menu State
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  const handleAiTriage = async () => {
    if (!newIncidentDesc) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeIncident(newIncidentDesc);
      setAiAnalysis(result);
      setFormData(prev => ({
        ...prev,
        description: newIncidentDesc,
        severity: result.severity,
        category: result.category,
        urgency: result.urgency,
        impact: result.impact
      }));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateIncident = () => {
    const newInc: Incident = {
      id: Math.random().toString(36).substr(2, 9),
      number: `INC${Math.floor(Math.random() * 1000000)}`,
      title: formData.title || 'Untitled Incident',
      description: formData.description || '',
      severity: formData.severity || 'low',
      urgency: formData.urgency || 'low',
      impact: formData.impact || 'low',
      status: 'New',
      category: formData.category || 'General',
      created: new Date().toISOString(),
      activeSLAs: [{ id: 'sla_new', name: 'Response Time', target: 60, remaining: 60, metric: 'response', breached: false, startTime: new Date().toISOString() }],
      breachedSLAs: [],
      assignee: { id: 'bot', name: 'Unassigned', role: 'System' }
    };
    setIncidents([newInc, ...incidents]);
    setIsCreateModalOpen(false);
    setNewIncidentDesc('');
    setAiAnalysis(null);
    setFormData({ title: '', severity: 'low', category: '', description: '' });
  };

  const handleResolve = (id: string) => {
    setIncidents(incidents.map(inc => inc.id === id ? { ...inc, status: 'Resolved' } : inc));
    setOpenActionId(null);
  };

  const handleDelete = (id: string) => {
    setIncidents(incidents.filter(inc => inc.id !== id));
    setOpenActionId(null);
  };

  const filteredIncidents = incidents.filter(inc => {
    const matchesFilter = activeFilter === 'All' || inc.status === activeFilter;
    const matchesSearch = inc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         inc.number.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default: return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6" onClick={() => setOpenActionId(null)}>
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Incident Management</h2>
          <p className="text-gray-500 dark:text-gray-400">Track and resolve IT incidents efficiently</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center space-x-2 bg-flux-600 hover:bg-flux-500 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span>New Incident</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col space-y-3 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all">
        <div className="flex space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by number, title, or assignee..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-flux-500 outline-none"
            />
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); setShowFilters(!showFilters); }}
            className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${showFilters ? 'bg-flux-50 border-flux-500 text-flux-700 dark:bg-flux-900/20 dark:text-flux-300' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            <Filter size={18} />
            <span>Filter</span>
          </button>
        </div>
        
        {/* Expandable Filter Bar */}
        {showFilters && (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-2 duration-200">
             <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Status:</span>
             {['All', 'New', 'In Progress', 'Resolved'].map((status) => (
               <button
                 key={status}
                 onClick={() => setActiveFilter(status as any)}
                 className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                   activeFilter === status 
                     ? 'bg-flux-100 text-flux-700 dark:bg-flux-900/40 dark:text-flux-300' 
                     : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                 }`}
               >
                 {status}
               </button>
             ))}
          </div>
        )}
      </div>

      {/* Incident List */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Incident</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Severity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Assignee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredIncidents.length > 0 ? filteredIncidents.map((incident) => (
                <tr key={incident.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-flux-600 dark:text-flux-400 hover:underline cursor-pointer">
                        {incident.number}
                      </span>
                      <span className="text-sm text-gray-900 dark:text-white font-medium mt-0.5">{incident.title}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{incident.description}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getSeverityColor(incident.severity)}`}>
                      {incident.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm ${incident.status === 'Resolved' ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                      {incident.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                        <UserIcon size={14} className="text-gray-500 dark:text-gray-300" />
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{incident.assignee?.name || 'Unassigned'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(incident.created).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenActionId(openActionId === incident.id ? null : incident.id);
                      }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <MoreVertical size={18} />
                    </button>
                    
                    {/* Action Dropdown */}
                    {openActionId === incident.id && (
                      <div className="absolute right-8 top-8 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 py-1 text-left animate-in fade-in zoom-in-95 duration-100">
                        {incident.status !== 'Resolved' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleResolve(incident.id); }}
                            className="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <CheckCircle2 size={16} className="text-green-500" />
                            Resolve Incident
                          </button>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(incident.id); }}
                          className="w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No incidents found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Create New Incident
                <span className="text-xs bg-flux-100 text-flux-700 px-2 py-1 rounded-full dark:bg-flux-900/30 dark:text-flux-300">AI Enabled</span>
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* AI Triage Section */}
              <div className="bg-flux-50 dark:bg-flux-900/20 rounded-xl p-4 border border-flux-100 dark:border-flux-800/50">
                <label className="block text-sm font-medium text-flux-900 dark:text-flux-200 mb-2">
                  <Sparkles className="inline w-4 h-4 mr-1 text-flux-500" />
                  Describe the issue for AI Triage
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newIncidentDesc}
                    onChange={(e) => setNewIncidentDesc(e.target.value)}
                    placeholder="e.g., 'The main database server is not responding to queries...'"
                    className="flex-1 rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 focus:ring-2 focus:ring-flux-500"
                  />
                  <button
                    onClick={handleAiTriage}
                    disabled={isAnalyzing || !newIncidentDesc}
                    className="bg-flux-600 text-white px-4 py-2 rounded-lg hover:bg-flux-500 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {isAnalyzing ? <span className="animate-spin">⌛</span> : <Zap size={16} />}
                    Triage
                  </button>
                </div>
                {aiAnalysis && (
                  <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg text-sm border border-flux-200 dark:border-flux-800">
                    <p className="font-medium text-gray-900 dark:text-white mb-1">AI Reasoning:</p>
                    <p className="text-gray-600 dark:text-gray-300">{aiAnalysis.reasoning}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs text-gray-700 dark:text-gray-300">
                        Suggested Group: <b>{aiAnalysis.suggestedGroup}</b>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                  <input 
                    type="text" 
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-flux-500 outline-none"
                    placeholder="Short incident summary"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Severity</label>
                  <select 
                    value={formData.severity}
                    onChange={e => setFormData({...formData, severity: e.target.value as any})}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-flux-500 outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <input 
                    type="text" 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-flux-500 outline-none"
                  />
                </div>

                <div className="col-span-2">
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                   <textarea 
                    rows={4}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-flux-500 outline-none"
                   ></textarea>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateIncident}
                className="px-4 py-2 bg-flux-600 text-white rounded-lg hover:bg-flux-500 font-medium"
              >
                Create Incident
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
