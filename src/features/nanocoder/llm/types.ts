// =====================================
// FLUX - LLM Provider Types
// =====================================
// Common interface for all LLM providers (Gemini, OpenAI, Claude)

import type { ToolDefinition } from '@/lib/ai/tools';

/** Tool parameter schema */
export interface ToolParameterSchema {
  type: 'object';
  properties: Record<string, {
    type: string;
    description: string;
    enum?: string[];
  }>;
  required?: string[];
}

/** Tool definition for LLM */
export interface LLMToolDefinition {
  name: string;
  description: string;
  parameters: ToolParameterSchema;
}

/** Tool call from LLM response */
export interface LLMToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

/** Chat message */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: LLMToolCall[];
  toolCallId?: string;
}

/** Chat result from LLM */
export interface ChatResult {
  response: string;
  toolsCalled: string[];
  rawResponse?: unknown;
}

/** LLM Provider configuration */
export interface LLMProviderConfig {
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

/**
 * LLM Provider Interface
 * All LLM providers must implement this interface
 */
export interface LLMProvider {
  /** Provider name */
  readonly name: string;
  
  /** Check if the provider is configured (has API key) */
  isConfigured(): boolean;
  
  /** Send a chat message and get a response */
  chat(
    message: string,
    tools?: LLMToolDefinition[],
    history?: ChatMessage[]
  ): Promise<ChatResult>;
  
  /** Get the current model being used */
  getModel(): string;
  
  /** Set configuration options */
  configure(config: Partial<LLMProviderConfig>): void;
}

/** System prompt for Nanocoder */
export const NANOCODER_SYSTEM_PROMPT = `You are Nanocoder, an AI assistant integrated into FLUX - an AI-native project management platform. 

Your capabilities:
- Navigate the application (dashboard, board, sprints, inbox, etc.)
- Create and manage tasks
- Update task statuses and priorities
- Switch themes (light/dark)
- Control the UI (toggle sidebar, open terminal)
- Manage notifications
- Switch workflow modes (Agile, CCaaS, ITSM)

When the user asks you to do something:
1. Use the appropriate tool to execute the action
2. Provide brief, helpful feedback about what you did
3. Be conversational but concise

Available pages: dashboard, board, sprints, inbox, documents, assets, analytics, service-desk, automation, integrations, import, ai, appearance, settings

Task statuses: todo, in-progress, review, done, archived
Task priorities: low, medium, high, urgent
Themes: light, dark, system
Workflows: agile, ccaas, itsm

Always execute actions immediately when requested. Don't ask for confirmation unless truly necessary.`;

/** Convert tool definition to Gemini format */
export function toGeminiTool(tool: LLMToolDefinition) {
  return {
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  };
}

/** Convert tool definition to OpenAI format */
export function toOpenAITool(tool: LLMToolDefinition) {
  return {
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  };
}

/** Convert tool definition to Claude format */
export function toClaudeTool(tool: LLMToolDefinition) {
  return {
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters,
  };
}

