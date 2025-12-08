// =====================================
// FLUX - Text-to-Speech Service
// =====================================
// Read AI responses aloud using Web Speech Synthesis API

export interface TTSOptions {
  voice?: string | null;
  rate?: number;
  pitch?: number;
  volume?: number;
  tone?: 'casual' | 'urgent' | 'formal' | 'friendly'; // Phase 3.3: Contextual tone
}

export type TTSPriority = 'high' | 'normal' | 'low';

interface QueueItem {
  text: string;
  priority: TTSPriority;
  options?: Partial<TTSOptions>;
}

const DEFAULT_OPTIONS: TTSOptions = {
  voice: null,
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  tone: 'friendly',
};

// Tone-based pitch and rate adjustments (Phase 3.3)
const TONE_ADJUSTMENTS: Record<string, { pitch: number; rate: number }> = {
  casual: { pitch: 1.0, rate: 1.1 },
  urgent: { pitch: 1.15, rate: 1.2 },
  formal: { pitch: 0.95, rate: 0.95 },
  friendly: { pitch: 1.05, rate: 1.0 },
};

/**
 * TextToSpeech - Queue-based speech synthesis
 */
class TextToSpeechService {
  private synth: SpeechSynthesis | null = null;
  private options: TTSOptions;
  private queue: QueueItem[] = [];
  private isSpeaking = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voiceCache: SpeechSynthesisVoice[] = [];

