export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: string;
  type: string;
}

export interface Comment {
  id: string;
  userId: string;
  content: string; // HTML or Markdown
  createdAt: string;
}

export interface IssueType {
  id: string;
  name: string;
  description?: string;
  icon: string; // Lucide icon name
  color: string;
  subtask: boolean;
}

export interface Status {
  id: string;
  name: string;
  category: 'to_do' | 'in_progress' | 'done';
  color: string; // tailwind color class
}

export interface Priority {
  id: string;
  name: string;
  rank: number;
  color: string; // hex or tailwind class
}

export interface IssueLink {
  id: string;
  type: 'blocks' | 'is_blocked_by' | 'relates_to' | 'duplicates' | 'is_duplicated_by';
  targetIssueId: string; // Simplify for mock: just store ID
  targetIssueKey: string;
  targetIssueTitle: string;
}

export interface Issue {
  id: string;
  key: string;
  projectId: string;
  type: IssueType;
  summary: string;
  description?: string;
  status: Status;
  priority: Priority;
  assignee?: User;
  reporter: User;
  parent?: Issue;
  estimate?: number; // Story points
  timeSpent: number; // Minutes
  dueDate?: string;
  labels: string[];
  links: IssueLink[];
  attachments: Attachment[];
  watchers: User[];
  votes: number;
  createdAt: string;
  updatedAt: string;
  projectKey: string;
  comments: Comment[];
}

// AI Related Types
export interface AISuggestion {
  confidence: number;
  reasoning: string;
  value: any;
}
