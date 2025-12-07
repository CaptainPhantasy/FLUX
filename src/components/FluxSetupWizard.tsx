import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Database, HardDrive, Server, ArrowRight, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { DatabaseOptionCard } from './DatabaseOptionCard';

// TYPES
type DbType = 'supabase' | 'postgres' | 'local';
export interface SetupConfig {
  type: DbType;
  url?: string;
  key?: string;
  connectionString?: string;
}

interface FluxSetupWizardProps {
  onComplete: (config: SetupConfig) => void; 
  defaultUrl?: string; 
  defaultKey?: string;
}

// Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

export const FluxSetupWizard: React.FC<FluxSetupWizardProps> = ({ onComplete, defaultUrl, defaultKey }) => {
  const [step, setStep] = useState<'choose' | 'configure' | 'connecting'>('choose');
  const [selectedDb, setSelectedDb] = useState<DbType>('supabase');
  const [config, setConfig] = useState({ url: defaultUrl || '', key: defaultKey || '', connectionString: '' });
  const [error, setError] = useState<string | null>(null);

  // Auto-select if defaults are provided
  useEffect(() => {
    if (defaultUrl && defaultKey) {
      setSelectedDb('supabase');
    }
  }, [defaultUrl, defaultKey]);

  const handleConnect = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Basic validation
    if (selectedDb === 'supabase' && (!config.url || !config.key)) {
      setError("Please provide both URL and API Key.");
      return;
    }
    if (selectedDb === 'postgres' && !config.connectionString) {
      setError("Please provide a valid connection string.");
      return;
    }

    setStep('connecting');
    setError(null);

    // Simulate connection latency
    setTimeout(() => {
      onComplete({
        type: selectedDb,
        url: config.url,
        key: config.key,
        connectionString: config.connectionString
      });
    }, 2000);
  };

  const handleBack = () => {
    setError(null);
    setStep('choose');
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-950 flex items-center justify-center overflow-hidden font-sans text-slate-200">
      
      {/* Ambient Background Glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-violet-900/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[128px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-6xl px-6 flex flex-col items-center">
        
        {/* Header Section */}
        <div className="text-center mb-12 space-y-3">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">
              Initialize <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">Flux</span>
            </h1>
            <p className="text-slate-400 text-lg font-light max-w-lg mx-auto">
              Configure your neural data layer to establish the link.
            </p>
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'choose' && (
            <motion.div 
              key="choose"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full flex flex-col items-center"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                <motion.div variants={itemVariants}>
                  <DatabaseOptionCard
                    id="supabase"
                    title="Flux Cloud"
                    description="Managed infrastructure. Real-time sync, auth, and edge functions included."
                    icon={Database}
                    recommended
                    selected={selectedDb === 'supabase'}
                    onSelect={(id) => setSelectedDb(id as DbType)}
                  />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <DatabaseOptionCard
                    id="postgres"
                    title="Self-Hosted"
                    description="Connect to your own PostgreSQL instance. Full enterprise control."
                    icon={Server}
                    selected={selectedDb === 'postgres'}
                    onSelect={(id) => setSelectedDb(id as DbType)}
                  />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <DatabaseOptionCard
                    id="local"
                    title="Local Mode"
                    description="Offline-first architecture. Data persists on-device via IndexedDB."
                    icon={HardDrive}
                    selected={selectedDb === 'local'}
                    onSelect={(id) => setSelectedDb(id as DbType)}
                  />
                </motion.div>
              </div>

              <motion.div 
                variants={itemVariants} 
                className="mt-12"
              >
                <button 
                  onClick={() => setStep('configure')}
                  className="group relative flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-full font-semibold transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_40px_rgba(124,58,237,0.5)] hover:-translate-y-0.5 active:scale-95"
                >
                  <span className="relative z-10">Continue Configuration</span>
                  <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            </motion.div>
          )}

          {step === 'configure' && (
            <motion.div
              key="configure"
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="w-full max-w-md mx-auto"
            >
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl shadow-black/40">
                {/* Back Button */}
                <button 
                  onClick={handleBack}
                  className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm font-medium transition-colors group"
                >
                  <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                  Back to options
                </button>

                <div className="flex items-center gap-4 border-b border-white/5 pb-6 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-violet-500/20 flex items-center justify-center text-violet-300 ring-1 ring-white/10">
                    {selectedDb === 'supabase' && <Database size={24} />}
                    {selectedDb === 'postgres' && <Server size={24} />}
                    {selectedDb === 'local' && <HardDrive size={24} />}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-xl">
                      {selectedDb === 'supabase' ? 'Connect Cloud' : selectedDb === 'postgres' ? 'Connect Postgres' : 'Local Storage'}
                    </h3>
                    <p className="text-sm text-slate-400">Enter your credentials below.</p>
                  </div>
                </div>

                <form onSubmit={handleConnect} className="space-y-5">
                  {selectedDb === 'supabase' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Project URL</label>
                        <input 
                          type="text" 
                          autoFocus
                          value={config.url}
                          onChange={(e) => setConfig({...config, url: e.target.value})}
                          className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all shadow-inner"
                          placeholder="https://xyz.supabase.co"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Anon Key</label>
                        <input 
                          type="password" 
                          value={config.key}
                          onChange={(e) => setConfig({...config, key: e.target.value})}
                          className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all shadow-inner"
                          placeholder="your-anon-key"
                        />
                      </div>
                    </>
                  )}

                  {selectedDb === 'postgres' && (
                     <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Connection String</label>
                        <input 
                          type="text" 
                          autoFocus
                          value={config.connectionString}
                          onChange={(e) => setConfig({...config, connectionString: e.target.value})}
                          className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all shadow-inner"
                          placeholder="postgresql://user:password@localhost:5432/flux"
                        />
                     </div>
                  )}

                  {selectedDb === 'local' && (
                    <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex gap-3">
                      <div className="shrink-0 text-emerald-400 mt-0.5">
                        <HardDrive size={20} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-emerald-300 font-medium text-sm">Browser Storage Mode</h4>
                        <p className="text-emerald-200/70 text-sm leading-relaxed">
                          Flux will initialize a local SQLite database within your browser. This data is private but will be lost if you clear your browser cache.
                        </p>
                      </div>
                    </div>
                  )}

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex items-center gap-2 text-rose-400 text-sm bg-rose-500/10 p-3 rounded-lg border border-rose-500/20"
                    >
                      <AlertCircle size={16} />
                      {error}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-white hover:bg-slate-200 text-slate-900 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {selectedDb === 'local' ? 'Initialize Repository' : 'Connect Database'}
                    <ArrowRight size={18} />
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {step === 'connecting' && (
            <motion.div
              key="connecting"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center space-y-8 min-h-[400px]"
            >
              <div className="relative">
                {/* Outer pulsing ring */}
                <div className="absolute inset-0 rounded-full border border-violet-500/20 animate-[ping_2s_ease-out_infinite]" />
                <div className="absolute inset-0 rounded-full border border-indigo-500/20 animate-[ping_2s_ease-out_infinite_delay-300ms]" />
                
                {/* Rotating Gradient Spinner */}
                <div className="w-32 h-32 rounded-full border-4 border-transparent border-t-violet-500 border-l-indigo-500 animate-spin" />
                
                {/* Center Logo */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center border border-white/10 shadow-xl">
                    <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                  </div>
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-semibold text-white">
                  Establishing Link
                </h3>
                <p className="text-violet-200/60 font-mono text-sm animate-pulse">
                  &gt; Handshaking with {selectedDb}...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};