// =====================================
// FLUX - Nanocoder Action Logger
// =====================================
// Logs and verifies agent actions for reliability

import { useFluxStore } from '@/lib/store';

/**
 * Log an agent action for tracking and verification
 */
export function logAgentAction(
  actionType: string,
  inputParams: Record<string, unknown>,
  result: { success: boolean; message: string; data?: unknown },
  sessionId?: string
): void {
  try {
    const logs = JSON.parse(localStorage.getItem('flux_agent_action_logs') || '[]');
    
    const newLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: useFluxStore.getState().user?.id || 'local',
      sessionId: sessionId || 'default',
      actionType,
      inputParams,
      result,
      verified: false,
      createdAt: new Date().toISOString(),
    };

    logs.push(newLog);
    
    // Keep only last 500 logs
    while (logs.length > 500) {
      logs.shift();
    }
    
    localStorage.setItem('flux_agent_action_logs', JSON.stringify(logs));
    console.log(`[ActionLogger] Logged action: ${actionType} (${result.success ? 'success' : 'failed'})`);
  } catch (error) {
    console.error('[ActionLogger] Failed to log action:', error);
  }
}

/**
 * Verify that a task action was successful by checking the store
 */
export async function verifyTaskAction(
  actionType: 'create' | 'update' | 'delete',
  expectedData: {
    taskId?: string;
    title?: string;
    status?: string;
    priority?: string;
  }
): Promise<{ verified: boolean; message: string; actualData?: Record<string, unknown> }> {
  try {
    const store = useFluxStore.getState();
    const tasks = store.tasks;

    switch (actionType) {
      case 'create': {
        // Verify task was created
        const task = expectedData.taskId 
          ? tasks.find(t => t.id === expectedData.taskId)
          : expectedData.title 
            ? tasks.find(t => t.title === expectedData.title)
            : null;

        if (!task) {
          return {
            verified: false,
            message: `Task "${expectedData.title}" was not found in the store. Creation may have failed.`,
          };
        }

        // Check if status matches (if expected)
        if (expectedData.status && task.status !== expectedData.status) {
          return {
            verified: false,
            message: `Task was created but status is "${task.status}" instead of expected "${expectedData.status}".`,
            actualData: { taskId: task.id, status: task.status },
          };
        }

        return {
          verified: true,
          message: `Task "${task.title}" verified in store.`,
          actualData: { taskId: task.id, title: task.title, status: task.status },
        };
      }

      case 'update': {
        if (!expectedData.taskId && !expectedData.title) {
          return {
            verified: false,
            message: 'No task identifier provided for verification.',
          };
        }

        const task = expectedData.taskId 
          ? tasks.find(t => t.id === expectedData.taskId)
          : tasks.find(t => t.title.toLowerCase().includes((expectedData.title || '').toLowerCase()));

        if (!task) {
          return {
            verified: false,
            message: `Task not found for verification.`,
          };
        }

        // Check expected values
        const mismatches: string[] = [];
        if (expectedData.status && task.status !== expectedData.status) {
          mismatches.push(`status: expected "${expectedData.status}", got "${task.status}"`);
        }
        if (expectedData.priority && task.priority !== expectedData.priority) {
          mismatches.push(`priority: expected "${expectedData.priority}", got "${task.priority}"`);
        }

        if (mismatches.length > 0) {
          return {
            verified: false,
            message: `Task update verification failed: ${mismatches.join(', ')}`,
            actualData: { taskId: task.id, status: task.status, priority: task.priority },
          };
        }

        return {
          verified: true,
          message: `Task "${task.title}" update verified.`,
          actualData: { taskId: task.id, title: task.title, status: task.status },
        };
      }

      case 'delete': {
        if (!expectedData.taskId && !expectedData.title) {
          return {
            verified: false,
            message: 'No task identifier provided for verification.',
          };
        }

        const task = expectedData.taskId 
          ? tasks.find(t => t.id === expectedData.taskId)
          : tasks.find(t => t.title === expectedData.title);

        if (task) {
          return {
            verified: false,
            message: `Task still exists in store. Deletion may have failed.`,
            actualData: { taskId: task.id, title: task.title },
          };
        }

        return {
          verified: true,
          message: 'Task deletion verified - task not found in store.',
        };
      }

      default:
        return {
          verified: false,
          message: `Unknown action type: ${actionType}`,
        };
    }
  } catch (error) {
    return {
      verified: false,
      message: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Verify email action
 */
export function verifyEmailAction(
  actionType: 'archive' | 'mark_read' | 'star',
  emailId: string,
  expectedValue: boolean
): { verified: boolean; message: string } {
  try {
    const store = useFluxStore.getState();
    const email = store.emails?.find(e => e.id === emailId);

    if (!email) {
      return {
        verified: false,
        message: `Email not found: ${emailId}`,
      };
    }

    switch (actionType) {
      case 'archive':
        return email.isArchived === expectedValue
          ? { verified: true, message: 'Archive status verified.' }
          : { verified: false, message: `Archive status mismatch: expected ${expectedValue}, got ${email.isArchived}` };
      case 'mark_read':
        return email.isRead === expectedValue
          ? { verified: true, message: 'Read status verified.' }
          : { verified: false, message: `Read status mismatch: expected ${expectedValue}, got ${email.isRead}` };
      case 'star':
        return email.isStarred === expectedValue
          ? { verified: true, message: 'Star status verified.' }
          : { verified: false, message: `Star status mismatch: expected ${expectedValue}, got ${email.isStarred}` };
      default:
        return { verified: false, message: `Unknown email action: ${actionType}` };
    }
  } catch (error) {
    return {
      verified: false,
      message: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Mark an action log entry as verified
 */
export function markActionVerified(logId: string, verified: boolean): void {
  try {
    const logs = JSON.parse(localStorage.getItem('flux_agent_action_logs') || '[]');
    const log = logs.find((l: any) => l.id === logId);
    if (log) {
      log.verified = verified;
      localStorage.setItem('flux_agent_action_logs', JSON.stringify(logs));
    }
  } catch (error) {
    console.error('[ActionLogger] Failed to mark action verified:', error);
  }
}

/**
 * Get recent actions for context
 */
export function getRecentActions(limit = 10): Array<{
  actionType: string;
  success: boolean;
  message: string;
  timestamp: number;
}> {
  try {
    const logs = JSON.parse(localStorage.getItem('flux_agent_action_logs') || '[]');
    return logs
      .slice(-limit)
      .reverse()
      .map((log: any) => ({
        actionType: log.actionType,
        success: log.result?.success || false,
        message: log.result?.message || '',
        timestamp: new Date(log.createdAt).getTime(),
      }));
  } catch {
    return [];
  }
}

