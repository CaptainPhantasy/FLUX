// @ts-nocheck
// =====================================
// FLUX - Claude (Anthropic) LLM Provider
// =====================================

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

// Updated December 8, 2025
// Using Claude 3.5 Haiku for optimal agent performance:
// - Superior tool-calling reliability and multi-step reasoning
// - Better instruction following for complex system prompts
// - More accurate error reporting (won't say "done" when tools fail)
// - Fast and cost-effective for high-volume agentic workloads
// 
// API model names follow pattern: claude-{version}-{variant}-{date}
// Check https://docs.anthropic.com/claude/docs/models-overview for latest
const DEFAULT_MODEL = 'claude-3-5-haiku-20241022'; // Recommended for agents
// Alternatives:
// - 'claude-3-5-sonnet-20241022' for more complex reasoning tasks
// - 'claude-3-opus-20241022' for highest capability (slower, more expensive)

export class ClaudeProvider implements LLMProvider {
  readonly name = 'claude';
  
  private client: Anthropic | null = null;
  private modelName: string = DEFAULT_MODEL;
  private config: LLMProviderConfig = {};

  constructor(apiKey?: string) {
    if (apiKey) {
      this.configure({ apiKey });
    } else {
      // Try to get from env
      const envKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
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
      this.client = new Anthropic({ 
        apiKey: config.apiKey,
        dangerouslyAllowBrowser: true, // Required for client-side usage
      });
    }
    
    // Model selection: Use provided model or default
    // Latest models (Dec 2025): Check for claude-3-5-sonnet-2025 variants or Opus 4.5
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
      throw new Error('Anthropic API key not configured');
    }

    const toolsCalled: string[] = [];
    
    // Build enhanced context-aware system prompt (with error handling)
    let systemPrompt: string;
    try {
      const context = buildAgentContext();
      systemPrompt = buildEnhancedSystemPrompt(context);
    } catch (error) {
      console.error('[Claude] Error building context, using fallback prompt:', error);
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

    // Convert tools to Claude format
    const claudeTools = tools?.map(toClaudeTool) as Anthropic.Tool[] | undefined;

    // Initial request with enhanced system prompt
    let response = await this.client.messages.create({
      model: this.modelName,
      max_tokens: this.config.maxTokens || 1024,
      system: systemPrompt,
      messages,
      tools: claudeTools,
    });

    let responseText = '';
    
    // Process tool calls
    let iterations = 0;
    const MAX_ITERATIONS = 5;

    while (response.stop_reason === 'tool_use' && iterations < MAX_ITERATIONS) {
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      if (toolUseBlocks.length === 0) break;

      // Build tool results
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolUse of toolUseBlocks) {
        const functionName = toolUse.name;
        const functionArgs = toolUse.input as Record<string, unknown>;
        
        toolsCalled.push(functionName);
        console.log('[Claude] Executing tool:', functionName, functionArgs);

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
            console.warn('[Claude] Action verification failed:', verification.message);
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
          tool_use_id: toolUse.id,
          content: toolResultContent,
        });
      }

      // Add assistant response and tool results to messages
      messages.push({
        role: 'assistant',
        content: response.content,
      });
      messages.push({
        role: 'user',
        content: toolResults,
      });

      // Get next response (reuse the same context-aware system prompt)
      response = await this.client.messages.create({
        model: this.modelName,
        max_tokens: this.config.maxTokens || 1024,
        system: systemPrompt,
        messages,
        tools: claudeTools as Anthropic.Tool[] | undefined,
      });

      iterations++;
    }

    // Extract text from final response
    for (const block of response.content) {
      if (block.type === 'text') {
        responseText += block.text;
      }
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
let instance: ClaudeProvider | null = null;

export function getClaudeProvider(): ClaudeProvider {
  if (!instance) {
    instance = new ClaudeProvider();
  }
  return instance;
}

export default ClaudeProvider;

