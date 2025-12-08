// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import FluxCommandTerminal from '@/features/terminal/FluxCommandTerminal';
import { Message } from '../../types';
import { useFluxStore } from '@/lib/store';
import { chatWithAssistant } from '@/services/geminiService';
import BackgroundGradientAnimation from '@/components/ui/BackgroundGradientAnimation';
import { NanocoderBridge, VoiceControlWidget } from '@/features/nanocoder';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui';
import { Menu } from 'lucide-react';

export const AppLayout: React.FC = () => {
  // Initialize the store on mount
  const { initialize, isInitialized, theme, tasks, projects } = useFluxStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    { label: 'Dashboard', path: '/app/dashboard' },
    { label: 'Task Board', path: '/app/board' },
    { label: 'Sprints', path: '/app/sprints' },
    { label: 'Service Desk', path: '/app/service-desk' },
    { label: 'Automation', path: '/app/automation' },
    { label: 'Analytics', path: '/app/analytics' },
    { label: 'Assets', path: '/app/assets' },
    { label: 'Inbox', path: '/app/inbox' },
    { label: 'Documents', path: '/app/documents' },
    { label: 'Appearance', path: '/app/appearance' },
    { label: 'Integrations', path: '/app/integrations' },
    { label: 'Import', path: '/app/import' },
    { label: 'AI Chat', path: '/app/ai' },
    { label: 'Nanocoder', path: '/app/nanocoder' },
    { label: 'Editor', path: '/app/editor' },
    { label: 'Comments', path: '/app/comments' },
  ];
  
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
    <BackgroundGradientAnimation
      containerClassName="h-screen w-screen"
      className="pointer-events-none"
      interactive
    >
      <div className="w-full h-full flex items-stretch text-slate-900 dark:text-slate-100">
        {/* Global Navigation Sheet - Upper Left Trigger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="fixed top-4 left-4 z-50 p-2 rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg hover:bg-white dark:hover:bg-slate-700"
            >
              <Menu size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] sm:w-[320px]">
            <SheetHeader>
              <SheetTitle>Flux Navigation</SheetTitle>
              <SheetDescription>Select a destination</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-1 py-4">
              {navItems.map((item) => (
                <SheetClose asChild key={item.path}>
                  <Button
                    variant="ghost"
                    className="justify-start w-full text-sm"
                    onClick={() => navigate(item.path)}
                  >
                    {item.label}
                  </Button>
                </SheetClose>
              ))}
            </div>
          </SheetContent>
        </Sheet>

        <main className="flex-1 overflow-auto relative z-0 scroll-smooth">
          <Outlet />
        </main>
      </div>

      {/* Nanocoder Bridge - Event-driven UI control */}
      <NanocoderBridge 
        onTerminalOpen={() => setIsTerminalOpen(true)}
        onTerminalClose={() => setIsTerminalOpen(false)}
      />

      {/* Floating Voice Control Widget - Always visible, doesn't block UI */}
      <VoiceControlWidget 
        position="bottom-right"
        autoSubmit={true}
        speakResponses={true}
      />

      {/* Global Overlay - Command Terminal (⌘K) */}
      <FluxCommandTerminal 
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        onQuery={handleTerminalQuery}
        history={terminalHistory}
        isThinking={isThinking}
      />
    </BackgroundGradientAnimation>
  );
};