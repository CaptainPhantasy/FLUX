import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { TerminalProps, Message } from '../types';

const ThinkingIndicator = () => (
  <div className="flex items-center gap-2 px-4 py-3 animate-pulse">
    <div className="relative flex h-3 w-3">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
    </div>
    <span className="text-xs font-mono text-violet-300/80 tracking-widest uppercase">
      Flux Agent Processing
    </span>
  </div>
);

const FluxCommandTerminal: React.FC<TerminalProps> = ({
  isOpen,
  onClose,
  onQuery,
  history,
  isThinking = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure render transition has started
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Auto-scroll to bottom
  useLayoutEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isOpen, isThinking]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    onQuery(inputValue);
    setInputValue('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Main Terminal Container */}
      <div 
        ref={containerRef}
        className="
          relative w-full max-w-3xl h-[85vh] sm:h-[600px] 
          flex flex-col 
          bg-slate-950/80 backdrop-blur-xl 
          border border-white/10 
          rounded-2xl shadow-2xl 
          overflow-hidden
          animate-in fade-in zoom-in-95 duration-200
        "
      >
        {/* Header / Status Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/50" />
          </div>
          <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">
            FLUX_CONSOLE_V2.0
          </div>
        </div>

        {/* Scrollable History Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto terminal-scroll p-6 space-y-6"
        >
          {history.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
              <svg className="w-12 h-12 mb-4 text-violet-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="font-mono text-sm">Waiting for input...</p>
            </div>
          )}

          {history.map((msg) => (
            <div 
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div 
                className={`
                  max-w-[85%] px-4 py-3 rounded-lg font-mono text-sm leading-relaxed
                  ${msg.role === 'user' 
                    ? 'bg-slate-800/50 text-slate-200 border border-white/5' 
                    : 'text-violet-200/90'
                  }
                `}
              >
                {msg.role === 'agent' && (
                  <span className="block text-xs text-violet-500 mb-1 opacity-50 select-none">
                    {'>'} SYSTEM_RESPONSE
                  </span>
                )}
                {msg.content}
              </div>
            </div>
          ))}

          {/* Spacer for sticky bottom interaction to not cover content */}
          <div className="h-12"></div>
        </div>

        {/* Sticky Bottom Section: Thinking & Input */}
        <div className="relative mt-auto border-t border-white/10 bg-slate-900/40">
            
          {/* Violet Radial Glow Effect */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-48 bg-violet-600/20 blur-[120px] rounded-full pointer-events-none" />

          {/* Thinking State */}
          {isThinking && <ThinkingIndicator />}

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="relative z-10 flex items-center px-6 py-6">
            <span className="text-violet-500 mr-4 text-xl font-mono animate-pulse">{'>'}</span>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your command..."
              className="
                flex-1 bg-transparent 
                border-none outline-none 
                text-lg sm:text-xl font-mono text-slate-100 
                placeholder-slate-600/50
              "
              autoComplete="off"
              spellCheck="false"
            />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                <kbd className="hidden sm:inline-block px-2 py-1 rounded bg-slate-800/50 border border-white/5 text-[10px] font-mono text-slate-500">
                    ENTER
                </kbd>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FluxCommandTerminal;
