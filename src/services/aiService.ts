// =====================================
// FLUX - AI Service
// Last Updated: 21:11:22 Dec 06, 2025
// =====================================
// @ts-nocheck
import { GoogleGenerativeAI } from '@google/generative-ai';
import { secureConfig, useProxyServer, proxyConfig } from './secureConfigService';

// Secure AI service configuration
class AIService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private initialized = false;

  // Initialize the AI service - should be called when user is authenticated
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('AI Service: Already initialized');
      return;
    }

    // Check if AI is enabled in configuration
    const aiEnabled = await secureConfig.isAIEnabled();
    if (!aiEnabled) {
      console.warn('AI Service: AI features are disabled');
      return;
    }

    // Get API key from secure storage
    const apiKey = await secureConfig.getApiKey('gemini');
    if (!apiKey) {
      console.warn('AI Service: No API key found in secure configuration');
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        }
      });
      this.initialized = true;
      console.log('AI Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AI Service:', error);
    }
  }

  // Check if AI is available
  isAvailable(): boolean {
    return this.initialized && this.model !== null;
  }

  // Generic AI analysis method
  async analyze(prompt: string, context?: string): Promise<string | null> {
    if (!this.isAvailable()) {
      console.warn('AI Service not available');
      return null;
    }

    try {
      const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('AI analysis failed:', error);
      return null;
    }
  }

  // Issue-related AI methods
  async analyzeIssueDescription(description: string): Promise<{
    priority: 'low' | 'medium' | 'high' | 'critical';
    type: string;
    tags: string[];
    estimatedHours: number;
    confidence: number;
  } | null> {
    const prompt = `
      Analyze this issue description and return a JSON object with:
      - priority: "low" | "medium" | "high" | "critical"
      - type: "bug" | "feature" | "improvement" | "task" | "epic"
      - tags: array of relevant tags
      - estimatedHours: number (estimated hours to complete)
      - confidence: number (0-1, how confident are you in this analysis)

      Description: "${description}"

      Respond only with valid JSON, no other text.
    `;

    const response = await this.analyze(prompt);
    if (!response) return null;

    try {
      const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch {
      console.error('Failed to parse AI response');
      return null;
    }
  }

  async suggestAssignee(issueData: {
    title: string;
    description: string;
    team: string[];
    skills: string[];
  }): Promise<string[] | null> {
    const prompt = `
      Given this issue and team information, suggest the best assignees:

      Issue: "${issueData.title}"
      Description: "${issueData.description}"
      Team Members: ${issueData.team.join(', ')}
      Required Skills: ${issueData.skills.join(', ')}

      Return a JSON array of strings with top 3 best assignees.
      If no one matches, return ["No suitable assignee found"].
    `;

    const response = await this.analyze(prompt);
    if (!response) return null;
    
    try {
      const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch {
      return [response];
    }
  }

  async detectRelatedIssues(currentIssue: {
    title: string;
    description: string;
    existingIssues: Array<{
      title: string;
      description: string;
      key: string;
    }>;
  }): Promise<Array<{ key: string; confidence: number }> | null> {
    const prompt = `
      Analyze if this issue is related to any existing issues:

      Current Issue: "${currentIssue.title}"
      Description: "${currentIssue.description}"

      Existing Issues:
      ${currentIssue.existingIssues.map(i => `- ${i.key}: ${i.title}`).join('\n')}

      Return a JSON array of objects with:
      - key: the issue key
      - confidence: number (0-1, how related are they)

      Only return issues with confidence > 0.6.
    `;

    const response = await this.analyze(prompt);
    if (!response) return null;

    try {
      const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch {
      console.error('Failed to parse AI response');
      return null;
    }
  }

  // Project-related AI methods
  async analyzeProjectHealth(projectData: {
    name: string;
    openIssues: number;
    velocity: number;
    teamSize: number;
    deadline?: string;
  }): Promise<{
    health: 'excellent' | 'good' | 'at-risk' | 'critical';
    risks: string[];
    recommendations: string[];
  } | null> {
    const prompt = `
      Analyze this project's health and return a JSON object:

      Project: ${projectData.name}
      Open Issues: ${projectData.openIssues}
      Velocity: ${projectData.velocity} points/sprint
      Team Size: ${projectData.teamSize}
      Deadline: ${projectData.deadline || 'Not set'}

      Return JSON with:
      - health: "excellent" | "good" | "at-risk" | "critical"
      - risks: array of identified risks
      - recommendations: array of actionable recommendations
    `;

    const response = await this.analyze(prompt);
    if (!response) return null;

    try {
      const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch {
      console.error('Failed to parse AI response');
      return null;
    }
  }

  async generateProjectRoadmap(projectGoals: string[]): Promise<Array<{
    phase: string;
    tasks: string[];
    estimatedDuration: string;
  }> | null> {
    const prompt = `
      Create a project roadmap based on these goals:

      Goals: ${projectGoals.join(', ')}

      Return a JSON array of roadmap phases with:
      - phase: phase name
      - tasks: array of tasks for this phase
      - estimatedDuration: time estimate (e.g., "2 weeks")
    `;

    const response = await this.analyze(prompt);
    if (!response) return null;

    try {
      const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch {
      console.error('Failed to parse AI response');
      return null;
    }
  }

  // Sprint-related AI methods
  async optimizeSprint(
    issues: Array<{ title: string; points?: number; description: string }>,
    teamCapacity: number
  ): Promise<{
    selectedIssues: string[];
    riskLevel: 'low' | 'medium' | 'high';
    suggestions: string[];
  } | null> {
    const prompt = `
      Optimize sprint selection for this team:

      Team Capacity: ${teamCapacity} points
      Available Issues: ${issues.map(i => `${i.title} (${i.points || 0} points)`).join(', ')}

      Return JSON with:
      - selectedIssues: array of issue titles to include
      - riskLevel: "low" | "medium" | "high"
      - suggestions: array of optimization suggestions
    `;

    const response = await this.analyze(prompt);
    if (!response) return null;

    try {
      const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch {
      console.error('Failed to parse AI response');
      return null;
    }
  }

  // Clean up method
  cleanup() {
    this.genAI = null;
    this.model = null;
    this.initialized = false;
  }
}

// Export singleton instance
export const aiService = new AIService();

// Also export the class for type usage
export { AIService };
// 21:11:22 Dec 06, 2025
