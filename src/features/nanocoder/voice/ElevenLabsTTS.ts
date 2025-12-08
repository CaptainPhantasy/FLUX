// =====================================
// FLUX - ElevenLabs Premium TTS Service
// =====================================
// High-quality text-to-speech using ElevenLabs API
// Docs: https://elevenlabs.io/docs/api-reference/introduction

export interface ElevenLabsConfig {
  apiKey: string;
  voiceId: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

export type TTSPriority = 'high' | 'normal' | 'low';

interface QueueItem {
  text: string;
  priority: TTSPriority;
}

// Default voice ID provided by user
const DEFAULT_VOICE_ID = '4hf0C7pvEXGjvpjOubbG';
const DEFAULT_MODEL_ID = 'eleven_multilingual_v2';

/**
 * ElevenLabs TTS Service
 * Premium quality text-to-speech
 */
class ElevenLabsTTSService {
  private apiKey: string | null = null;
  private voiceId: string = DEFAULT_VOICE_ID;
  private modelId: string = DEFAULT_MODEL_ID;
  private stability: number = 0.5;
  private similarityBoost: number = 0.75;
  private style: number = 0;
  private useSpeakerBoost: boolean = true;
  
  private queue: QueueItem[] = [];
  private isPlaying = false;
  private currentAudio: HTMLAudioElement | null = null;

  constructor() {
    // Load API key from environment
    this.apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY || null;
    this.voiceId = import.meta.env.VITE_ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;
    
    if (this.apiKey) {
      console.log('[ElevenLabs] TTS service initialized with voice:', this.voiceId);
    } else {
      console.warn('[ElevenLabs] API key not configured - TTS will be disabled');
    }
  }

  /**
   * Check if ElevenLabs is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Configure the service
   */
  configure(config: Partial<ElevenLabsConfig>): void {
    if (config.apiKey) this.apiKey = config.apiKey;
    if (config.voiceId) this.voiceId = config.voiceId;
    if (config.modelId) this.modelId = config.modelId;
    if (config.stability !== undefined) this.stability = config.stability;
    if (config.similarityBoost !== undefined) this.similarityBoost = config.similarityBoost;
    if (config.style !== undefined) this.style = config.style;
    if (config.useSpeakerBoost !== undefined) this.useSpeakerBoost = config.useSpeakerBoost;
  }

  /**
   * Speak text using ElevenLabs TTS
   */
  async speak(text: string, priority: TTSPriority = 'normal'): Promise<void> {
    if (!this.apiKey) {
      console.warn('[ElevenLabs] Cannot speak - API key not configured');
      // Fallback to browser TTS
      this.fallbackSpeak(text);
      return;
    }

    const item: QueueItem = { text, priority };

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
   * Process the speech queue
   */
  private async processQueue(): Promise<void> {
    if (this.isPlaying || this.queue.length === 0) {
      return;
    }

    const item = this.queue.shift()!;
    await this.playText(item.text);
  }

  /**
   * Generate and play audio for text
   */
  private async playText(text: string): Promise<void> {
    if (!this.apiKey) return;

    this.isPlaying = true;

    try {
      console.log('[ElevenLabs] Generating speech for:', text.slice(0, 50) + '...');
      
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: this.modelId,
            voice_settings: {
              stability: this.stability,
              similarity_boost: this.similarityBoost,
              style: this.style,
              use_speaker_boost: this.useSpeakerBoost,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('[ElevenLabs] API error:', error);
        this.isPlaying = false;
        this.processQueue();
        return;
      }

      // Get audio blob
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Play audio
      this.currentAudio = new Audio(audioUrl);
      
      this.currentAudio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        this.isPlaying = false;
        this.processQueue();
      };

      this.currentAudio.onerror = (e) => {
        console.error('[ElevenLabs] Audio playback error:', e);
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        this.isPlaying = false;
        this.processQueue();
      };

      await this.currentAudio.play();
      
    } catch (error) {
      console.error('[ElevenLabs] Error generating speech:', error);
      this.isPlaying = false;
      this.processQueue();
    }
  }

  /**
   * Fallback to browser TTS if ElevenLabs not available
   */
  private fallbackSpeak(text: string): void {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }

  /**
   * Stop current speech
   */
  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.isPlaying = false;
  }

  /**
   * Stop and clear queue
   */
  stopAll(): void {
    this.queue = [];
    this.stop();
  }

  /**
   * Check if currently speaking
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Set voice ID
   */
  setVoice(voiceId: string): void {
    this.voiceId = voiceId;
  }

  /**
   * Set stability (0-1)
   */
  setStability(stability: number): void {
    this.stability = Math.max(0, Math.min(1, stability));
  }

  /**
   * Set similarity boost (0-1)
   */
  setSimilarityBoost(boost: number): void {
    this.similarityBoost = Math.max(0, Math.min(1, boost));
  }
}

// Singleton instance
let instance: ElevenLabsTTSService | null = null;

export function getElevenLabsTTS(): ElevenLabsTTSService {
  if (!instance) {
    instance = new ElevenLabsTTSService();
  }
  return instance;
}

// Convenience functions
export function elevenLabsSpeak(text: string, priority: TTSPriority = 'normal'): void {
  getElevenLabsTTS().speak(text, priority);
}

export function elevenLabsStop(): void {
  getElevenLabsTTS().stop();
}

export function elevenLabsStopAll(): void {
  getElevenLabsTTS().stopAll();
}

export function isElevenLabsConfigured(): boolean {
  return getElevenLabsTTS().isConfigured();
}

export default ElevenLabsTTSService;

