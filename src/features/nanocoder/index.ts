// =====================================
// FLUX - Nanocoder Module
// =====================================
// AI-driven "nervous system" for natural language control of FLUX

// Core components
export { NanocoderBridge } from './NanocoderBridge';
export { NanocoderProvider, useNanocoder } from './NanocoderContext';
export { VoiceControlWidget } from './VoiceControlWidget';

// Event dispatcher (excluding speak/stopSpeaking to avoid conflict with voice)
export {
  NANOCODER_EVENT,
  dispatchNanocoderAction,
  subscribeToNanocoderActions,
  navigate,
  goBack,
  openTerminal,
  closeTerminal,
  setTheme,
  toggleSidebar,
  showToast,
  moveTask,
  changeWorkflow,
  highlightTask,
} from './dispatcher';

// Types
export * from './types';

// LLM providers
export * from './llm';

// Voice services (speak/stopSpeaking come from here)
export * from './voice';

// API client
export { FluxAPIClient, getAPIClient } from './api-client';

