// =====================================
// FLUX - Nanocoder Context & Provider
// =====================================
// Provides Nanocoder state and actions to the entire application

import React, { createContext, useContext, useReducer, useCallback, useEffect, useMemo } from 'react';
import type { 
  NanocoderState, 
  NanocoderConfig, 
  CommandHistoryEntry,
  LLMProviderType,
  VoiceState 
} from './types';
import { getLLMProvider, getAvailableProviders } from './llm';
import { getToolDefinitions } from '@/lib/ai/tools';
import { useFluxStore } from '@/lib/store';

// ==================
// Initial State
// ==================

// Auto-detect first configured provider
function getDefaultProvider(): LLMProviderType {
  const providers = getAvailableProviders();
  const configured = providers.find(p => p.configured);
  return configured?.type || 'openai'; // Default to openai if none configured
}

const defaultConfig: NanocoderConfig = {
  llmProvider: getDefaultProvider(),
  voiceEnabled: true,
  continuousListening: true, // Default to continuous mode
  wakeWord: null,
  ttsEnabled: true,
  ttsVoice: null,
  ttsRate: 1.0,
};

const defaultVoiceState: VoiceState = {
  isListening: false,
  isContinuousMode: false,
  wakeWord: null,
  lastTranscript: '',
  audioLevel: 0,
};

const initialState: NanocoderState = {
  isInitialized: false,
  isProcessing: false,
  config: defaultConfig,
  voice: defaultVoiceState,
  commandHistory: [],
  lastError: null,
};

// ==================
// Actions
// ==================

type NanocoderReducerAction =
  | { type: 'INITIALIZE' }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_CONFIG'; payload: Partial<NanocoderConfig> }
  | { type: 'SET_VOICE_STATE'; payload: Partial<VoiceState> }
  | { type: 'ADD_COMMAND'; payload: CommandHistoryEntry }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'SET_ERROR'; payload: string | null };

function nanocoderReducer(state: NanocoderState, action: NanocoderReducerAction): NanocoderState {
  switch (action.type) {
    case 'INITIALIZE':
      return { ...state, isInitialized: true };
    
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };
    
    case 'SET_CONFIG':
      return { 
        ...state, 
        config: { ...state.config, ...action.payload } 
      };
    
    case 'SET_VOICE_STATE':
      return { 
        ...state, 
        voice: { ...state.voice, ...action.payload } 
      };
    
    case 'ADD_COMMAND':
      return {
        ...state,
        commandHistory: [action.payload, ...state.commandHistory].slice(0, 100),
      };
    
    case 'CLEAR_HISTORY':
      return { ...state, commandHistory: [] };
    
    case 'SET_ERROR':
      return { ...state, lastError: action.payload };
    
    default:
      return state;
  }
}

// ==================
// Context
// ==================

interface NanocoderContextValue {
  state: NanocoderState;
  // Config
  setLLMProvider: (provider: LLMProviderType) => void;
  setVoiceEnabled: (enabled: boolean) => void;
  setContinuousListening: (enabled: boolean) => void;
  setWakeWord: (word: string | null) => void;
  setTTSEnabled: (enabled: boolean) => void;
  setTTSVoice: (voice: string | null) => void;
  setTTSRate: (rate: number) => void;
  // Voice
  startListening: () => void;
  stopListening: () => void;
  // Processing
  processCommand: (input: string, source?: 'voice' | 'terminal') => Promise<string>;
  // History
  clearHistory: () => void;
}

const NanocoderContext = createContext<NanocoderContextValue | null>(null);

// ==================
// Provider
// ==================

interface NanocoderProviderProps {
  children: React.ReactNode;
}

