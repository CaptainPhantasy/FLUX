// @ts-nocheck
import React, { useState } from 'react';
import { CustomField } from '../types';
import { suggestFields } from '../services/geminiService';
import { Settings, Plus, Lightbulb, Check, Database, List, Type, Calendar } from 'lucide-react';

const CustomFieldBuilder: React.FC = () => {
  const [fields, setFields] = useState<CustomField[]>([
    {
      id: 'f1',
      name: 'Severity',
      type: 'select',
      required: true,
      context: { projectIds: ['all'], issueTypeIds: ['bug'] },
      validation: [],
      options: [{ id: 'opt1', value: 'Critical', color: 'red' }, { id: 'opt2', value: 'Low', color: 'green' }]
    }
  ]);
  const [projectDesc, setProjectDesc] = useState('');
  const [suggestions, setSuggestions] = useState<Partial<CustomField>[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSuggest = async () => {
    if (!projectDesc) return;
    setLoading(true);
    const results = await suggestFields(projectDesc);
    setSuggestions(results);
    setLoading(false);
  };

  const addField = (field: Partial<CustomField>) => {
    const newField: CustomField = {
      id: `field-${Date.now()}`,
      name: field.name || 'New Field',
      type: field.type || 'text',
      description: field.description,
      required: field.required || false,
      context: { projectIds: [], issueTypeIds: [] },
      validation: field.validation || []
    };
    setFields([...fields, newField]);
    setSuggestions(prev => prev.filter(s => s.name !== field.name));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'date': return <Calendar size={16} />;
      case 'select': return <List size={16} />;
      case 'number': return <Database size={16} />;
      default: return <Type size={16} />;
    }
  };

  return (
    <div className="flex h-full bg-slate-50 dark:bg-slate-900">
      {/* Sidebar / Configuration */}
      <div className="w-80 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-bold text-slate-900 dark:text-white flex items-center">
            <Settings className="mr-2" size={20} />
            Field Manager
          </h2>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">AI Discovery</h3>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-100 dark:border-purple-900/50">
              <label className="block text-xs text-purple-800 dark:text-purple-300 mb-2">
                Describe your project to get field suggestions:
              </label>
              <textarea
                className="w-full text-sm p-2 rounded border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 mb-2 focus:ring-2 focus:ring-purple-500 outline-none text-slate-800 dark:text-slate-200"
                rows={3}
                placeholder="e.g. A content marketing request portal"
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
              />
              <button
                onClick={handleSuggest}
                disabled={loading || !projectDesc}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2 rounded flex items-center justify-center transition-colors disabled:opacity-50"
              >
                {loading ? 'Thinking...' : 'Suggest Fields'}
                {!loading && <Lightbulb size={14} className="ml-1" />}
              </button>
            </div>

            {suggestions.length > 0 && (
              <div className="mt-4 space-y-2">
                {suggestions.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded shadow-sm">
                    <div className="flex items-center space-x-2 overflow-hidden">
                       <span className="text-slate-400">{getTypeIcon(s.type || 'text')}</span>
                       <div className="truncate">
                         <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{s.name}</div>
                         <div className="text-[10px] text-slate-500">{s.required ? 'Required' : 'Optional'}</div>
                       </div>
                    </div>
                    <button 
                      onClick={() => addField(s)}
                      className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Field List */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Project Fields</h1>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center font-medium">
            <Plus size={18} className="mr-2" />
            Create Field
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-left">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Field Name</th>
                <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Required</th>
                <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Context</th>
                <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {fields.map(field => (
                <tr key={field.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                        {getTypeIcon(field.type)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">{field.name}</div>
                        <div className="text-sm text-slate-500">{field.description || 'No description'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300">
                      {field.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {field.required ? (
                      <span className="text-red-500 flex items-center text-xs font-bold"><Check size={12} className="mr-1" /> Yes</span>
                    ) : (
                      <span className="text-slate-400 text-xs">No</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    Global
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomFieldBuilder;
