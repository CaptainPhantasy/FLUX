// @ts-nocheck
// =====================================
// FLUX - OpenAI LLM Provider
// =====================================

import OpenAI from 'openai';
import { executeTool } from '@/lib/ai/tools';
import { dispatchNanocoderAction } from '../dispatcher';
import { buildAgentContext, buildEnhancedSystemPrompt } from './context';
import { logAgentAction, verifyTaskAction } from './actionLogger';
import type { 
  LLMProvider, 
  LLMProviderConfig, 
  LLMToolDefinition, 
  ChatMessage, 
  ChatResult 
} from './types';
import { toOpenAITool } from './types';
import { PAGE_ROUTES, type PageName } from '../types';

// Updated December 7, 2025
// Latest models: GPT-5.1 (Nov 2025), GPT-5 (Aug 2025), GPT-4.5 (Feb 2025)
// API model names may differ - check https://platform.openai.com/docs/models for latest
const DEFAULT_MODEL = 'gpt-4o-mini'; // Fallback to stable model
// Recommended: 'gpt-5.1' or 'gpt-5' (if available via API)
// Alternative: 'gpt-4o-2025-12-07' or 'gpt-4o' for latest GPT-4o variant

export class OpenAIProvider implements LLMProvider {
  readonly name = 'openai';
  
  private client: OpenAI | null = null;
  private modelName: string = DEFAULT_MODEL;
  private config: LLMProviderConfig = {};

  constructor(apiKey?: string) {
    if (apiKey) {
      this.configure({ apiKey });
    } else {
      // Try to get from env
      const envKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (envKey) {
        this.configure({ apiKey: envKey });
      }
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  configure(config: Partial<LLMProviderConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (config.apiKey) {
      this.client = new OpenAI({ 
        apiKey: config.apiKey,
        dangerouslyAllowBrowser: true, // Required for client-side usage
      });
    }
    
    // Model selection: Use provided model or default
    // Latest models (Dec 2025): gpt-5.1, gpt-5, gpt-4o-2025-12-07
    // See MODEL_REFERENCE.md for latest model names
    if (config.model) {
      this.modelName = config.model;
    } else {
      // Try to use latest available model, fallback to stable default
      // In production, you may want to check API for available models
      this.modelName = DEFAULT_MODEL;
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
    if (!this.client) {
      throw new Error('OpenAI API key not configured');
    }

    const toolsCalled: string[] = [];
    
    // Build enhanced context-aware system prompt (with error handling)
    let systemPrompt: string;
    try {
      const context = buildAgentContext();
      systemPrompt = buildEnhancedSystemPrompt(context);
    } catch (error) {
      console.error('[OpenAI] Error building context, using fallback prompt:', error);
      // Fallback to basic prompt if context building fails
      systemPrompt = `You are Nanocoder, an AI assistant for FLUX project management platform.
You can navigate pages, create tasks, update task statuses, switch themes, and control the UI.
When the user asks you to do something, use the appropriate tool to execute the action.
Be helpful and execute actions immediately.`;
    }
    
    // Build messages
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...(history?.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })) || []),
      { role: 'user', content: message },
    ];

    // Convert tools to OpenAI format
    const openaiTools = tools?.map(toOpenAITool);

    // Initial request
    let response = await this.client.chat.completions.create({
      model: this.modelName,
      messages,
      tools: openaiTools,
      tool_choice: openaiTools ? 'auto' : undefined,
      max_tokens: this.config.maxTokens || 1024,
      temperature: this.config.temperature || 0.7,
    });

    let assistantMessage = response.choices[0].message;
    let responseText = assistantMessage.content || '';

    // Process tool calls
    let iterations = 0;
    const MAX_ITERATIONS = 5;

    while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0 && iterations < MAX_ITERATIONS) {
      // Execute tool calls
      const toolResults: OpenAI.ChatCompletionToolMessageParam[] = [];

      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        
        toolsCalled.push(functionName);
        console.log('[OpenAI] Executing tool:', functionName, functionArgs);

        let result: { success: boolean; message: string; data?: unknown };

        // Handle navigation specially
        if (functionName === 'navigate_to_page') {
          const pageName = functionArgs.page as PageName;
          const path = PAGE_ROUTES[pageName] || `/app/${pageName}`;
          dispatchNanocoderAction('navigate', { path }, 'internal');
          result = { success: true, message: `Navigated to ${pageName}` };
        } else if (functionName === 'go_back') {
          dispatchNanocoderAction('go_back', {}, 'internal');
          result = { success: true, message: 'Navigated back' };
        } else if (functionName === 'open_terminal') {
          dispatchNanocoderAction('open_terminal', {}, 'internal');
          result = { success: true, message: 'Terminal opened' };
        } else if (functionName === 'close_terminal') {
          dispatchNanocoderAction('close_terminal', {}, 'internal');
          result = { success: true, message: 'Terminal closed' };
        } else if (functionName === 'change_workflow_mode') {
          dispatchNanocoderAction('change_workflow', { 
            workflow: functionArgs.workflow 
          }, 'internal');
          result = { success: true, message: `Switched to ${functionArgs.workflow} workflow` };
        } else {
          // Execute other tools via the tool registry
          result = await executeTool({
            function: functionName,
            arguments: functionArgs,
          });
        }
        
        // Log the action for tracking and verification
        logAgentAction(functionName, functionArgs, result);
        
        // For critical actions, verify the result
        if ((functionName === 'create_task' || functionName === 'update_task_status') && result.success) {
          const verification = await verifyTaskAction(
            functionName === 'create_task' ? 'create' : 'update',
            {
              taskId: result.data?.taskId || result.data?.id,
              title: functionArgs.title,
              status: functionArgs.status || functionArgs.new_status,
            }
          );
          if (!verification.verified) {
            console.warn('[OpenAI] Action verification failed:', verification.message);
            result.message += ` (Note: ${verification.message})`;
          }
        }

        // Format tool result for better LLM understanding
        let toolResultContent: string;
        if (result.success) {
          toolResultContent = `Success: ${result.message}`;
        } else {
          toolResultContent = `Error: ${result.message}`;
        }
        if (result.data) {
          toolResultContent += `\nData: ${JSON.stringify(result.data)}`;
        }
        
        toolResults.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: toolResultContent,
        });
      }

      // Send tool results back
      messages.push(assistantMessage);
      messages.push(...toolResults);

      response = await this.client.chat.completions.create({
        model: this.modelName,
        messages,
        tools: openaiTools,
        tool_choice: 'auto',
        max_tokens: this.config.maxTokens || 1024,
        temperature: this.config.temperature || 0.7,
      });

      assistantMessage = response.choices[0].message;
      responseText = assistantMessage.content || responseText;
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
let instance: OpenAIProvider | null = null;

export function getOpenAIProvider(): OpenAIProvider {
  if (!instance) {
    instance = new OpenAIProvider();
  }
  return instance;
}

export default OpenAIProvider;

