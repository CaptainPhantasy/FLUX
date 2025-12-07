// @ts-nocheck
// =====================================
// FLUX - Command Terminal Component
// Style: Theme-Aware (Light/Dark)
// =====================================
// AI-powered command interface accessible via ⌘K

import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendTerminalMessage } from '@/lib/ai';
import { Mic, MicOff } from 'lucide-react';
import type { Message } from '@/types';

interface TerminalProps {
    isOpen: boolean;
    onClose: () => void;
    history: Message[];
    isThinking: boolean;
}

function ThinkingIndicator() {
    return (
        <div className="flex items-center gap-2 px-4 py-3 animate-pulse">
            <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500" />
            </div>
            <span className="text-xs font-mono text-violet-600 dark:text-violet-300 tracking-widest uppercase">
                Flux Agent Processing
            </span>
        </div>
    );
}

export default function FluxCommandTerminal({
    isOpen,
    onClose,
    history,
    isThinking,
}: TerminalProps) {
    const [inputValue, setInputValue] = useState('');
    const [isListening, setIsListening] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
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
    }, [history, isThinking]);

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
        if (!inputValue.trim() || isThinking) return;

        sendTerminalMessage(inputValue);
        setInputValue('');
    };

    const toggleListening = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Speech recognition is not supported in this browser.');
            return;
        }

        if (isListening) {
            // Logic to stop if needed, but usually we just let it run for one sentence
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInputValue(prev => prev ? `${prev} ${transcript}` : transcript);
            setTimeout(() => {
                // Auto send or just let user confirm? User usually prefers to confirm.
                // But if "Natural Language", maybe auto send?
                // Let's keep it manual send for now to avoid errors.
                inputRef.current?.focus();
            }, 100);
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Terminal Container - Light Mode: Clean White / Dark Mode: Deep Slate */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="relative w-full max-w-3xl h-[85vh] sm:h-[600px] flex flex-col bg-card text-card-foreground shadow-2xl rounded-2xl overflow-hidden border border-border"
                    >
                        {/* Header / Status Bar */}
                        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-muted/50">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors cursor-pointer" onClick={onClose} />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                <div className="w-3 h-3 rounded-full bg-green-500/50" />
                            </div>
                            <div className="text-xs font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                FLUX_CONSOLE_V2.0
                            </div>
                            <kbd className="px-2 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted rounded border border-border">
                                ESC
                            </kbd>
                        </div>

                        {/* Scrollable History */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-6 space-y-6 terminal-scroll"
                        >
                            {/* Welcome Message */}
                            {history.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                    <div className="w-16 h-16 mb-6 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                                        <svg className="w-8 h-8 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <p className="font-mono text-sm mb-2 text-slate-900 dark:text-slate-200">Welcome to Flux Terminal</p>
                                    <p className="text-xs text-slate-500 max-w-md text-center">
                                        Try: "create task: Design review" • "show summary" • "clear notifications"
                                    </p>
                                </div>
                            )}

                            {/* Message History */}
                            {history.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] px-4 py-3 rounded-xl font-mono text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${msg.role === 'user'
                                            ? 'bg-white dark:bg-slate-800 text-foreground border border-border'
                                            : 'bg-violet-100 dark:bg-violet-900/30 text-violet-950 dark:text-violet-100 border border-violet-200 dark:border-violet-700'
                                            }`}
                                    >
                                        {msg.role === 'agent' && (
                                            <span className="block text-xs text-violet-600 dark:text-violet-400 mb-1 opacity-70 select-none font-semibold">
                                                {'>'} FLUX
                                            </span>
                                        )}
                                        {msg.content}
                                    </div>
                                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                                        {new Date(msg.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                            ))}

                            {/* Thinking State */}
                            {isThinking && <ThinkingIndicator />}

                            {/* Bottom Spacer */}
                            <div className="h-4" />
                        </div>

                        {/* Input Area */}
                        <div className="relative border-t border-border bg-muted/50">
                            <form onSubmit={handleSubmit} className="relative z-10 flex items-center px-6 py-5">
                                <span className="text-violet-500 mr-4 text-xl font-mono">{'>'}</span>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Type a command..."
                                    disabled={isThinking}
                                    className="flex-1 bg-transparent border-none outline-none text-lg sm:text-xl font-mono text-black dark:text-white placeholder-slate-500 dark:placeholder-slate-400 disabled:opacity-50"
                                    autoComplete="off"
                                    spellCheck="false"
                                />
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={toggleListening}
                                        className={`p-2 rounded-full transition-colors ${isListening
                                            ? 'bg-red-100 text-red-600 animate-pulse'
                                            : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400'
                                            }`}
                                        title="Speak command"
                                    >
                                        {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                                    </button>

                                    {inputValue && (
                                        <motion.button
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            type="submit"
                                            disabled={isThinking}
                                            className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                                        >
                                            Send
                                        </motion.button>
                                    )}
                                    <kbd className="hidden sm:inline-block px-2 py-1 rounded bg-white dark:bg-slate-800 border border-border text-[10px] font-mono text-slate-500">
                                        ENTER
                                    </kbd>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
