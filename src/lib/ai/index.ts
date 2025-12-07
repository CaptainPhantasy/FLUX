// =====================================
// FLUX - AI Layer Index
// =====================================

export * from './tools';
export * from './gemini';

// Re-export terminal function for convenience
export { sendTerminalMessage, processCommand, isGeminiConfigured } from './gemini';
