import { GoogleGenAI, Type } from "@google/genai";
import { secureConfig } from "./secureConfigService";

// Types for the AI service
export interface ProjectMember {
  userId: string;
  user: {
    name: string;
    email: string;
  };
  role: string;
}

export interface IssueType {
  id: string;
  name: string;
  description?: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
}

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface AIAnalysisResult {
  title?: string;
  description?: string;
  priority?: Priority;
  typeId?: string;
  assigneeId?: string;
  points?: number;
  tags?: string[];
  reasoning?: string;
}

// AI Service class for secure initialization
class IssueAIService {
  private ai: GoogleGenAI | null = null;
  private MODEL_NAME = "gemini-2.5-flash";
  private initialized = false;

  // Initialize the AI service securely
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Check if AI is enabled
    const aiEnabled = await secureConfig.isAIEnabled();
    if (!aiEnabled) {
      console.warn('Issue AI Service: AI features are disabled');
      return;
    }

    // Get API key from secure storage
    const apiKey = await secureConfig.getApiKey('gemini');
    if (!apiKey) {
      console.warn('Issue AI Service: No API key found in secure configuration');
      return;
    }

    try {
      this.ai = new GoogleGenAI({ apiKey });
      this.initialized = true;
      console.log('Issue AI Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Issue AI Service:', error);
    }
  }

  // Check if AI is available
  isAvailable(): boolean {
    return this.initialized && this.ai !== null;
  }

  async analyzeIssueContent(
    input: string,
    members: ProjectMember[],
    issueTypes: IssueType[]
  ): Promise<AIAnalysisResult> {
    if (!this.isAvailable()) {
      console.warn("AI service not available");
      return {};
    }

    try {
      const memberContext = members.map(m => `${m.user.name} (ID: ${m.userId})`).join(", ");
      const typeContext = issueTypes.map(t => `${t.name} (ID: ${t.id})`).join(", ");

      const prompt = `
        Analyze the following issue description and extract structured data.
        Context:
        - Team Members: ${memberContext}
        - Issue Types: ${typeContext}
        - Valid Priorities: low, medium, high, critical

        Input: "${input}"

        Return a JSON object with:
        - title: A concise summary
        - description: A clean, formatted description
        - priority: One of the valid priorities based on urgency words
        - typeId: The most relevant issue type ID
        - assigneeId: The ID of the best matching team member based on context (optional)
        - points: Estimated story points (Fibonacci: 1, 2, 3, 5, 8, 13)
        - tags: Array of 3-5 keywords

        Respond ONLY with valid JSON.
      `;

      const response = await this.ai!.models.generateContent({
        model: this.MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              priority: { type: Type.STRING },
              typeId: { type: Type.STRING },
              assigneeId: { type: Type.STRING },
              points: { type: Type.NUMBER },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              reasoning: { type: Type.STRING }
            }
          }
        }
      });

      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("AI Analysis failed:", error);
      return {};
    }
  }

  async improveDescription(currentDescription: string): Promise<string> {
    if (!this.isAvailable()) {
      console.warn("AI service not available");
      return currentDescription;
    }

    try {
      const prompt = `
        Rewrite and improve the following issue description.
        - Make it professional and clear.
        - Add a "Acceptance Criteria" section if missing.
        - Fix grammar and formatting.

        Input: "${currentDescription}"
      `;

      const response = await this.ai!.models.generateContent({
        model: this.MODEL_NAME,
        contents: prompt,
      });

      return response.text || currentDescription;
    } catch (error) {
      console.error("AI description improvement failed:", error);
      return currentDescription;
    }
  }

  async generateTestCases(description: string): Promise<string> {
    if (!this.isAvailable()) {
      console.warn("AI service not available");
      return "";
    }

    try {
      const prompt = `
        Generate a list of test cases for the following software issue.
        Format as a markdown list.

        Input: "${description}"
      `;

      const response = await this.ai!.models.generateContent({
        model: this.MODEL_NAME,
        contents: prompt,
      });

      return response.text || "";
    } catch (error) {
      console.error("AI test case generation failed:", error);
      return "";
    }
  }

  async findRelatedIssues(
    title: string,
    description: string,
    existingIssues: Issue[]
  ): Promise<Issue[]> {
    if (!this.isAvailable() || existingIssues.length === 0) {
      return [];
    }

    try {
      const issuesContext = existingIssues.slice(0, 50).map(i => `ID: ${i.id}, Title: ${i.title}, Desc: ${i.description.substring(0, 50)}...`).join("\n");

      const prompt = `
        Analyze the new issue and the list of existing issues.
        Identify any existing issues that are duplicates, related, or semantically similar to the new issue.

        New Issue:
        Title: "${title}"
        Description: "${description}"

        Existing Issues:
        ${issuesContext}

        Return a JSON array of string IDs for the matching existing issues. If no matches, return an empty array.
      `;

      const response = await this.ai!.models.generateContent({
        model: this.MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
             type: Type.ARRAY,
             items: { type: Type.STRING }
          }
        }
      });

      const relatedIds = JSON.parse(response.text || "[]");
      return existingIssues.filter(issue => relatedIds.includes(issue.id));
    } catch (error) {
      console.error("Failed to find related issues:", error);
      return [];
    }
  }

  // Clean up method
  cleanup() {
    this.ai = null;
    this.initialized = false;
  }
}

// Export singleton instance
export const issueAIService = new IssueAIService();

// Export individual functions for backward compatibility
export const analyzeIssueContent = (input: string, members: ProjectMember[], issueTypes: IssueType[]) =>
  issueAIService.analyzeIssueContent(input, members, issueTypes);

export const improveDescription = (currentDescription: string) =>
  issueAIService.improveDescription(currentDescription);

export const generateTestCases = (description: string) =>
  issueAIService.generateTestCases(description);

export const findRelatedIssues = (title: string, description: string, existingIssues: Issue[]) =>
  issueAIService.findRelatedIssues(title, description, existingIssues);