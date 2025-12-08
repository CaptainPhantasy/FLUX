// =====================================
// FLUX - Voice Services
// =====================================

export { VoiceController, getVoiceController } from './VoiceController';
export type { VoiceEvent, VoiceEventType, VoiceEventHandler, VoiceControllerOptions } from './VoiceController';

// Browser TTS (fallback)
export { 
  getTextToSpeech, 
  speak as browserSpeak, 
  stopSpeaking as browserStopSpeaking, 
  stopAllSpeaking as browserStopAllSpeaking,
  default as TextToSpeechService 
} from './TextToSpeech';
export type { TTSOptions, TTSPriority } from './TextToSpeech';

// ElevenLabs Premium TTS (preferred)
export {
  getElevenLabsTTS,
  elevenLabsSpeak,
  elevenLabsStop,
  elevenLabsStopAll,
  isElevenLabsConfigured,
  default as ElevenLabsTTSService,
} from './ElevenLabsTTS';
export type { ElevenLabsConfig } from './ElevenLabsTTS';

// Smart speak function - uses ElevenLabs if configured, else browser TTS
import { isElevenLabsConfigured as checkElevenLabs, elevenLabsSpeak, elevenLabsStop } from './ElevenLabsTTS';
import { speak as browserSpeakFn, stopSpeaking as browserStopFn } from './TextToSpeech';

export function speak(text: string, priority: 'high' | 'normal' | 'low' = 'normal', tone?: 'casual' | 'urgent' | 'formal' | 'friendly'): void {
  if (checkElevenLabs()) {
    elevenLabsSpeak(text, priority);
  } else {
    browserSpeakFn(text, priority, tone ? { tone } : undefined);
  }
}

export function stopSpeaking(): void {
  if (checkElevenLabs()) {
    elevenLabsStop();
  }
  browserStopFn();
}

