// =====================================
// FLUX - Gemini AI Service
// =====================================
// Handles communication with Google Gemini AI for intelligent command processing

// @ts-nocheck
import { GoogleGenerativeAI } from '@google/generative-ai';

import { toolRegistry, executeTool, type ToolResult } from './tools';
import { useFluxStore } from '@/lib/store';
import type { Message, ToolCall } from '@/types';

// Get API key from environment
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Singleton AI client
let aiClient: GoogleGenAI | null = null;

/**
 * Initialize the Gemini client
 */
function getClient(): GoogleGenerativeAI {
    if (!aiClient) {
        if (!GEMINI_API_KEY) {
            throw new Error('Gemini API key not configured. Set VITE_GEMINI_API_KEY in .env.local');
        }
        aiClient = new GoogleGenerativeAI(GEMINI_API_KEY);
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
- Active Tasks: ${tasks.length} (${tasks.filter(t => t.status === 'todo').length} to -do, ${tasks.filter(t => t.status === 'in-progress').length} in progress)
- High Priority Items: ${tasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length}
- Unread Notifications: ${unreadCount}

AVAILABLE TASKS:
${tasks.slice(0, 10).map(t => `- "${t.title}" [${t.status}] - ${t.priority}`).join('\n')}

GUIDELINES:
1. When the user asks to perform an action(create task, mark done, etc.), use the appropriate function call.
2. Be concise and helpful in your responses.
3. If unsure about a task title, ask for clarification.
4. Proactively suggest actions when appropriate(e.g., "Would you like me to archive completed tasks?").
5. Use a professional but friendly tone.
6. When listing information, format it clearly with bullet points or numbered lists.

    Remember: You have real control over the application.Function calls will actually modify the user's data.`;
}

/**
 * Get tool definitions in Gemini format
 */
function getGeminiToolDefinitions() {
    return toolRegistry.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: {
            type: "object",
            properties: Object.fromEntries(
                Object.entries(tool.parameters.properties).map(([key, value]) => [
                    key,
                    {
                        type: value.type === 'string' ? "string" : "string",
                        description: value.description,
                        ...(value.enum ? { enum: value.enum } : {}),
                    },
                ])
            ),
            required: tool.parameters.required || [],
        },
    }));
}

/**
 * Process a user command through Gemini
 */
