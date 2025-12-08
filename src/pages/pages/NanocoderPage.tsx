// =====================================
// FLUX - Nanocoder Settings Page
// =====================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNanocoder } from '@/features/nanocoder';
import { getAvailableProviders, getLLMProvider } from '@/features/nanocoder/llm';
import { VoiceController, getTextToSpeech } from '@/features/nanocoder/voice';
import { Button } from '@/components/ui';
import { 
  Mic, MicOff, Volume2, VolumeX, Bot, Zap, 
  Terminal, Settings, CheckCircle2, XCircle,
  Play, Square, Sparkles, BrainCircuit
} from 'lucide-react';
import type { LLMProviderType } from '@/features/nanocoder/types';

export default function NanocoderPage() {
  const { 
    state, 
    setLLMProvider, 
    setVoiceEnabled, 
    setContinuousListening,
    setTTSEnabled,
    setTTSRate,
    processCommand,
  } = useNanocoder();

  const [providers, setProviders] = useState<{ type: LLMProviderType; configured: boolean }[]>([]);
  const [testInput, setTestInput] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [providerTestResults, setProviderTestResults] = useState<Record<string, { success: boolean; error?: string; model?: string; duration?: number }>>({});
  const [isTestingProviders, setIsTestingProviders] = useState(false);

  // Load providers on mount
  useEffect(() => {
    setProviders(getAvailableProviders());
  }, []);

  // Load TTS voices
  useEffect(() => {
    const tts = getTextToSpeech();
    const loadVoices = () => {
      setAvailableVoices(tts.getVoices());
    };
    loadVoices();
    // Voices might load asynchronously
    const timeout = setTimeout(loadVoices, 500);
    return () => clearTimeout(timeout);
  }, []);

  // Test command handler
  const handleTestCommand = async () => {
    if (!testInput.trim() || isTesting) return;
    
    setIsTesting(true);
    setTestResponse('');
    
    try {
      const response = await processCommand(testInput);
      setTestResponse(response);
    } catch (error) {
      setTestResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  // Test all providers
  const handleTestAllProviders = async () => {
    if (isTestingProviders) return;
    
    setIsTestingProviders(true);
    const results: Record<string, { success: boolean; error?: string; model?: string; duration?: number }> = {};
    
    for (const provider of providers) {
      try {
        const providerInstance = getLLMProvider(provider.type);
        
        if (!providerInstance.isConfigured()) {
          results[provider.type] = {
            success: false,
            error: 'Not configured (missing API key)',
          };
          continue;
        }

        const model = providerInstance.getModel();
        const startTime = Date.now();
        
        // Simple test message
        const testMessage = 'Say "Hello, I am working correctly" if you can read this.';
        const result = await providerInstance.chat(testMessage, [], []);
        const duration = Date.now() - startTime;
        
        results[provider.type] = {
          success: true,
          model,
          duration,
        };
      } catch (error) {
        results[provider.type] = {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
    
    setProviderTestResults(results);
    setIsTestingProviders(false);
  };

  const providerLabels: Record<LLMProviderType, { name: string; icon: React.ReactNode }> = {
    gemini: { name: 'Google Gemini', icon: <Sparkles className="w-4 h-4" /> },
    openai: { name: 'OpenAI GPT', icon: <BrainCircuit className="w-4 h-4" /> },
    claude: { name: 'Anthropic Claude', icon: <Bot className="w-4 h-4" /> },
    glm: { name: 'Z.AI GLM-4.6', icon: <Sparkles className="w-4 h-4" /> },
  };

  return (
    <div className="min-h-screen p-6 md:p-8 pt-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
            Nanocoder
          </h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          Configure your AI-powered voice control system
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LLM Provider Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <BrainCircuit className="w-5 h-5 text-violet-500" />
            <h2 className="text-lg font-semibold">LLM Provider</h2>
          </div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Select which AI model powers Nanocoder
            </p>
            <Button
              onClick={handleTestAllProviders}
              disabled={isTestingProviders}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {isTestingProviders ? (
                <>
                  <Square className="w-3 h-3 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  Test All
                </>
              )}
            </Button>
          </div>

          <div className="space-y-2">
            {providers.map((provider) => (
              <button
                key={provider.type}
                onClick={() => setLLMProvider(provider.type)}
                className={`
                  w-full p-4 rounded-xl border-2 transition-all duration-200
                  flex items-center justify-between
                  ${state.config.llmProvider === provider.type
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    p-2 rounded-lg
                    ${state.config.llmProvider === provider.type
                      ? 'bg-violet-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }
                  `}>
                    {providerLabels[provider.type].icon}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-medium">{providerLabels[provider.type].name}</div>
                    <div className="text-xs text-slate-500">
                      {provider.configured ? 'Configured' : 'Not configured'}
                    </div>
                    {providerTestResults[provider.type] && (
                      <div className="text-xs mt-1">
                        {providerTestResults[provider.type].success ? (
                          <span className="text-green-600 dark:text-green-400">
                            ✅ {providerTestResults[provider.type].model} ({providerTestResults[provider.type].duration}ms)
                          </span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400">
                            ❌ {providerTestResults[provider.type].error}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {provider.configured ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-slate-100 dark:bg-slate-700/50 text-xs text-slate-600 dark:text-slate-400">
            <strong>Tip:</strong> API keys are configured via environment variables:
            <code className="block mt-1 text-violet-600 dark:text-violet-400">
              VITE_GEMINI_API_KEY, VITE_OPENAI_API_KEY, VITE_ANTHROPIC_API_KEY, VITE_GLM_API_KEY
            </code>
          </div>
        </motion.div>

        {/* Voice Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <Mic className="w-5 h-5 text-fuchsia-500" />
            <h2 className="text-lg font-semibold">Voice Settings</h2>
          </div>

          {/* Voice Input Toggle */}
          <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
            <div>
              <div className="font-medium">Voice Input</div>
              <div className="text-sm text-slate-500">Enable microphone for voice commands</div>
            </div>
            <button
              onClick={() => setVoiceEnabled(!state.config.voiceEnabled)}
              className={`
                p-2 rounded-lg transition-colors
                ${state.config.voiceEnabled
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                }
              `}
            >
              {state.config.voiceEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
          </div>

          {/* Continuous Listening Toggle */}
          <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
            <div>
              <div className="font-medium">Continuous Listening</div>
              <div className="text-sm text-slate-500">Keep listening after each command</div>
            </div>
            <button
              onClick={() => setContinuousListening(!state.config.continuousListening)}
              className={`
                px-3 py-1 rounded-lg text-sm font-medium transition-colors
                ${state.config.continuousListening
                  ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                }
              `}
            >
              {state.config.continuousListening ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* TTS Toggle */}
          <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
            <div>
              <div className="font-medium">Text-to-Speech</div>
              <div className="text-sm text-slate-500">Read responses aloud</div>
            </div>
            <button
              onClick={() => setTTSEnabled(!state.config.ttsEnabled)}
              className={`
                p-2 rounded-lg transition-colors
                ${state.config.ttsEnabled
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                }
              `}
            >
              {state.config.ttsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>

          {/* Speech Rate */}
          <div className="py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">Speech Rate</div>
              <div className="text-sm text-slate-500">{state.config.ttsRate.toFixed(1)}x</div>
            </div>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={state.config.ttsRate}
              onChange={(e) => setTTSRate(parseFloat(e.target.value))}
              className="w-full accent-violet-500"
            />
          </div>

          {/* Browser Support Info */}
          <div className="mt-4 p-3 rounded-lg bg-slate-100 dark:bg-slate-700/50 text-xs text-slate-600 dark:text-slate-400">
            {VoiceController.isSupported() ? (
              <span className="text-emerald-600 dark:text-emerald-400">
                ✓ Speech recognition supported in this browser
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400">
                ⚠ Speech recognition not supported. Use Chrome or Edge for best experience.
              </span>
            )}
          </div>
        </motion.div>

        {/* Test Console */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 p-6 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <Terminal className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-semibold">Test Console</h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Try out Nanocoder commands before using them in the app
          </p>

          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTestCommand()}
              placeholder="Try: 'Go to the dashboard' or 'Create a task called Fix bug'"
              className="flex-1 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 border-none focus:ring-2 focus:ring-violet-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
            <Button
              onClick={handleTestCommand}
              disabled={isTesting || !testInput.trim()}
              className="px-6"
            >
              {isTesting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>
          </div>

          {/* Quick Commands */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              'Go to dashboard',
              'Switch to dark mode',
              'Create a task: Review PR',
              'Show my tasks',
              'Toggle sidebar',
              'Change to ITSM workflow',
            ].map((cmd) => (
              <button
                key={cmd}
                onClick={() => setTestInput(cmd)}
                className="px-3 py-1.5 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-600 transition-colors"
              >
                {cmd}
              </button>
            ))}
          </div>

          {/* Response Area */}
          <AnimatePresence mode="wait">
            {testResponse && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-xl bg-slate-900 dark:bg-slate-950 text-slate-100 font-mono text-sm whitespace-pre-wrap"
              >
                {testResponse}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Command History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 p-6 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-500" />
              <h2 className="text-lg font-semibold">Command History</h2>
            </div>
            <span className="text-sm text-slate-500">
              {state.commandHistory.length} commands
            </span>
          </div>

          {state.commandHistory.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No commands yet. Try the test console above!</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {state.commandHistory.slice(0, 10).map((entry) => (
                <div
                  key={entry.id}
                  className={`
                    p-3 rounded-lg border
                    ${entry.success
                      ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                    }
                  `}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {entry.input}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                    {entry.response}
                  </p>
                  {entry.toolsCalled && entry.toolsCalled.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {entry.toolsCalled.map((tool, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-xs rounded bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Nanocoder Status Indicator */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-6 right-6 p-4 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-2xl"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Zap className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
          </div>
          <div>
            <div className="text-sm font-semibold">Nanocoder Active</div>
            <div className="text-xs opacity-80">
              {state.config.llmProvider.charAt(0).toUpperCase() + state.config.llmProvider.slice(1)} • 
              Press ⌘K for terminal
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

