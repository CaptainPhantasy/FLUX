// @ts-nocheck
// =====================================
// FLUX - Gemini LLM Provider
// =====================================

import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';
import { executeTool } from '@/lib/ai/tools';
import { dispatchNanocoderAction } from '../dispatcher';
import { buildAgentContext, buildEnhancedSystemPrompt } from './context';
import { logAgentAction, verifyTaskAction } from './actionLogger';
import type { 
  LLMProvider, 
  LLMProviderConfig, 
  LLMToolDefinition, 
  ChatMessage, 
  ChatResult,
  LLMToolCall 
} from './types';
import { toGeminiTool } from './types';
import { PAGE_ROUTES, type PageName } from '../types';

// Updated December 7, 2025
// Latest models: Gemini 3 (late 2025), Gemini 2.0 series
// API model names follow pattern: gemini-{version}-{variant}
// Check https://ai.google.dev/models/gemini for latest
const DEFAULT_MODEL = 'gemini-1.5-flash-latest'; // Use -latest suffix for v1beta compatibility
// Alternative models: 'gemini-1.5-pro-latest', 'gemini-2.0-flash-exp', 'gemini-3-flash'

export class GeminiProvider implements LLMProvider {
  readonly name = 'gemini';
  
  private client: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private modelName: string = DEFAULT_MODEL;
  private config: LLMProviderConfig = {};

  constructor(apiKey?: string) {
    if (apiKey) {
      this.configure({ apiKey });
    } else {
      // Try to get from env
      const envKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (envKey) {
        this.configure({ apiKey: envKey });
      }
    }
  }

  isConfigured(): boolean {
    return this.client !== null && this.model !== null;
  }

  configure(config: Partial<LLMProviderConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (config.apiKey) {
      this.client = new GoogleGenerativeAI(config.apiKey);
      // Model selection: Use provided model or default
      // Latest models (Dec 2025): gemini-3, gemini-2.0-flash-exp, gemini-2.0-pro-exp
      // See MODEL_REFERENCE.md for latest model names
      this.modelName = config.model || DEFAULT_MODEL;
      this.model = this.client.getGenerativeModel({ model: this.modelName });
    }
    
    if (config.model && this.client) {
      // Update model if client already exists
      this.modelName = config.model;
      this.model = this.client.getGenerativeModel({ model: this.modelName });
    }
  }

  getModel(): string {
    return this.modelName;
  }

