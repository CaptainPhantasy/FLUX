// @ts-nocheck
// =====================================
// FLUX - Voice Controller Service
// =====================================
// Enhanced Web Speech API wrapper for voice input
// Note: Web Speech API types are not always available in TypeScript

export type VoiceEventType = 
  | 'start' 
  | 'end' 
  | 'result' 
  | 'error' 
  | 'audiostart' 
  | 'audioend'
  | 'soundstart'
  | 'soundend';

export interface VoiceEvent {
  type: VoiceEventType;
  transcript?: string;
  confidence?: number;
  isFinal?: boolean;
  error?: string;
}

export type VoiceEventHandler = (event: VoiceEvent) => void;

export interface VoiceControllerOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  wakeWord?: string | null;
}

const DEFAULT_OPTIONS: VoiceControllerOptions = {
  language: 'en-US',
  continuous: false,
  interimResults: true,
  maxAlternatives: 1,
  wakeWord: null,
};

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: typeof SpeechRecognition;
    SpeechRecognition: typeof SpeechRecognition;
  }
}

/**
 * VoiceController - Enhanced voice input using Web Speech API
 */
export class VoiceController {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private options: VoiceControllerOptions;
  private handlers: Map<VoiceEventType, Set<VoiceEventHandler>> = new Map();
  private wakeWordDetected = false;

  constructor(options: VoiceControllerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.initRecognition();
  }

  private initRecognition(): void {
    // Check for browser support
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionClass) {
      console.warn('[VoiceController] Speech recognition not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognitionClass();
    this.recognition.lang = this.options.language || 'en-US';
    this.recognition.continuous = this.options.continuous || false;
    this.recognition.interimResults = this.options.interimResults || true;
    this.recognition.maxAlternatives = this.options.maxAlternatives || 1;

    // Event handlers
    this.recognition.onstart = () => {
      this.isListening = true;
      this.emit({ type: 'start' });
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.emit({ type: 'end' });
      
      // Auto-restart in continuous mode
      if (this.options.continuous && this.recognition) {
        setTimeout(() => {
          if (this.options.continuous) {
            this.start();
          }
        }, 100);
      }
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      const transcript = lastResult[0].transcript.trim();
      const confidence = lastResult[0].confidence;
      const isFinal = lastResult.isFinal;

      // Handle wake word if configured
      if (this.options.wakeWord && !this.wakeWordDetected) {
        const wakeWord = this.options.wakeWord.toLowerCase();
        if (transcript.toLowerCase().includes(wakeWord)) {
          this.wakeWordDetected = true;
          // Remove wake word from transcript
          const cleanedTranscript = transcript
            .toLowerCase()
            .replace(wakeWord, '')
            .trim();
          
          if (cleanedTranscript) {
            this.emit({
              type: 'result',
              transcript: cleanedTranscript,
              confidence,
              isFinal,
            });
          }
        }
        return;
      }

      this.emit({
        type: 'result',
        transcript,
        confidence,
        isFinal,
      });

      // Reset wake word detection after final result
      if (isFinal && this.options.wakeWord) {
        this.wakeWordDetected = false;
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.emit({
        type: 'error',
        error: event.error,
      });

      // Don't log aborted errors (these happen on intentional stop)
      if (event.error !== 'aborted') {
        console.error('[VoiceController] Error:', event.error);
      }
    };

    this.recognition.onaudiostart = () => {
      this.emit({ type: 'audiostart' });
    };

    this.recognition.onaudioend = () => {
      this.emit({ type: 'audioend' });
    };

    this.recognition.onsoundstart = () => {
      this.emit({ type: 'soundstart' });
    };

    this.recognition.onsoundend = () => {
      this.emit({ type: 'soundend' });
    };
  }

  /**
   * Start listening for voice input
   */
  start(): void {
    if (!this.recognition) {
      console.warn('[VoiceController] Speech recognition not available');
      return;
    }

    if (this.isListening) {
      return;
    }

    try {
      this.recognition.start();
    } catch (error) {
      // Already started
      console.warn('[VoiceController] Recognition already started');
    }
  }

  /**
   * Stop listening
   */
  stop(): void {
    if (!this.recognition) return;
    
    this.options.continuous = false;
    this.recognition.stop();
  }

  /**
   * Abort listening immediately
   */
  abort(): void {
    if (!this.recognition) return;
    
    this.options.continuous = false;
    this.recognition.abort();
  }

  /**
   * Check if currently listening
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Check if speech recognition is supported
   */
  static isSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  /**
   * Set continuous mode
   */
  setContinuous(continuous: boolean): void {
    this.options.continuous = continuous;
    if (this.recognition) {
      this.recognition.continuous = continuous;
    }
  }

  /**
   * Set wake word
   */
  setWakeWord(wakeWord: string | null): void {
    this.options.wakeWord = wakeWord;
    this.wakeWordDetected = false;
  }

  /**
   * Set language
   */
  setLanguage(language: string): void {
    this.options.language = language;
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  /**
   * Subscribe to events
   */
  on(eventType: VoiceEventType, handler: VoiceEventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  /**
   * Emit an event
   */
  private emit(event: VoiceEvent): void {
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      handlers.forEach(handler => handler(event));
    }
  }

  /**
   * Destroy the controller
   */
  destroy(): void {
    if (this.recognition) {
      this.recognition.abort();
      this.recognition = null;
    }
    this.handlers.clear();
  }
}

// Singleton instance
let instance: VoiceController | null = null;

export function getVoiceController(options?: VoiceControllerOptions): VoiceController {
  if (!instance) {
    instance = new VoiceController(options);
  }
  return instance;
}

export default VoiceController;