export function NanocoderProvider({ children }: NanocoderProviderProps) {
  const [state, dispatch] = useReducer(nanocoderReducer, initialState);

  // Initialize on mount
  useEffect(() => {
    // Load config from localStorage
    const savedConfig = localStorage.getItem('nanocoder-config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        dispatch({ type: 'SET_CONFIG', payload: parsed });
      } catch (e) {
        console.warn('[Nanocoder] Failed to load config:', e);
      }
    }
    dispatch({ type: 'INITIALIZE' });
  }, []);

  // Save config changes to localStorage
  useEffect(() => {
    if (state.isInitialized) {
      localStorage.setItem('nanocoder-config', JSON.stringify(state.config));
    }
  }, [state.config, state.isInitialized]);

  // Config setters
  const setLLMProvider = useCallback((provider: LLMProviderType) => {
    dispatch({ type: 'SET_CONFIG', payload: { llmProvider: provider } });
  }, []);

  const setVoiceEnabled = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_CONFIG', payload: { voiceEnabled: enabled } });
  }, []);

  const setContinuousListening = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_CONFIG', payload: { continuousListening: enabled } });
  }, []);

  const setWakeWord = useCallback((word: string | null) => {
    dispatch({ type: 'SET_CONFIG', payload: { wakeWord: word } });
  }, []);

  const setTTSEnabled = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_CONFIG', payload: { ttsEnabled: enabled } });
  }, []);

  const setTTSVoice = useCallback((voice: string | null) => {
    dispatch({ type: 'SET_CONFIG', payload: { ttsVoice: voice } });
  }, []);

  const setTTSRate = useCallback((rate: number) => {
    dispatch({ type: 'SET_CONFIG', payload: { ttsRate: Math.max(0.5, Math.min(2.0, rate)) } });
  }, []);

  // Voice controls
  const startListening = useCallback(() => {
    dispatch({ type: 'SET_VOICE_STATE', payload: { isListening: true } });
  }, []);

  const stopListening = useCallback(() => {
    dispatch({ type: 'SET_VOICE_STATE', payload: { isListening: false } });
  }, []);

  // Process a command through the LLM
  const processCommand = useCallback(async (
    input: string,
    source: 'voice' | 'terminal' = 'terminal'
  ): Promise<string> => {
    dispatch({ type: 'SET_PROCESSING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    const startTime = Date.now();
    const historyEntry: CommandHistoryEntry = {
      id: crypto.randomUUID(),
      input,
      response: '',
      timestamp: startTime,
      success: false,
      toolsCalled: [],
    };

    try {
      // Get the LLM provider
      const provider = getLLMProvider(state.config.llmProvider);
      
      // Get current workflow mode for context-aware tools
      const workflowMode = useFluxStore.getState().workflowMode || 'agile';
      
      // Get available tools with workflow context
      const tools = getToolDefinitions(workflowMode);

      // Build conversation history from recent commands (last 5)
      const recentHistory = state.commandHistory
        .slice(0, 5)
        .map(entry => [
          { role: 'user' as const, content: entry.input },
          { role: 'assistant' as const, content: entry.response },
        ])
        .flat();

      // Process through LLM with conversation history
      const result = await provider.chat(input, tools, recentHistory);

      historyEntry.response = result.response;
      historyEntry.success = true;
      historyEntry.toolsCalled = result.toolsCalled;

      dispatch({ type: 'ADD_COMMAND', payload: historyEntry });
      dispatch({ type: 'SET_PROCESSING', payload: false });

      return result.response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      historyEntry.response = `Error: ${errorMessage}`;
      historyEntry.success = false;

      dispatch({ type: 'ADD_COMMAND', payload: historyEntry });
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      dispatch({ type: 'SET_PROCESSING', payload: false });

      // User-friendly error messages
      let userMessage = errorMessage;
      if (errorMessage.includes('API key')) {
        userMessage = 'LLM provider API key is not configured. Please check your settings.';
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        userMessage = 'Network error. Please check your internet connection and try again.';
      } else if (errorMessage.includes('rate limit')) {
        userMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      }

      return `I encountered an error: ${userMessage}`;
    }
  }, [state.config.llmProvider, state.commandHistory]);

  // Clear history
  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR_HISTORY' });
  }, []);

  const value = useMemo<NanocoderContextValue>(() => ({
    state,
    setLLMProvider,
    setVoiceEnabled,
    setContinuousListening,
    setWakeWord,
    setTTSEnabled,
    setTTSVoice,
    setTTSRate,
    startListening,
    stopListening,
    processCommand,
    clearHistory,
  }), [
    state,
    setLLMProvider,
    setVoiceEnabled,
    setContinuousListening,
    setWakeWord,
    setTTSEnabled,
    setTTSVoice,
    setTTSRate,
    startListening,
    stopListening,
    processCommand,
    clearHistory,
  ]);

  return (
    <NanocoderContext.Provider value={value}>
      {children}
    </NanocoderContext.Provider>
  );
}

// ==================
// Hook
// ==================

export function useNanocoder(): NanocoderContextValue {
  const context = useContext(NanocoderContext);
  if (!context) {
    throw new Error('useNanocoder must be used within a NanocoderProvider');
  }
  return context;
}

export default NanocoderContext;

