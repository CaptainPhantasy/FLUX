// =====================================
// FLUX - Nanocoder Bridge Component
// =====================================
// Listens for Nanocoder action events and executes visible UI changes
// This is the "nervous system" that connects AI commands to the UI

import { useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFluxStore } from '@/lib/store';
import { subscribeToNanocoderActions } from './dispatcher';
import { speak as ttsSpeak, stopSpeaking as ttsStop, type TTSPriority } from './voice/TextToSpeech';
import { getWorkflow, getActiveColumns } from '@/lib/workflows';
import type { NanocoderAction } from './types';
import type { Task } from '@/types';

interface NanocoderBridgeProps {
  onTerminalOpen?: () => void;
  onTerminalClose?: () => void;
}

/**
 * NanocoderBridge - The event-driven UI controller
 * 
 * This component bridges Nanocoder AI commands to actual UI actions.
 * It subscribes to custom DOM events and executes them with visual feedback.
 * 
 * The pattern:
 * 1. AI tool returns action → dispatcher fires event
 * 2. This bridge catches event → executes UI action
 * 3. User sees the change happen visually
 */
export function NanocoderBridge({ onTerminalOpen, onTerminalClose }: NanocoderBridgeProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const historyStack = useRef<string[]>([]);
  
  // Store actions
  const setTheme = useFluxStore((s) => s.setTheme);
  const toggleSidebar = useFluxStore((s) => s.toggleSidebar);
  const setWorkflowMode = useFluxStore((s) => s.setWorkflowMode);
  const setSelectedIncidentId = useFluxStore((s) => s.setSelectedIncidentId);
  const setSelectedEmail = useFluxStore((s) => s.setSelectedEmail);
  const selectTask = useFluxStore((s) => s.selectTask);

  // Track navigation history
  useEffect(() => {
    historyStack.current.push(location.pathname);
    // Keep only last 50 entries
    if (historyStack.current.length > 50) {
      historyStack.current = historyStack.current.slice(-50);
    }
  }, [location.pathname]);

  /**
   * Handle incoming Nanocoder actions
   */
  const handleAction = useCallback(async (action: NanocoderAction) => {
    console.log('[NanocoderBridge] Handling action:', action.type, action.payload);

    switch (action.type) {
      // ==================
      // Navigation
      // ==================
      case 'navigate': {
        const { path, replace } = action.payload as { path: string; replace?: boolean };
        const targetPath = path.startsWith('/') ? path : `/app/${path}`;
        
        // Verify navigation will actually change location
        const currentPath = location.pathname;
        if (currentPath === targetPath) {
          console.log('[NanocoderBridge] Already on target page:', targetPath);
          showVisualToast(`Already on ${path}`, 'info');
          return;
        }
        
        try {
          if (replace) {
            navigate(targetPath, { replace: true });
          } else {
            navigate(targetPath);
          }
          
          // Verify navigation completed after a short delay
          setTimeout(() => {
            if (globalThis.location.pathname !== targetPath) {
              console.warn('[NanocoderBridge] Navigation may have failed. Expected:', targetPath, 'Got:', globalThis.location.pathname);
              showVisualToast(`Navigation to ${path} may have failed`, 'error');
            } else {
              showVisualToast(`Navigated to ${path}`, 'success');
            }
          }, 100);
        } catch (error) {
          console.error('[NanocoderBridge] Navigation error:', error);
          showVisualToast(`Failed to navigate to ${path}`, 'error');
        }
        break;
      }

      case 'go_back': {
        try {
          if (historyStack.current.length > 1) {
            // Remove current path
            historyStack.current.pop();
            // Get previous path
            const previousPath = historyStack.current.at(-1);
            if (previousPath) {
              navigate(previousPath);
              showVisualToast('Navigated back', 'success');
            } else {
              navigate(-1);
              showVisualToast('Navigated back', 'success');
            }
          } else {
            navigate(-1);
            showVisualToast('Navigated back', 'success');
          }
        } catch (error) {
          console.error('[NanocoderBridge] Go back error:', error);
          showVisualToast('Failed to navigate back', 'error');
        }
        break;
      }

      case 'open_terminal': {
        onTerminalOpen?.();
        break;
      }

      case 'close_terminal': {
        onTerminalClose?.();
        break;
      }

      // ==================
      // UI Control
      // ==================
      case 'set_theme': {
        const { theme } = action.payload as { theme: 'light' | 'dark' | 'system' };
        setTheme(theme);
        // Also update document class for immediate visual feedback
        const root = document.documentElement;
        if (theme === 'dark') {
          root.classList.add('dark');
        } else if (theme === 'light') {
          root.classList.remove('dark');
        } else {
          // System preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          root.classList.toggle('dark', prefersDark);
        }
        break;
      }

      case 'toggle_sidebar': {
        toggleSidebar();
        break;
      }

      case 'show_toast': {
        const { message, type } = action.payload as { message: string; type?: string };
        // Create a toast notification
        showVisualToast(message, type as 'success' | 'error' | 'info');
        break;
      }

      case 'scroll_to': {
        const { elementId } = action.payload as { elementId: string };
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add highlight effect
          element.classList.add('nanocoder-highlight');
          setTimeout(() => element.classList.remove('nanocoder-highlight'), 2000);
        }
        break;
      }

      // ==================
      // Board Control
      // ==================
      case 'move_task': {
        const { taskId, toColumn } = action.payload as { taskId: string; toColumn: string };

        // UI-only: the underlying tool already updated state; just resolve and highlight
        let resolvedTaskId = taskId;
        const store = useFluxStore.getState();
        const tasks = store.tasks;
        const workflow = getWorkflow(store.workflowMode || 'agile');

        // If taskId doesn't look like a UUID, try to find by title
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.exec(taskId)) {
          const searchTitle = taskId.toLowerCase();
          const matchingTask = tasks.find(t =>
            t.title.toLowerCase().includes(searchTitle) ||
            t.id.toLowerCase().includes(searchTitle)
          );
          if (matchingTask) {
            resolvedTaskId = matchingTask.id;
          } else {
            showVisualToast(`Could not find task: "${taskId}"`, 'error');
            return;
          }
        }

        // Verify task exists
        const task = tasks.find(t => t.id === resolvedTaskId);
        if (!task) {
          showVisualToast(`Task not found: "${taskId}"`, 'error');
          return;
        }

        const columnName = workflow.columns.find(c => c.id === toColumn)?.title || toColumn;

        // Visual feedback - highlight the task card briefly
        setTimeout(() => {
          const taskElement = document.querySelector(`[data-task-id="${resolvedTaskId}"]`);
          if (taskElement) {
            taskElement.classList.add('nanocoder-task-moved');
            setTimeout(() => taskElement.classList.remove('nanocoder-task-moved'), 1500);
          }
        }, 100);

        showVisualToast(`Moved "${task.title}" to ${columnName}`, 'success');
        break;
      }

      case 'change_workflow': {
        const { workflow } = action.payload as { workflow: 'agile' | 'ccaas' | 'itsm' };
        setWorkflowMode(workflow);
        break;
      }

      case 'highlight_task': {
        const { taskId, duration = 2000 } = action.payload as { taskId: string; duration?: number };
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
          taskElement.classList.add('nanocoder-highlight');
          taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => taskElement.classList.remove('nanocoder-highlight'), duration);
        }
        break;
      }

      // ==================
      // Task Operations
      // ==================
      case 'create_task': {
        const { title, status } = action.payload as { 
          title: string; 
          status?: string;
        };

        // UI-only: creation already handled by the tool; just confirm and highlight
        const store = useFluxStore.getState();
        const workflowMode = store.workflowMode || 'agile';
        const workflow = getWorkflow(workflowMode);
        const columns = getActiveColumns(workflowMode);

        const defaultStatus = columns[0]?.id || 'backlog';
        const requestedStatus = status || defaultStatus;
        const validStatus = workflow.columns.find(c => c.id === requestedStatus)?.id || defaultStatus;
        const columnName = workflow.columns.find(c => c.id === validStatus)?.title || validStatus;

        // Try to find the created task to highlight it
        const tasks = store.tasks;
        const createdTask = tasks.find(t => t.title === title && t.status === validStatus) 
          || tasks.find(t => t.title === title);

        if (createdTask) {
          // Highlight the new task after a brief delay
          setTimeout(() => {
            const taskElement = document.querySelector(`[data-task-id="${createdTask.id}"]`);
            if (taskElement) {
              taskElement.classList.add('nanocoder-highlight');
              taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              setTimeout(() => taskElement.classList.remove('nanocoder-highlight'), 2000);
            }
          }, 500);
        }

        showVisualToast(`Created task "${title}" in ${columnName}`, 'success');
        break;
      }

      case 'update_task': {
        const { taskId, updates } = action.payload as { taskId: string; updates: Record<string, unknown> };
        const store = useFluxStore.getState();
        // Note: updateTask would need to be implemented in the store
        // For now, if status is being updated, use updateTaskStatus
        if (updates.status) {
          await store.updateTaskStatus(taskId, updates.status as Task['status']);
          showVisualToast('Task updated', 'success');
        }
        break;
      }

      case 'delete_task': {
        // Note: deleteTask would need to be implemented in the store
        showVisualToast('Task deletion not yet implemented', 'info');
        break;
      }

      // ==================
      // Voice
      // ==================
      case 'speak': {
        const { text, priority } = action.payload as { text: string; priority?: string };
        const ttsPriority: TTSPriority = (priority === 'high' || priority === 'low' ? priority : 'normal') as TTSPriority;
        ttsSpeak(text, ttsPriority);
        break;
      }

      case 'stop_speaking': {
        ttsStop();
        break;
      }

      // ==================
      // Selection Tracking
      // ==================
      case 'select_task': {
        const { taskId } = action.payload as { taskId: string | null };
        selectTask(taskId);
        if (taskId) {
          // Highlight the task
          setTimeout(() => {
            const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
            if (taskElement) {
              taskElement.classList.add('nanocoder-highlight');
              taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              setTimeout(() => taskElement.classList.remove('nanocoder-highlight'), 2000);
            }
          }, 100);
          showVisualToast('Task selected', 'info');
        }
        break;
      }

      case 'select_email': {
        const { emailId } = action.payload as { emailId: string | null };
        setSelectedEmail(emailId);
        if (emailId) {
          showVisualToast('Email selected', 'info');
        }
        break;
      }

      case 'select_incident': {
        const { incidentId } = action.payload as { incidentId: string | null };
        setSelectedIncidentId(incidentId);
        if (incidentId) {
          // Highlight the incident
          setTimeout(() => {
            const incidentElement = document.querySelector(`[data-incident-id="${incidentId}"]`);
            if (incidentElement) {
              incidentElement.classList.add('nanocoder-highlight');
              incidentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              setTimeout(() => incidentElement.classList.remove('nanocoder-highlight'), 2000);
            }
          }, 100);
          showVisualToast('Incident selected', 'info');
        }
        break;
      }

      // ==================
      // Incident Operations
      // ==================
      case 'create_incident': {
        const { title, severity } = action.payload as { title: string; severity?: string };
        showVisualToast(`Created incident "${title}" (${severity || 'medium'} severity)`, 'success');
        break;
      }

      case 'update_incident': {
        const { incidentId } = action.payload as { incidentId: string };
        showVisualToast(`Updated incident ${incidentId}`, 'success');
        break;
      }

      case 'resolve_incident': {
        const { incidentId } = action.payload as { incidentId: string };
        showVisualToast(`Resolved incident ${incidentId}`, 'success');
        break;
      }

      // ==================
      // Email Operations
      // ==================
      case 'archive_email': {
        showVisualToast('Email archived', 'success');
        break;
      }

      case 'mark_email_read': {
        const { isRead } = action.payload as { emailId: string; isRead: boolean };
        showVisualToast(`Email marked as ${isRead ? 'read' : 'unread'}`, 'success');
        break;
      }

      case 'star_email': {
        const { isStarred } = action.payload as { emailId: string; isStarred: boolean };
        showVisualToast(`Email ${isStarred ? 'starred' : 'unstarred'}`, 'success');
        break;
      }

      default:
        console.warn('[NanocoderBridge] Unknown action type:', action.type);
    }
  }, [navigate, location.pathname, setTheme, toggleSidebar, setWorkflowMode, setSelectedIncidentId, setSelectedEmail, selectTask, onTerminalOpen, onTerminalClose]);

  // Subscribe to Nanocoder events on mount
  useEffect(() => {
    const unsubscribe = subscribeToNanocoderActions(handleAction);
    console.log('[NanocoderBridge] Subscribed to Nanocoder actions');
    
    return () => {
      unsubscribe();
      console.log('[NanocoderBridge] Unsubscribed from Nanocoder actions');
    };
  }, [handleAction]);

  // This component doesn't render anything visible
  return null;
}

/**
 * Show a visual toast notification
 */
function showVisualToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `nanocoder-toast nanocoder-toast-${type}`;
  toast.textContent = message;
  
  // Style the toast
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    padding: '12px 20px',
    borderRadius: '8px',
    backgroundColor: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1',
    color: 'white',
    fontWeight: '500',
    fontSize: '14px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: '9999',
    animation: 'nanocoder-toast-in 0.3s ease-out',
    maxWidth: '350px',
  });

  document.body.appendChild(toast);

  // Remove after delay
  setTimeout(() => {
    toast.style.animation = 'nanocoder-toast-out 0.3s ease-in';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

export default NanocoderBridge;

