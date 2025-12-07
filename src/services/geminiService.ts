// =====================================
// FLUX - Gemini Task Generation Service
// Last Updated: 21:11:22 Dec 06, 2025
// =====================================
// @ts-nocheck
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Task } from '../types';

// Use Vite's import.meta.env for client-side env vars
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

// Singleton client
let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!genAI && apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI!;
}

export const generateTasks = async (projectContext: string): Promise<Task[]> => {
  if (!apiKey) {
    console.warn("[GeminiService] No API Key provided for Gemini");
    return [
        {
            id: 'mock-1',
            title: "Design System Audit",
            description: "Generated fallback: Audit current color tokens",
            status: 'todo',
            priority: 'high',
            tags: ['Design']
        }
    ];
  }

  try {
    const client = getClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const prompt = `Generate 3-5 project management tasks for a project with this context: "${projectContext}". 
    Return strictly valid JSON array matching this schema:
    [{ "id": "string", "title": "string", "description": "string", "status": "todo|in-progress|review|done", "priority": "low|medium|high", "tags": ["string"] }]
    
    Only return the JSON array, no other text.`;
    
    const response = await model.generateContent(prompt);
    const text = response.response.text();
    
    if (!text) return [];
    
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    return JSON.parse(cleanedText) as Task[];

  } catch (error) {
    console.error("[GeminiService] Error:", error);
    return [];
  }
};

/**
 * Analyze workflow for issues
 */
export const analyzeWorkflow = async (workflowData: any): Promise<{
  suggestions: string[];
  issues: string[];
  score: number;
} | null> => {
  if (!apiKey) return null;

  try {
    const client = getClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const prompt = `Analyze this workflow and return JSON with suggestions, issues, and a score (0-100):
    ${JSON.stringify(workflowData)}
    
    Return: { "suggestions": [], "issues": [], "score": number }`;
    
    const response = await model.generateContent(prompt);
    const text = response.response.text();
    const cleanedText = text?.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    return cleanedText ? JSON.parse(cleanedText) : null;
  } catch (error) {
    console.error("[GeminiService] analyzeWorkflow error:", error);
    return null;
  }
};

/**
 * Generate automation rule from natural language
 */
export const generateRuleFromText = async (description: string): Promise<any | null> => {
  if (!apiKey) return null;

  try {
    const client = getClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const prompt = `Convert this automation rule description to JSON:
    "${description}"
    
    Return: { "name": "", "trigger": { "type": "", "config": {} }, "conditions": [], "actions": [] }`;
    
    const response = await model.generateContent(prompt);
    const text = response.response.text();
    const cleanedText = text?.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    return cleanedText ? JSON.parse(cleanedText) : null;
  } catch (error) {
    console.error("[GeminiService] generateRuleFromText error:", error);
    return null;
  }
};

/**
 * Analyze incident for triage
 */
export const analyzeIncident = async (incidentData: any): Promise<{
  severity: string;
  category: string;
  suggestedAssignee: string;
  relatedIncidents: string[];
} | null> => {
  if (!apiKey) return null;

  try {
    const client = getClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const prompt = `Analyze this incident and provide triage information:
    ${JSON.stringify(incidentData)}
    
    Return: { "severity": "low|medium|high|critical", "category": "", "suggestedAssignee": "", "relatedIncidents": [] }`;
    
    const response = await model.generateContent(prompt);
    const text = response.response.text();
    const cleanedText = text?.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    return cleanedText ? JSON.parse(cleanedText) : null;
  } catch (error) {
    console.error("[GeminiService] analyzeIncident error:", error);
    return null;
  }
};

/**
 * Analyze change impact
 */
export const analyzeChangeImpact = async (changeData: any): Promise<{
  riskLevel: string;
  affectedSystems: string[];
  recommendations: string[];
} | null> => {
  if (!apiKey) return null;

  try {
    const client = getClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const prompt = `Analyze this change request for potential impact:
    ${JSON.stringify(changeData)}
    
    Return: { "riskLevel": "low|medium|high", "affectedSystems": [], "recommendations": [] }`;
    
    const response = await model.generateContent(prompt);
    const text = response.response.text();
    const cleanedText = text?.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    return cleanedText ? JSON.parse(cleanedText) : null;
  } catch (error) {
    console.error("[GeminiService] analyzeChangeImpact error:", error);
    return null;
  }
};

