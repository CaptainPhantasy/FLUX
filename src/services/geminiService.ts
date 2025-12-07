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
// 21:11:22 Dec 06, 2025
