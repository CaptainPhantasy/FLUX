
// =====================================
// FLUX - OpenAI Service
// =====================================
// Handles communication with OpenAI for intelligent command processing

// @ts-nocheck
import OpenAI from 'openai';
import { toolRegistry, executeTool, type ToolResult } from './tools';
import { useFluxStore } from '@/lib/store';
import type { Message, ToolCall } from '@/types';

// Get API key from environment
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

// Singleton AI client
let aiClient: OpenAI | null = null;

/**
 * Initialize the OpenAI client
 */
function getClient(): OpenAI {
    if (!aiClient) {
        if (!OPENAI_API_KEY) {
            throw new Error('OpenAI API key not configured. Set VITE_OPENAI_API_KEY in .env.local');
        }
        aiClient = new OpenAI({
            apiKey: OPENAI_API_KEY,
            dangerouslyAllowBrowser: true
        });
    }
    return aiClient;
}

/**
 * Build the system prompt with current context
 */
function buildSystemPrompt(): string {
    const state = useFluxStore.getState();
    const tasks = state.tasks.filter(t => t.status !== 'archived');
    const unreadCount = state.unreadCount;

    return `You are Flux, an advanced AI assistant integrated into a project management application.
You can control the application through function calls to help users manage their work efficiently.

CURRENT CONTEXT:
- Active Tasks: ${tasks.length} (${tasks.filter(t => t.status === 'todo').length} to-do, ${tasks.filter(t => t.status === 'in-progress').length} in progress)
- High Priority Items: ${tasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length}
- Unread Notifications: ${unreadCount}

AVAILABLE TASKS:
${tasks.slice(0, 10).map(t => `- "${t.title}" [${t.status}] - ${t.priority}`).join('\n')}

GUIDELINES:
1. When the user asks to perform an action (create task, mark done, etc.), use the appropriate function call.
2. Be concise and helpful in your responses.
3. If unsure about a task title, ask for clarification.
4. Proactively suggest actions when appropriate (e.g., "Would you like me to archive completed tasks?").
5. Use a professional but friendly tone.
6. When listing information, format it clearly with bullet points or numbered lists.

Remember: You have real control over the application. Function calls will actually modify the user's data.`;
}

/**
 * Get tool definitions in OpenAI format
 */
function getOpenAITools(): OpenAI.Chat.ChatCompletionTool[] {
    return toolRegistry.map(tool => ({
        type: 'function',
        function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
        },
    }));
}

/**
 * Process a user command through OpenAI
 */
export async function processCommand(userInput: string): Promise<{
    response: string;
    toolCalls?: ToolCall[];
    toolResults?: ToolResult[];
}> {

    // We expect the key to be there if we are calling this
    try {
        const client = getClient();
        const tools = getOpenAITools();

        const response = await client.chat.completions.create({
            model: 'gpt-4o', // Using a high quality model as requested ("VERY good logic")
            messages: [
                { role: 'system', content: buildSystemPrompt() },
                { role: 'user', content: userInput }
            ],
            tools: tools,
            tool_choice: 'auto',
        });

        const message = response.choices[0].message;

        // If there are tool calls
        if (message.tool_calls && message.tool_calls.length > 0) {
            const toolCalls: ToolCall[] = [];
            const toolResults: ToolResult[] = [];

            // Process each tool call
            for (const toolCall of message.tool_calls) {
                const functionName = toolCall.function.name;
                const args = JSON.parse(toolCall.function.arguments);

                const call: ToolCall = {
                    id: toolCall.id,
                    function: functionName,
                    arguments: args,
                };
                toolCalls.push(call);

                // Execute the tool
                const result = await executeTool(call);
                toolResults.push(result);
            }

            // Send results back to OpenAI to get final response
            const secondResponse = await client.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: buildSystemPrompt() },
                    { role: 'user', content: userInput },
                    message, // The assistant message with tool calls
                    ...toolResults.map((result, index) => ({
                        role: 'tool' as const,
                        tool_call_id: message.tool_calls![index].id,
                        content: result.message
                    }))
                ],
            });

            return {
                response: secondResponse.choices[0].message.content || 'Action completed.',
                toolCalls,
                toolResults,
            };

        } else {
            // Normal text response
            return { response: message.content || "I'm listening." };
        }

    } catch (error) {
        console.error('[OpenAI] Error processing command:', error);
        return {
            response: `I encountered an issue: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        };
    }
}

/**
 * Add a message to terminal history and get AI response
 */
export async function sendTerminalMessage(content: string): Promise<void> {
    const store = useFluxStore.getState();

    // Add user message to UI
    const userMessage: Message = {
        id: `${Date.now()}`,
        role: 'user',
        content,
        timestamp: Date.now(),
    };
    store.addTerminalMessage(userMessage);
    store.setTerminalThinking(true);

    try {
        // Process command
        const result = await processCommand(content);

        // Add agent response
        const agentMessage: Message = {
            id: `${Date.now() + 1}`,
            role: 'agent',
            content: result.response,
            timestamp: Date.now(),
            toolCalls: result.toolCalls,
        };
        store.addTerminalMessage(agentMessage);
    } catch (error) {
        // Add error message
        const errorMessage: Message = {
            id: `${Date.now() + 1}`,
            role: 'agent',
            content: `Error: ${error instanceof Error ? error.message : 'An unexpected error occurred'}`,
            timestamp: Date.now(),
        };
        store.addTerminalMessage(errorMessage);
    } finally {
        store.setTerminalThinking(false);
    }
}

/**
 * Check if OpenAI is configured
 */
export function isOpenAIConfigured(): boolean {
    return !!OPENAI_API_KEY;
}
