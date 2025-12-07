import React, { useState } from 'react';
import { generateTasks } from '../services/geminiService';
import { Task } from '../types';

interface AIChatProps {
  onClose: () => void;
}

export const AIChat: React.FC<AIChatProps> = ({ onClose }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<Task[]>([]);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setGeneratedTasks([]); // clear previous
    
    // Simulate slight delay for effect if key is missing, or actual call
    const tasks = await generateTasks(input);
    setGeneratedTasks(tasks);
    setLoading(false);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      <div className="w-full max-w-2xl bg-[#0a0a0a] border border-violet-500/30 rounded-3xl shadow-[0_0_50px_rgba(124,58,237,0.25)] overflow-hidden animate-scale-in flex flex-col max-h-[80vh]">
        
        {/* Modal Header */}
        <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-violet-950/20">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h2 className="text-lg font-semibold text-white">Flux AI Architect</h2>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {!generatedTasks.length && !loading && (
                <div className="flex flex-col items-center justify-center text-center py-10 opacity-60">
                     <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                     </div>
                     <h3 className="text-lg font-medium text-white mb-2">Describe your project</h3>
                     <p className="text-sm text-muted-foreground max-w-sm">
                        Tell Flux what you're building, and our Gemini-powered AI will breakdown the roadmap into actionable tasks.
                     </p>
                </div>
            )}

            {loading && (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 w-full bg-white/5 rounded-2xl animate-pulse relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
                        </div>
                    ))}
                    <p className="text-center text-xs text-violet-300 animate-pulse">Analyzing requirements & generating tasks...</p>
                </div>
            )}

            {generatedTasks.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-violet-300 uppercase tracking-wider mb-4">Suggested Roadmap</h3>
                    {generatedTasks.map((task, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-xl flex gap-4 hover:border-violet-500/50 transition-colors group">
                            <div className="pt-1">
                                <div className="w-5 h-5 rounded-full border border-violet-500/30 flex items-center justify-center">
                                    <div className="w-3 h-3 rounded-full bg-violet-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-white font-medium text-sm">{task.title}</h4>
                                <p className="text-white/50 text-xs mt-1">{task.description}</p>
                                <div className="flex gap-2 mt-3">
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/20 text-violet-200 border border-violet-500/20">{task.priority}</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/70">{task.status}</span>
                                </div>
                            </div>
                            <button className="h-8 w-8 rounded-lg bg-white/5 hover:bg-violet-600 hover:text-white text-white/40 flex items-center justify-center transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Footer Input */}
        <div className="p-6 border-t border-white/10 bg-black/40">
            <div className="relative">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                    placeholder="e.g. 'Marketing launch for a new coffee brand'..." 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                />
                <button 
                    onClick={handleGenerate}
                    disabled={loading || !input}
                    className="absolute right-2 top-2 bottom-2 aspect-square rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:hover:bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-900/50 transition-all"
                >
                    {loading ? (
                         <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                    )}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};