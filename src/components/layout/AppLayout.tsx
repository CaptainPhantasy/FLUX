import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import FluxSidebar from '../sidebar/FluxSidebar';
import FluxCommandTerminal from '../FluxCommandTerminal';
import { Message } from '../../types';
import { useFluxStore } from '@/lib/store';
import { chatWithAssistant } from '@/services/geminiService';

export const AppLayout: React.FC = () => {
  // Initialize the store on mount
  const { initialize, isInitialized, theme, tasks, projects } = useFluxStore();
  
  // Global Terminal State
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);

  // Initialize store on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize('local');
    }
  }, [initialize, isInitialized]);

  // Apply theme on mount and when it changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);

  // Toggle Terminal with Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsTerminalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTerminalQuery = useCallback(async (text: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    setTerminalHistory((prev) => [...prev, userMsg]);
    setIsThinking(true);

    try {
      // Call AI service with context from store
      const response = await chatWithAssistant(text, { tasks, projects });
      
      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: response,
        timestamp: Date.now(),
      };
      setTerminalHistory((prev) => [...prev, agentMsg]);
    } catch (error) {
      console.error('[AppLayout] Terminal AI error:', error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: Date.now(),
      };
      setTerminalHistory((prev) => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  }, [tasks, projects]);

  return (
    <div className="flex h-screen w-screen bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-100">
      
      {/* 1. Global Navigation */}
      <FluxSidebar />

      {/* 2. Page Content */}
      <main className="flex-1 overflow-auto relative z-0 scroll-smooth">
        <div className="p-4 md:p-6 lg:p-8 mx-auto max-w-[1600px] animate-fade-in">
           <Outlet />
        </div>
      </main>

      {/* 3. Global Overlay - Command Terminal */}
      <FluxCommandTerminal 
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        onQuery={handleTerminalQuery}
        history={terminalHistory}
        isThinking={isThinking}
      />
    </div>
  );
};