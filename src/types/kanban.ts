export type TaskStatus = string;

export interface User {
  name: string;
  avatar: string;
}

export interface Task {
  id: string;
  status: TaskStatus;
  title: string;
  description?: string;
  assignee?: User;
  tags: string[];
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
}

export interface BoardProps {
  data: Task[];
  columns: string[];
  onCardMove: (taskId: string, newStatus: string) => Promise<void>;
}