/**
 * Suggest services based on context
 */
export const suggestServices = async (context: string): Promise<string[] | null> => {
  if (!apiKey) return null;

  try {
    const client = getClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const prompt = `Suggest IT services based on this context: "${context}"
    Return a JSON array of service names.`;
    
    const response = await model.generateContent(prompt);
    const text = response.response.text();
    const cleanedText = text?.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    return cleanedText ? JSON.parse(cleanedText) : null;
  } catch (error) {
    console.error("[GeminiService] suggestServices error:", error);
    return null;
  }
};

/**
 * Suggest custom fields
 */
export const suggestFields = async (context: string): Promise<any[] | null> => {
  if (!apiKey) return null;

  try {
    const client = getClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const prompt = `Suggest custom fields for this project type: "${context}"
    Return JSON array: [{ "name": "", "type": "text|number|select|date", "required": boolean }]`;
    
    const response = await model.generateContent(prompt);
    const text = response.response.text();
    const cleanedText = text?.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    return cleanedText ? JSON.parse(cleanedText) : null;
  } catch (error) {
    console.error("[GeminiService] suggestFields error:", error);
    return null;
  }
};

/**
 * Predict SLA breaches
 */
export const predictSLABreaches = async (slaData: any[]): Promise<any[] | null> => {
  if (!apiKey) return null;

  try {
    const client = getClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const prompt = `Analyze these SLAs and predict potential breaches:
    ${JSON.stringify(slaData)}
    
    Return JSON array: [{ "slaId": "", "riskLevel": "low|medium|high", "predictedBreachTime": "" }]`;
    
    const response = await model.generateContent(prompt);
    const text = response.response.text();
    const cleanedText = text?.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    return cleanedText ? JSON.parse(cleanedText) : null;
  } catch (error) {
    console.error("[GeminiService] predictSLABreaches error:", error);
    return null;
  }
};

// SLA Risk Analysis type
export interface SLARiskAnalysis {
  slaId: string;
  riskLevel: 'low' | 'medium' | 'high';
  predictedBreachTime?: string;
  recommendations: string[];
}

/**
 * Check if Gemini service is configured
 */
export const isGeminiServiceConfigured = (): boolean => {
  return !!apiKey;
};

/**
 * Chat with AI assistant for terminal commands
 */
export const chatWithAssistant = async (message: string, context?: { tasks?: any[], projects?: any[] }): Promise<string> => {
  if (!apiKey) {
    // Fallback response when no API key
    return getFallbackResponse(message);
  }

  try {
    const client = getClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const systemContext = context ? `
Context:
- Tasks: ${context.tasks?.length || 0} total tasks
- Projects: ${context.projects?.length || 0} projects
- Task statuses: ${context.tasks?.reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {} as Record<string, number>) || {}}
` : '';

    const prompt = `You are Flux AI, a helpful assistant for a project management app. Be concise and helpful.
${systemContext}

User: ${message}

Respond in a helpful, concise way. If asked about tasks or projects, use the context provided.`;
    
    const response = await model.generateContent(prompt);
    const text = response.response.text();
    
    return text || 'I apologize, I could not process that request. Please try again.';
  } catch (error) {
    console.error("[GeminiService] chatWithAssistant error:", error);
    return getFallbackResponse(message);
  }
};

// Fallback responses when API is not available
function getFallbackResponse(message: string): string {
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes('help')) {
    return `Available commands:
• "show tasks" - View task summary
• "create task [name]" - Create a new task
• "status" - View system status
• "help" - Show this help message

Note: Connect Gemini API for full AI capabilities.`;
  }
  
  if (lowerMsg.includes('status') || lowerMsg.includes('system')) {
    return `System Status: Online
• Database: Local Storage
• Theme: Active
• AI: Offline (no API key configured)

Add VITE_GEMINI_API_KEY to enable AI features.`;
  }
  
  if (lowerMsg.includes('task')) {
    return `Task Management:
• Use the Task Board (/app/board) to manage tasks
• Press Ctrl+K to open this terminal anywhere
• Click "New Task" to create tasks

Note: AI task assistance requires Gemini API key.`;
  }
  
  return `I'm Flux AI. I can help you manage tasks and projects.

Currently running in offline mode. Add VITE_GEMINI_API_KEY for full AI capabilities.

Type "help" for available commands.`;
}
// Dec 07, 2025