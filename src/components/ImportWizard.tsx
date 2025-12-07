// @ts-nocheck
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { ImportState, ImportSource, WizardStep } from '../types';
import { StepSource } from './steps/StepSource';
import { StepAuth } from './steps/StepAuth';
import { StepMapping } from './steps/StepMapping';
import { StepProgress } from './steps/StepProgress';

interface ImportWizardProps {
  onClose: () => void;
}

export const ImportWizard: React.FC<ImportWizardProps> = ({ onClose }) => {
  const [step, setStep] = useState<WizardStep>(WizardStep.SOURCE);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<ImportState>({
    source: null,
    apiKey: '',
    mappings: {},
  });

  const nextStep = () => {
    if (step < WizardStep.IMPORT) {
      setDirection(1);
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (step > WizardStep.SOURCE && step !== WizardStep.IMPORT) {
      setDirection(-1);
      setStep(prev => prev - 1);
    }
  };

  const updateData = (partial: Partial<ImportState>) => {
    setData(prev => ({ ...prev, ...partial }));
  };

  const steps = [
    { id: WizardStep.SOURCE, label: 'Select Source' },
    { id: WizardStep.AUTH, label: 'Authentication' },
    { id: WizardStep.MAPPING, label: 'Map Fields' },
    { id: WizardStep.IMPORT, label: 'Importing' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" 
        onClick={step !== WizardStep.IMPORT ? onClose : undefined} 
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl bg-slate-900/90 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header & Stepper */}
        <div className="px-8 pt-8 pb-6 border-b border-white/5 bg-white/5 relative z-10">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Import Data</h2>
              <p className="text-slate-400 text-sm mt-1">Migrate your tasks and history to Flux</p>
            </div>
            {step !== WizardStep.IMPORT && (
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Stepper Component */}
          <div className="flex items-center justify-between relative max-w-2xl mx-auto">
             {/* Track Line */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-700 -translate-y-1/2 z-0">
               <motion.div 
                 className="h-full bg-violet-500 origin-left"
                 initial={{ scaleX: 0 }}
                 animate={{ scaleX: (step - 1) / (steps.length - 1) }}
                 transition={{ duration: 0.4, ease: "easeInOut" }}
               />
            </div>

            {steps.map((s) => {
              const isActive = s.id === step;
              const isCompleted = s.id < step;
              
              return (
                <div key={s.id} className="relative z-10 flex flex-col items-center gap-3 group cursor-default">
                  <motion.div 
                    animate={{
                      backgroundColor: isActive ? '#7c3aed' : isCompleted ? '#7c3aed' : '#1e293b',
                      borderColor: isActive || isCompleted ? '#8b5cf6' : '#475569',
                      scale: isActive ? 1.1 : 1,
                    }}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors duration-300
                      ${isActive ? 'shadow-[0_0_15px_rgba(124,58,237,0.5)]' : ''}`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-400'}`}>{s.id}</span>
                    )}
                  </motion.div>
                  <span className={`text-xs font-medium absolute top-10 whitespace-nowrap transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-400'}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative min-h-[400px] p-8">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              initial={{ x: direction * 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction * -50, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full flex flex-col"
            >
              {step === WizardStep.SOURCE && (
                <StepSource 
                  selected={data.source} 
                  onSelect={(s) => updateData({ source: s })} 
                  onNext={nextStep}
                />
              )}
              {step === WizardStep.AUTH && (
                <StepAuth 
                  source={data.source!} 
                  apiKey={data.apiKey}
                  onChange={(key) => updateData({ apiKey: key })}
                  onBack={prevStep}
                  onNext={nextStep}
                />
              )}
              {step === WizardStep.MAPPING && (
                <StepMapping 
                  source={data.source!}
                  initialMappings={data.mappings}
                  onSave={(m) => { updateData({ mappings: m }); nextStep(); }}
                  onBack={prevStep}
                />
              )}
              {step === WizardStep.IMPORT && (
                <StepProgress 
                  source={data.source!} 
                  onComplete={() => console.log('Done')}
                  onClose={onClose}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};