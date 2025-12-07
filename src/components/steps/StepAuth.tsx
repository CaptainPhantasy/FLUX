// @ts-nocheck
import React, { useState } from 'react';
import { Key, ArrowRight, ArrowLeft, ExternalLink } from 'lucide-react';

type ImportSource = 'jira' | 'asana' | 'trello' | 'monday' | 'linear' | 'csv';

interface StepAuthProps {
  source: ImportSource;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const StepAuth: React.FC<StepAuthProps> = ({ source, apiKey, onApiKeyChange, onNext, onBack }) => {
  const [showKey, setShowKey] = useState(false);

  const sourceConfig: Record<ImportSource, { name: string; docUrl: string }> = {
    jira: { name: 'Jira', docUrl: 'https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/' },
    trello: { name: 'Trello', docUrl: 'https://trello.com/power-ups/admin/api-key' },
    asana: { name: 'Asana', docUrl: 'https://developers.asana.com/docs/personal-access-token' },
    linear: { name: 'Linear', docUrl: 'https://linear.app/settings/api' },
    monday: { name: 'Monday', docUrl: 'https://monday.com/developers/apps/oauth' },
    csv: { name: 'CSV', docUrl: '' },
  };

  return (
    <div className="space-y-6">
      <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
            <Key size={24} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">API Key Authentication</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Enter your {sourceConfig[source].name} API key to authorize Flux to access your data.
            </p>
            
            {sourceConfig[source].docUrl && (
              <a
                href={sourceConfig[source].docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1"
              >
                How to get your API key
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">API Key</label>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder="Enter your API key..."
            className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700
              bg-white dark:bg-slate-800 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showKey ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2.5 text-slate-600 hover:text-slate-800 rounded-lg font-medium
            flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!apiKey.trim()}
          className="px-6 py-2.5 bg-violet-600 text-white rounded-lg font-medium
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:bg-violet-700 transition-colors flex items-center gap-2"
        >
          Continue
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
