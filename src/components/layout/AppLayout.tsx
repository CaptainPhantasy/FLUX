import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import FluxSidebar from '../FluxSidebar'; // Using the advanced sidebar
import FluxCommandTerminal from '../FluxCommandTerminal';
import { Message } from '../../types';

export const AppLayout: React.FC = () => {
  // Global Terminal State
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);

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

  const handleTerminalQuery = useCallback((text: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    setTerminalHistory((prev) => [...prev, userMsg]);
    setIsThinking(true);

    // Mock AI Response - In real app, connect to geminiService here
    setTimeout(() => {
      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: `Executing command: "${text}". \nSystem optimization complete.`,
        timestamp: Date.now(),
      };
      setTerminalHistory((prev) => [...prev, agentMsg]);
      setIsThinking(false);
    }, 1500);
  }, []);

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