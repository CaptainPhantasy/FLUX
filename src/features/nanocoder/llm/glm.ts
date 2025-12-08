// @ts-nocheck
// =====================================
// FLUX - GLM (Z.AI) LLM Provider
// =====================================
// Z.AI GLM-4.6 uses Anthropic-compatible API endpoint
// Documentation: https://docs.z.ai/scenario-example/develop-tools/claude

import Anthropic from '@anthropic-ai/sdk';
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
import { toClaudeTool } from './types';
import { PAGE_ROUTES, type PageName } from '../types';

// Updated December 7, 2025
// Z.AI GLM-4.6 - Most capable model, 200K context, superior coding performance
// 
// API Endpoint Structure:
// - Base URL: https://api.z.ai/api/anthropic
// - Full endpoint: https://api.z.ai/api/anthropic/v1/messages (auto-appended by Anthropic SDK)
// - Uses Anthropic-compatible API format
// 
// Documentation:
// - API Guide: https://docs.z.ai/guides/llm/glm-4.6
// - Claude Code Integration: https://docs.z.ai/scenario-example/develop-tools/claude
//
// Model Names:
// - glm-4.6 (default, most capable, 200K context)
// - glm-4.5-air (faster, cost-effective for simpler tasks)
// - Other models for image/video generation (see Z.AI docs)
const DEFAULT_MODEL = 'glm-4.6';

const GLM_BASE_URL = 'https://api.z.ai/api/anthropic';

// Singleton instance
let glmProviderInstance: GLMProvider | null = null;

export class GLMProvider implements LLMProvider {
  readonly name = 'glm';
  
  private client: Anthropic | null = null;
  private modelName: string = DEFAULT_MODEL;
  private config: LLMProviderConfig = {};

  constructor(apiKey?: string) {
    if (apiKey) {
      this.configure({ apiKey });
    } else {
      // Try to get from env
      const envKey = import.meta.env.VITE_GLM_API_KEY;
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
      // Z.AI uses Anthropic-compatible endpoint
      // Endpoint: https://api.z.ai/api/anthropic
      // The Anthropic SDK will automatically append /v1/messages to this baseURL
      // Documentation: https://docs.z.ai/scenario-example/develop-tools/claude
      this.client = new Anthropic({ 
        apiKey: config.apiKey,
        baseURL: GLM_BASE_URL, // https://api.z.ai/api/anthropic
        dangerouslyAllowBrowser: true, // Required for client-side usage
      });
    }
    
    // Model selection: Use provided model or default
    // GLM-4.6 is the most capable model with 200K context window
    // See MODEL_REFERENCE.md for latest model names
    if (config.model) {
      this.modelName = config.model;
    } else {
      // Default to GLM-4.6 (most capable)
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
      throw new Error('GLM API key not configured');
    }

    const toolsCalled: string[] = [];
    
    // Build enhanced context-aware system prompt (with error handling)
    let systemPrompt: string;
    try {
      const context = buildAgentContext();
      systemPrompt = buildEnhancedSystemPrompt(context);
    } catch (error) {
      console.error('[GLM] Error building context, using fallback prompt:', error);
      // Fallback to basic prompt if context building fails
      systemPrompt = `You are Nanocoder, an AI assistant for FLUX project management platform.
You can navigate pages, create tasks, update task statuses, switch themes, and control the UI.
When the user asks you to do something, use the appropriate tool to execute the action.
Be helpful and execute actions immediately.`;
    }
    
    // Build messages
    const messages: Anthropic.MessageParam[] = [
      ...(history?.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })) || []),
      { role: 'user', content: message },
    ];

    // Convert tools to Claude format (GLM uses same format)
    const claudeTools = tools?.map(toClaudeTool) as Anthropic.Tool[] | undefined;

    // Initial request with enhanced system prompt
    // API call structure matches Anthropic Messages API:
    // POST https://api.z.ai/api/anthropic/v1/messages
    // Model: glm-4.6 (or glm-4.5-air)
    // See: https://docs.z.ai/guides/llm/glm-4.6
    let response = await this.client.messages.create({
      model: this.modelName, // 'glm-4.6' or 'glm-4.5-air'
      max_tokens: this.config.maxTokens || 4096,
      system: systemPrompt,
      messages,
      tools: claudeTools,
    });

    // Handle tool calls (same as Claude provider)
    while (response.stop_reason === 'tool_use' && response.content) {
      const toolCalls = response.content.filter(
        (item): item is Anthropic.ToolUseBlock => item.type === 'tool_use'
      );

      if (toolCalls.length === 0) break;

      const toolResults: Anthropic.ToolResultBlock[] = [];

      for (const toolCall of toolCalls) {
        const functionName = toolCall.name;
        const functionArgs = toolCall.input as Record<string, unknown>;
        
        toolsCalled.push(functionName);
        console.log('[GLM] Executing tool:', functionName, functionArgs);

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
            workflow: functionArgs.workflow as 'agile' | 'ccaas' | 'itsm'
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
              title: functionArgs.title as string,
              status: (functionArgs.status || functionArgs.new_status) as string,
            }
          );
          if (!verification.verified) {
            console.warn('[GLM] Action verification failed:', verification.message);
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
          type: 'tool_result',
          tool_use_id: toolCall.id,
          content: toolResultContent,
        });
      }

      // Continue conversation with tool results
      messages.push({
        role: 'assistant',
        content: response.content,
      });
      messages.push({
        role: 'user',
        content: toolResults,
      });

      // Continue conversation with tool results
      // API call: POST https://api.z.ai/api/anthropic/v1/messages
      response = await this.client.messages.create({
        model: this.modelName, // 'glm-4.6' or configured model
        max_tokens: this.config.maxTokens || 4096,
        system: systemPrompt,
        messages,
        tools: claudeTools,
      });
    }

    // Extract final response text
    let responseText = response.content
      .filter((item): item is Anthropic.TextBlock => item.type === 'text')
      .map(item => item.text)
      .join('\n');
    
    // If no response text but tools were called, summarize results
    if (!responseText && toolsCalled.length > 0) {
      responseText = `Executed ${toolsCalled.length} action(s). Please check the tool results above for details.`;
    }

    return {
      response: responseText || 'I completed the requested actions.',
      toolsCalled,
      rawResponse: response,
    };
  }
}

/**
 * Get or create singleton GLM provider instance
 */
export function getGLMProvider(): GLMProvider {
  if (!glmProviderInstance) {
    glmProviderInstance = new GLMProvider();
  }
  return glmProviderInstance;
}

