/**
 * Audio synthesis and Speech (TTS) utilities
 */

// Web Audio Context for synthesized sound cues
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a high-quality two-tone chime (ding-dong) for announcements
 */
export function playChime(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Tone 1 (High bell - 659.25 Hz - E5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.6);

    // Tone 2 (Lower bell - 523.25 Hz - C5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(523.25, now + 0.25);
    gain2.gain.setValueAtTime(0.28, now + 0.25);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.25);
    osc2.stop(now + 1.1);
  } catch (err) {
    console.warn('Audio playback not permitted or unavailable:', err);
  }
}

/**
 * Play crisp confirmation beep for 1-click punch register
 */
export function playSuccessBeep(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now); // A5
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.09); // E6
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  } catch (err) {
    console.warn('Audio playback error:', err);
  }
}

/**
 * Play mild alert beep for late arrival
 */
export function playAlertBeep(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(370, now + 0.08);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  } catch (err) {
    console.warn('Audio playback error:', err);
  }
}

/**
 * Play distinct attention chime for Direction notification on late arrival
 */
export function playDirectionAlertSound(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Fast three-pulse chime: G5 -> C6 -> E6
    const freqs = [784, 1046.5, 1318.5];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + idx * 0.12;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.22, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  } catch (err) {
    console.warn('Audio playback error:', err);
  }
}

/**
 * Text-to-Speech Engine utilizing Web Speech API with Portuguese (pt-BR) support
 */
export interface SpeechState {
  isSpeaking: boolean;
  isPaused: boolean;
  currentText: string | null;
  rate: number;
}

class SpeechController {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private rate: number = 1.0;
  private voice: SpeechSynthesisVoice | null = null;
  private listeners: Set<(state: SpeechState) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoice();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoice();
      }
    }
  }

  private loadVoice(): void {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    // Prioritize Brazilian Portuguese voices
    const ptVoice =
      voices.find((v) => v.lang === 'pt-BR' && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Luciana') || v.name.includes('Maria'))) ||
      voices.find((v) => v.lang.toLowerCase().startsWith('pt')) ||
      voices[0];
    if (ptVoice) {
      this.voice = ptVoice;
    }
  }

  public subscribe(listener: (state: SpeechState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((l) => l(state));
  }

  public getState(): SpeechState {
    const isSpeaking = !!this.synth && this.synth.speaking;
    const isPaused = !!this.synth && this.synth.paused;
    return {
      isSpeaking,
      isPaused,
      currentText: this.currentUtterance?.text || null,
      rate: this.rate,
    };
  }

  public setRate(newRate: number): void {
    this.rate = Math.min(2, Math.max(0.5, newRate));
    this.notify();
  }

  public speak(text: string, withChime: boolean = false): void {
    if (!this.synth) {
      console.warn('Speech synthesis not supported in this browser.');
      return;
    }

    // Cancel current speech if any
    this.stop();

    if (withChime) {
      playChime();
      // Delay speech slightly to let chime play
      setTimeout(() => this.executeSpeak(text), 650);
    } else {
      this.executeSpeak(text);
    }
  }

  private executeSpeak(text: string): void {
    if (!this.synth) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    if (this.voice) {
      utterance.voice = this.voice;
    }
    utterance.rate = this.rate;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.notify();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      this.notify();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      this.currentUtterance = null;
      this.notify();
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
    this.notify();
  }

  public pause(): void {
    if (this.synth && this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
      this.notify();
    }
  }

  public resume(): void {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
      this.notify();
    }
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
      this.notify();
    }
  }
}

export const speechController = new SpeechController();
