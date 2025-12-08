// @ts-nocheck
// =====================================
// FLUX - Nanocoder Voice Control Widget
// =====================================
// Compact, floating voice control that doesn't block the UI
// Supports continuous listening and auto-submit

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Volume2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNanocoder } from './NanocoderContext';
import { getTextToSpeech } from './voice/TextToSpeech';

interface VoiceControlWidgetProps {
  /** Position of the widget */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Whether to auto-submit after voice capture */
  autoSubmit?: boolean;
  /** Whether to speak responses aloud */
  speakResponses?: boolean;
}

type WidgetState = 'idle' | 'listening' | 'processing' | 'success' | 'error';

export function VoiceControlWidget({
  position = 'bottom-right',
  autoSubmit = true,
  speakResponses = true,
}: VoiceControlWidgetProps) {
  const { state, processCommand } = useNanocoder();
  
  const [widgetState, setWidgetState] = useState<WidgetState>('idle');
  const [isExpanded, setIsExpanded] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isContinuousMode, setIsContinuousMode] = useState(true);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-20 right-6',
    'top-left': 'top-20 left-6',
  };

  // Initialize speech recognition
  const initRecognition = useCallback(() => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setError('Speech recognition not supported');
      return null;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true; // Keep listening
    recognition.interimResults = true; // Show partial results
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('[VoiceWidget] Started listening');
      setWidgetState('listening');
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      // Show interim results in real-time
      if (interimTranscript) {
        setTranscript(interimTranscript);
      }

      // Process final transcript
      if (finalTranscript.trim()) {
        console.log('[VoiceWidget] Final transcript:', finalTranscript);
        const trimmed = finalTranscript.trim();
        setTranscript(trimmed);
        
        // Phase 3.3: Check for interrupt commands
        const interruptCommands = ['stop', 'cancel', 'never mind', 'abort', 'quit', 'exit'];
        const isInterrupt = interruptCommands.some(cmd => 
          trimmed.toLowerCase().includes(cmd)
        );
        
        if (isInterrupt) {
          // Stop current processing and TTS
          getTextToSpeech().stopAll();
          setWidgetState('idle');
          setTranscript('');
          setLastResponse('');
          setError(null);
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
          return;
        }
        
        if (autoSubmit) {
          // Auto-submit the command
          handleCommand(trimmed);
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('[VoiceWidget] Error:', event.error);
      
      if (event.error === 'aborted') {
        // Intentional stop, not an error
        return;
      }
      
      if (event.error === 'no-speech') {
        // No speech detected, restart if in continuous mode
        if (isContinuousMode && isListeningRef.current) {
          setTimeout(() => {
            if (isListeningRef.current) {
              try {
                recognition.start();
              } catch (e) {
                // Already started
              }
            }
          }, 100);
        }
        return;
      }
      
      setError(`Voice error: ${event.error}`);
      setWidgetState('error');
    };

    recognition.onend = () => {
      console.log('[VoiceWidget] Recognition ended');
      
      // Auto-restart in continuous mode
      if (isContinuousMode && isListeningRef.current) {
        setTimeout(() => {
          if (isListeningRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              // Already started or other error
            }
          }
        }, 100);
      } else {
        setWidgetState('idle');
      }
    };

    return recognition;
  }, [autoSubmit, isContinuousMode]);

  // Phase 3.3: Determine tone based on response content
  const determineTone = (response: string): 'casual' | 'urgent' | 'formal' | 'friendly' => {
    const lower = response.toLowerCase();
    if (lower.includes('breach') || lower.includes('urgent') || lower.includes('critical') || lower.includes('immediate')) {
      return 'urgent';
    }
    if (lower.includes('error') || lower.includes('failed') || lower.includes('cannot')) {
      return 'formal';
    }
    if (lower.includes('done') || lower.includes('completed') || lower.includes('success')) {
      return 'casual';
    }
    return 'friendly';
  };

  // Handle command submission
  const handleCommand = async (command: string) => {
    if (!command.trim()) return;
    
    setWidgetState('processing');
    setTranscript(command);
    
    try {
      // Phase 3.3: Start speaking acknowledgment immediately for faster perceived response
      const tts = getTextToSpeech();
      if (speakResponses && state.config.ttsEnabled) {
        // Speak acknowledgment chunk immediately
        tts.speak('Got it', 'normal', { tone: 'friendly' });
      }

      const response = await processCommand(command, 'voice');
      setLastResponse(response);
      setWidgetState('success');
      
      // Phase 3.3: Speak response with contextual tone and streaming
      if (speakResponses && state.config.ttsEnabled) {
        const tone = determineTone(response);
        // Use streaming for faster response
        tts.speakStreaming(response, 'normal', { tone });
      }
      
      // Clear transcript after a delay
      setTimeout(() => {
        setTranscript('');
        if (isListeningRef.current) {
          setWidgetState('listening');
        } else {
          setWidgetState('idle');
        }
      }, 2000);
      
    } catch (err) {
      console.error('[VoiceWidget] Command error:', err);
      setError(err instanceof Error ? err.message : 'Command failed');
      setWidgetState('error');
      
      // Phase 3.3: Speak error with formal tone
      if (speakResponses && state.config.ttsEnabled) {
        const tts = getTextToSpeech();
        const errorMsg = err instanceof Error ? err.message : 'Command failed';
        tts.speak(errorMsg, 'normal', { tone: 'formal' });
      }
      
      setTimeout(() => {
        if (isListeningRef.current) {
          setWidgetState('listening');
        } else {
          setWidgetState('idle');
        }
      }, 3000);
    }
  };

  // Start listening
  const startListening = () => {
    if (!recognitionRef.current) {
      recognitionRef.current = initRecognition();
    }
    
    if (recognitionRef.current) {
      isListeningRef.current = true;
      setIsExpanded(true);
      setTranscript('');
      setError(null);
      
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Already started
      }
    }
  };

  // Stop listening
  const stopListening = () => {
    isListeningRef.current = false;
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    setWidgetState('idle');
  };

  // Toggle listening
  const toggleListening = () => {
    if (isListeningRef.current) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // State-based styling
  const stateColors = {
    idle: 'bg-slate-700 hover:bg-slate-600',
    listening: 'bg-red-500 animate-pulse',
    processing: 'bg-violet-500',
    success: 'bg-emerald-500',
    error: 'bg-red-600',
  };

  const stateIcons = {
    idle: <Mic className="w-6 h-6" />,
    listening: <MicOff className="w-6 h-6" />,
    processing: <Loader2 className="w-6 h-6 animate-spin" />,
    success: <CheckCircle2 className="w-6 h-6" />,
    error: <AlertCircle className="w-6 h-6" />,
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-[9998]`}>
      <AnimatePresence mode="wait">
        {isExpanded ? (
          // Expanded widget with transcript
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="flex flex-col items-end gap-3"
          >
            {/* Transcript/Status Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-900/95 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-slate-700 min-w-[280px] max-w-[350px]"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    widgetState === 'listening' ? 'bg-red-500 animate-pulse' :
                    widgetState === 'processing' ? 'bg-violet-500 animate-pulse' :
                    widgetState === 'success' ? 'bg-emerald-500' :
                    'bg-slate-500'
                  }`} />
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                    {widgetState === 'listening' ? 'Listening...' :
                     widgetState === 'processing' ? 'Processing...' :
                     widgetState === 'success' ? 'Done!' :
                     widgetState === 'error' ? 'Error' :
                     'Voice Control'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    stopListening();
                    setIsExpanded(false);
                  }}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Transcript */}
              <div className="min-h-[60px] mb-3">
                {transcript ? (
                  <p className="text-white text-sm leading-relaxed">
                    "{transcript}"
                  </p>
                ) : widgetState === 'listening' ? (
                  <p className="text-slate-500 text-sm italic">
                    Speak your command...
                  </p>
                ) : lastResponse ? (
                  <p className="text-emerald-400 text-sm">
                    {lastResponse.slice(0, 100)}{lastResponse.length > 100 ? '...' : ''}
                  </p>
                ) : (
                  <p className="text-slate-500 text-sm">
                    Click the mic to start
                  </p>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="text-red-400 text-xs mb-3 p-2 bg-red-900/30 rounded-lg">
                  {error}
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isContinuousMode}
                      onChange={(e) => setIsContinuousMode(e.target.checked)}
                      className="w-3 h-3 rounded accent-violet-500"
                    />
                    Continuous
                  </label>
                </div>
                <div className="text-xs text-slate-500">
                  {state.config.llmProvider}
                </div>
              </div>
            </motion.div>

            {/* Main Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleListening}
              className={`
                w-14 h-14 rounded-full flex items-center justify-center
                text-white shadow-2xl transition-colors
                ${stateColors[widgetState]}
              `}
            >
              {stateIcons[widgetState]}
            </motion.button>
          </motion.div>
        ) : (
          // Collapsed - just the button
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsExpanded(true);
              startListening();
            }}
            className={`
              w-14 h-14 rounded-full flex items-center justify-center
              bg-gradient-to-br from-violet-500 to-fuchsia-500
              text-white shadow-2xl hover:shadow-violet-500/30
              transition-all duration-200
            `}
            title="Voice Control (Click to activate)"
          >
            <Mic className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export default VoiceControlWidget;

