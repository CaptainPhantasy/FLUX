// =====================================
// FLUX - Nanocoder Action Dispatcher
// =====================================
// Dispatches typed events for the NanocoderBridge to handle

import type { NanocoderAction, NanocoderActionType, NanocoderActionPayloads } from './types';

/** Custom event name for Nanocoder actions */
export const NANOCODER_EVENT = 'nanocoder-action';

/**
 * Dispatch a Nanocoder action as a custom DOM event
 * The NanocoderBridge component listens for these events and executes them
 */
export function dispatchNanocoderAction<T extends NanocoderActionType>(
  type: T,
  payload: NanocoderActionPayloads[T],
  source: NanocoderAction['source'] = 'internal'
): void {
  const action = {
    type,
    payload,
    timestamp: Date.now(),
    source,
  } as NanocoderAction;

  const event = new CustomEvent(NANOCODER_EVENT, {
    detail: action,
    bubbles: true,
    cancelable: true,
  });

  window.dispatchEvent(event);
  
  // Debug logging in development
  if (import.meta.env.DEV) {
    console.log('[Nanocoder] Dispatched:', type, payload);
  }
}

/**
 * Subscribe to Nanocoder actions
 * Returns an unsubscribe function
 */
export function subscribeToNanocoderActions(
  callback: (action: NanocoderAction) => void
): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<NanocoderAction>;
    callback(customEvent.detail);
  };

  window.addEventListener(NANOCODER_EVENT, handler);
  
  return () => {
    window.removeEventListener(NANOCODER_EVENT, handler);
  };
}

// ==================
// Convenience dispatchers
// ==================

export const navigate = (path: string, replace = false) =>
  dispatchNanocoderAction('navigate', { path, replace });

export const goBack = () =>
  dispatchNanocoderAction('go_back', {});

export const openTerminal = () =>
  dispatchNanocoderAction('open_terminal', {});

export const closeTerminal = () =>
  dispatchNanocoderAction('close_terminal', {});

export const setTheme = (theme: 'light' | 'dark' | 'system') =>
  dispatchNanocoderAction('set_theme', { theme });

export const toggleSidebar = () =>
  dispatchNanocoderAction('toggle_sidebar', {});

export const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') =>
  dispatchNanocoderAction('show_toast', { message, type });

export const moveTask = (taskId: string, toColumn: string, toIndex?: number) =>
  dispatchNanocoderAction('move_task', { taskId, toColumn, toIndex });

export const changeWorkflow = (workflow: 'agile' | 'ccaas' | 'itsm') =>
  dispatchNanocoderAction('change_workflow', { workflow });

export const highlightTask = (taskId: string, duration = 2000) =>
  dispatchNanocoderAction('highlight_task', { taskId, duration });

export const speak = (text: string, priority: 'high' | 'normal' | 'low' = 'normal') =>
  dispatchNanocoderAction('speak', { text, priority });

export const stopSpeaking = () =>
  dispatchNanocoderAction('stop_speaking', {});