  async chat(
    message: string,
    tools?: LLMToolDefinition[],
    history?: ChatMessage[]
  ): Promise<ChatResult> {
    if (!this.model) {
      throw new Error('Gemini API key not configured');
    }

    const toolsCalled: string[] = [];
    
    // Build enhanced context-aware system prompt (with error handling)
    let systemPrompt: string;
    try {
      const context = buildAgentContext();
      systemPrompt = buildEnhancedSystemPrompt(context);
    } catch (error) {
      console.error('[Gemini] Error building context, using fallback prompt:', error);
      // Fallback to basic prompt if context building fails
      systemPrompt = `You are Nanocoder, an AI assistant for FLUX project management platform.
You can navigate pages, create tasks, update task statuses, switch themes, and control the UI.
When the user asks you to do something, use the appropriate tool to execute the action.
Be helpful and execute actions immediately.`;
    }
    
    // Build chat history
    const chatHistory = history?.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    })) || [];

    // Start chat with enhanced system prompt and tools
    const chat = this.model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }],
        },
        {
          role: 'model',
          parts: [{ text: 'I understand. I am Nanocoder, ready to help you navigate and control FLUX. What would you like me to do?' }],
        },
        ...chatHistory,
      ],
      tools: tools ? [{ functionDeclarations: tools.map(toGeminiTool) }] : undefined,
    });

    // Send message
    let result = await chat.sendMessage(message);
    let response = result.response;
    let responseText = '';

    // Process function calls in a loop
    let iterations = 0;
    const MAX_ITERATIONS = 5;

    while (iterations < MAX_ITERATIONS) {
      const candidate = response.candidates?.[0];
      if (!candidate) break;

      const parts = candidate.content?.parts || [];
      
      // Check for function calls
      const functionCalls = parts.filter(p => 'functionCall' in p);
      
      if (functionCalls.length === 0) {
        // No function calls, get text response
        responseText = parts
          .filter(p => 'text' in p)
          .map(p => (p as { text: string }).text)
          .join('');
        break;
      }

      // Execute function calls
      const functionResults: { functionResponse: { name: string; response: unknown } }[] = [];
      
      for (const part of functionCalls) {
        const fc = (part as { functionCall: { name: string; args: Record<string, unknown> } }).functionCall;
        toolsCalled.push(fc.name);
        
        console.log('[Gemini] Executing tool:', fc.name, fc.args);
        
        // Handle navigation specially - dispatch event
        if (fc.name === 'navigate_to_page') {
          const pageName = fc.args.page as PageName;
          const path = PAGE_ROUTES[pageName] || `/app/${pageName}`;
          dispatchNanocoderAction('navigate', { path }, 'internal');
          functionResults.push({
            functionResponse: {
              name: fc.name,
              response: { success: true, message: `Navigated to ${pageName}` },
            },
          });
        } else if (fc.name === 'go_back') {
          dispatchNanocoderAction('go_back', {}, 'internal');
          functionResults.push({
            functionResponse: {
              name: fc.name,
              response: { success: true, message: 'Navigated back' },
            },
          });
        } else if (fc.name === 'open_terminal') {
          dispatchNanocoderAction('open_terminal', {}, 'internal');
          functionResults.push({
            functionResponse: {
              name: fc.name,
              response: { success: true, message: 'Terminal opened' },
            },
          });
        } else if (fc.name === 'close_terminal') {
          dispatchNanocoderAction('close_terminal', {}, 'internal');
          functionResults.push({
            functionResponse: {
              name: fc.name,
              response: { success: true, message: 'Terminal closed' },
            },
          });
        } else if (fc.name === 'change_workflow_mode') {
          const { workflow } = fc.args as { workflow: 'agile' | 'ccaas' | 'itsm' };
          dispatchNanocoderAction('change_workflow', { workflow }, 'internal');
          functionResults.push({
            functionResponse: {
              name: fc.name,
              response: { success: true, message: `Switched to ${workflow} workflow` },
            },
          });
        } else {
          // Execute other tools via the tool registry
          const toolResult = await executeTool({
            function: fc.name,
            arguments: fc.args,
          });
          
          // Log the action for tracking and verification
          logAgentAction(fc.name, fc.args, toolResult);
          
          // For critical actions, verify the result
          if ((fc.name === 'create_task' || fc.name === 'update_task_status') && toolResult.success) {
            const verification = await verifyTaskAction(
              fc.name === 'create_task' ? 'create' : 'update',
              {
                taskId: toolResult.data?.taskId || toolResult.data?.id,
                title: fc.args.title as string,
                status: (fc.args.status || fc.args.new_status) as string,
              }
            );
            if (!verification.verified) {
              console.warn('[Gemini] Action verification failed:', verification.message);
              toolResult.message += ` (Note: ${verification.message})`;
            }
          }
          
          functionResults.push({
            functionResponse: {
              name: fc.name,
              response: toolResult,
            },
          });
        }
      }

      // Send function results back to model
      result = await chat.sendMessage(functionResults);
      response = result.response;
      iterations++;
    }

    // If no response text but tools were called, summarize results
    if (!responseText && toolsCalled.length > 0) {
      responseText = `Executed ${toolsCalled.length} action(s). Please check the tool results above for details.`;
    }
    
    return {
      response: responseText || 'I processed your request. If you expected a specific action, please check if it completed successfully.',
      toolsCalled,
      rawResponse: response,
    };
  }
}

// Singleton instance
let instance: GeminiProvider | null = null;

export function getGeminiProvider(): GeminiProvider {
  if (!instance) {
    instance = new GeminiProvider();
  }
  return instance;
}

export default GeminiProvider;