export async function processCommand(userInput: string): Promise<{
    response: string;
    toolCalls?: ToolCall[];
    toolResults?: ToolResult[];
}> {
    // If no API key, use fallback mock responses
    if (!GEMINI_API_KEY) {
        return processMockCommand(userInput);
    }

    try {
        const client = getClient();

        const model = client.getGenerativeModel({
            model: 'gemini-2.0-flash-exp',
            systemInstruction: buildSystemPrompt(),
            tools: [{
                functionDeclarations: getGeminiToolDefinitions(),
            }],
        });

        const response = await model.generateContent(userInput);

        // Check for function calls
        const candidate = response.candidates?.[0];
        const content = candidate?.content;

        if (!content) {
            return { response: "I couldn't process that request. Please try again." };
        }

        const toolCalls: ToolCall[] = [];
        const toolResults: ToolResult[] = [];
        let textResponse = '';

        // Process parts
        for (const part of content.parts || []) {
            if (part.text) {
                textResponse += part.text;
            }

            if (part.functionCall) {
                const call: ToolCall = {
                    id: crypto.randomUUID(),
                    function: part.functionCall.name || '',
                    arguments: (part.functionCall.args as Record<string, unknown>) || {},
                };
                toolCalls.push(call);

                // Execute the tool
                const result = await executeTool(call);
                toolResults.push(result);
            }
        }

        // If we executed tools, include their results in the response
        if (toolResults.length > 0) {
            const resultMessages = toolResults.map(r => r.message).join('\n');
            return {
                response: textResponse || resultMessages,
                toolCalls,
                toolResults,
            };
        }

        return { response: textResponse || "I'm here to help. What would you like to do?" };

    } catch (error) {
        console.error('[Gemini] Error processing command:', error);
        return {
            response: `I encountered an issue: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        };
    }
}

/**
 * Mock command processing for demo/offline mode
 */
function processMockCommand(input: string): Promise<{
    response: string;
    toolCalls?: ToolCall[];
    toolResults?: ToolResult[];
}> {
    return new Promise(async (resolve) => {
        const lower = input.toLowerCase();

        // Simulate processing delay
        await new Promise(r => setTimeout(r, 800));

        // ... inside processMockCommand

        // Pattern matching for common commands
        if (lower.includes('create') && lower.includes('task')) {
            // Extract task title from input
            const titleMatch = input.match(/(?:create|add|new)\s+(?:a\s+)?task[:\s]+["']?([^"'\n]+)["']?/i);
            const title = titleMatch?.[1] || 'New Task';

            const call: ToolCall = { id: 'mock-create', function: 'create_task', arguments: { title } };
            const result = await executeTool(call);

            resolve({
                response: result.message,
                toolCalls: [call],
                toolResults: [result],
            });
            return;
        }

        if (lower.includes('list') && lower.includes('task')) {
            const call: ToolCall = { id: 'mock-list', function: 'list_tasks', arguments: {} };
            const result = await executeTool(call);

            resolve({
                response: result.message,
                toolCalls: [call],
                toolResults: [result],
            });
            return;
        }

        if (lower.includes('summary') || lower.includes('status') || lower.includes('overview')) {
            const call: ToolCall = { id: 'mock-summary', function: 'summarize_project', arguments: {} };
            const result = await executeTool(call);

            resolve({
                response: result.message,
                toolCalls: [call],
                toolResults: [result],
            });
            return;
        }

        if (lower.includes('clear') && (lower.includes('notification') || lower.includes('inbox'))) {
            const call: ToolCall = { id: 'mock-clear', function: 'clear_notifications', arguments: { action: 'mark_read' } };
            const result = await executeTool(call);

            resolve({
                response: result.message,
                toolCalls: [call],
                toolResults: [result],
            });
            return;
        }

        if (lower.includes('dark') || lower.includes('light') || lower.includes('theme')) {
            const theme = lower.includes('light') ? 'light' : 'dark';
            const call: ToolCall = { id: 'mock-theme', function: 'set_theme', arguments: { theme } };
            const result = await executeTool(call);

            resolve({
                response: result.message,
                toolCalls: [call],
                toolResults: [result],
            });
            return;
        }

        if (lower.includes('archive') && lower.includes('done')) {
            const call: ToolCall = { id: 'mock-archive', function: 'archive_completed_tasks', arguments: {} };
            const result = await executeTool(call);

            resolve({
                response: result.message,
                toolCalls: [call],
                toolResults: [result],
            });
            return;
        }

        if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
            resolve({
                response: "Hello! I'm Flux, your AI assistant. I can help you manage tasks, clear notifications, and navigate the app. Try saying 'show me a summary' or 'create task: Design review'.",
            });
            return;
        }

        if (lower.includes('help')) {
            resolve({
                response: `Here's what I can do:

📝 **Task Management**
• "Create task: [title]" - Add a new task
• "List tasks" - Show all active tasks  
• "Mark [task] as done" - Complete a task
• "Archive completed tasks" - Clean up done items

📬 **Notifications**
• "Clear notifications" - Mark all as read
• "How many unread?" - Check notification count

🎨 **UI Control**
• "Switch to dark/light mode" - Change theme
• "Toggle sidebar" - Collapse/expand navigation

📊 **Insights**
• "Project summary" - Get an overview
• "What's my workload?" - See task breakdown

Just ask naturally - I'll figure out what you need!`,
            });
            return;
        }

        // Default response
        resolve({
            response: `I understand you said: "${input}". I can help with task management, notifications, and app settings. Try asking for a "project summary" or say "help" for more options.`,
        });
    });
}

/**
 * Add a message to terminal history and get AI response
 */
export async function sendTerminalMessage(content: string): Promise<void> {
    const store = useFluxStore.getState();

    // Add user message
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
 * Check if Gemini is configured
 */
export function isGeminiConfigured(): boolean {
    return !!GEMINI_API_KEY;
}
