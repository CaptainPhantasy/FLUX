// =====================================
// FLUX - LLM Provider Factory
// =====================================

import type { LLMProvider, LLMProviderConfig } from './types';
import type { LLMProviderType } from '../types';
import { GeminiProvider, getGeminiProvider } from './gemini';
import { OpenAIProvider, getOpenAIProvider } from './openai';
import { ClaudeProvider, getClaudeProvider } from './claude';
import { GLMProvider, getGLMProvider } from './glm';

export * from './types';

/**
 * Get an LLM provider instance by name
 */
export function getLLMProvider(providerType: LLMProviderType): LLMProvider {
  switch (providerType) {
    case 'gemini':
      return getGeminiProvider();
    case 'openai':
      return getOpenAIProvider();
    case 'claude':
      return getClaudeProvider();
    case 'glm':
      return getGLMProvider();
    default:
      throw new Error(`Unknown LLM provider: ${providerType}`);
  }
}

/**
 * Get all available LLM providers
 */
export function getAvailableProviders(): { type: LLMProviderType; configured: boolean }[] {
  return [
    { type: 'gemini', configured: getGeminiProvider().isConfigured() },
    { type: 'openai', configured: getOpenAIProvider().isConfigured() },
    { type: 'claude', configured: getClaudeProvider().isConfigured() },
    { type: 'glm', configured: getGLMProvider().isConfigured() },
  ];
}

/**
 * Get the first configured provider, or null if none
 */
export function getDefaultProvider(): LLMProvider | null {
  const providers = getAvailableProviders();
  const configured = providers.find(p => p.configured);
  
  if (configured) {
    return getLLMProvider(configured.type);
  }
  
  return null;
}

/**
 * Configure an LLM provider
 */
export function configureLLMProvider(
  providerType: LLMProviderType,
  config: Partial<LLMProviderConfig>
): void {
  const provider = getLLMProvider(providerType);
  provider.configure(config);
}

// Re-export provider classes for direct instantiation if needed
export { GeminiProvider, OpenAIProvider, ClaudeProvider, GLMProvider };