  constructor(options: TTSOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
    }
  }

  /**
   * Load available voices
   */
  private loadVoices(): void {
    if (!this.synth) return;

    const loadVoicesFn = () => {
      this.voiceCache = this.synth!.getVoices();
    };

    // Voices might be loaded asynchronously
    loadVoicesFn();
    this.synth.onvoiceschanged = loadVoicesFn;
  }

  /**
   * Get available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    return this.voiceCache;
  }

  /**
   * Get voices filtered by language
   */
  getVoicesByLanguage(lang: string): SpeechSynthesisVoice[] {
    return this.voiceCache.filter(v => v.lang.startsWith(lang));
  }

  /**
   * Find a voice by name
   */
  findVoice(name: string): SpeechSynthesisVoice | undefined {
    return this.voiceCache.find(v => 
      v.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  /**
   * Speak text immediately or add to queue
   * Phase 3.3: Supports streaming (chunking) for faster response
   */
  speak(text: string, priority: TTSPriority = 'normal', options?: Partial<TTSOptions>): void {
    if (!this.synth) {
      console.warn('[TTS] Speech synthesis not supported');
      return;
    }

    // Phase 3.3: Apply tone adjustments
    const tone = options?.tone || this.options.tone || 'friendly';
    const toneAdjust = TONE_ADJUSTMENTS[tone] || TONE_ADJUSTMENTS.friendly;
    const adjustedOptions = {
      ...options,
      pitch: (options?.pitch || this.options.pitch || 1.0) * toneAdjust.pitch,
      rate: (options?.rate || this.options.rate || 1.0) * toneAdjust.rate,
    };

    const item: QueueItem = { text, priority, options: adjustedOptions };

    // High priority: interrupt current speech
    if (priority === 'high') {
      this.stop();
      this.queue.unshift(item);
    } else if (priority === 'low') {
      this.queue.push(item);
    } else {
      // Normal priority: insert after high priority items
      const insertIndex = this.queue.findIndex(q => q.priority !== 'high');
      if (insertIndex === -1) {
        this.queue.push(item);
      } else {
        this.queue.splice(insertIndex, 0, item);
      }
    }

    this.processQueue();
  }

  /**
   * Phase 3.3: Stream text in chunks for faster perceived response
   * Starts speaking first chunk immediately while processing continues
   */
  speakStreaming(text: string, priority: TTSPriority = 'normal', options?: Partial<TTSOptions>): void {
    // Split text into sentences for chunking
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    // Speak first chunk immediately
    if (sentences.length > 0) {
      this.speak(sentences[0], priority, options);
    }

    // Queue remaining chunks
    for (let i = 1; i < sentences.length; i++) {
      this.speak(sentences[i], priority === 'high' ? 'normal' : 'low', options);
    }
  }

  /**
   * Process the speech queue
   */
  private processQueue(): void {
    if (!this.synth || this.isSpeaking || this.queue.length === 0) {
      return;
    }

    const item = this.queue.shift()!;
    this.speakItem(item);
  }

  /**
   * Speak a single queue item
   */
  private speakItem(item: QueueItem): void {
    if (!this.synth) return;

    const mergedOptions = { ...this.options, ...item.options };
    const utterance = new SpeechSynthesisUtterance(item.text);

    // Set voice
    if (mergedOptions.voice) {
      const voice = this.findVoice(mergedOptions.voice);
      if (voice) {
        utterance.voice = voice;
      }
    }

    // Set other options
    utterance.rate = mergedOptions.rate || 1.0;
    utterance.pitch = mergedOptions.pitch || 1.0;
    utterance.volume = mergedOptions.volume || 1.0;

    // Event handlers
    utterance.onstart = () => {
      this.isSpeaking = true;
      this.currentUtterance = utterance;
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      this.processQueue();
    };

    utterance.onerror = (event) => {
      console.error('[TTS] Error:', event.error);
      this.isSpeaking = false;
      this.currentUtterance = null;
      this.processQueue();
    };

    this.synth.speak(utterance);
  }

  /**
   * Stop current speech
   */
  stop(): void {
    if (!this.synth) return;
    
    this.synth.cancel();
    this.isSpeaking = false;
    this.currentUtterance = null;
  }

  /**
   * Stop and clear queue
   */
  stopAll(): void {
    this.queue = [];
    this.stop();
  }

  /**
   * Pause speech
   */
  pause(): void {
    if (!this.synth) return;
    this.synth.pause();
  }

  /**
   * Resume speech
   */
  resume(): void {
    if (!this.synth) return;
    this.synth.resume();
  }

  /**
   * Check if currently speaking
   */
  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  /**
   * Check if speech synthesis is supported
   */
  static isSupported(): boolean {
    return typeof window !== 'undefined' && !!window.speechSynthesis;
  }

  /**
   * Set default options
   */
  setOptions(options: Partial<TTSOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Set voice by name
   */
  setVoice(voiceName: string | null): void {
    this.options.voice = voiceName;
  }

  /**
   * Set speech rate (0.5 - 2.0)
   */
  setRate(rate: number): void {
    this.options.rate = Math.max(0.5, Math.min(2.0, rate));
  }

  /**
   * Set pitch (0.5 - 2.0)
   */
  setPitch(pitch: number): void {
    this.options.pitch = Math.max(0.5, Math.min(2.0, pitch));
  }

  /**
   * Set volume (0 - 1)
   */
  setVolume(volume: number): void {
    this.options.volume = Math.max(0, Math.min(1, volume));
  }
}

// Singleton instance
let instance: TextToSpeechService | null = null;

export function getTextToSpeech(options?: TTSOptions): TextToSpeechService {
  if (!instance) {
    instance = new TextToSpeechService(options);
  }
  return instance;
}

// Convenience functions
export function speak(text: string, priority: TTSPriority = 'normal', options?: Partial<TTSOptions>): void {
  getTextToSpeech().speak(text, priority, options);
}

// Phase 3.3: Streaming speak function
export function speakStreaming(text: string, priority: TTSPriority = 'normal', options?: Partial<TTSOptions>): void {
  getTextToSpeech().speakStreaming(text, priority, options);
}

export function stopSpeaking(): void {
  getTextToSpeech().stop();
}

export function stopAllSpeaking(): void {
  getTextToSpeech().stopAll();
}

export default TextToSpeechService;

