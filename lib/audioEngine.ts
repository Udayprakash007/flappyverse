// Audio Engine for FlappyVerse
// Supports Web Audio API synthesis presets, custom audio playback, and microphone recording

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private customAudios: Map<string, HTMLAudioElement> = new Map();
  private bgMusicAudio: HTMLAudioElement | null = null;
  private volume: number = 0.8;
  private muted: boolean = false;

  constructor() {
    // Lazy initialized on user gesture
  }

  private initContext() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.bgMusicAudio) {
      this.bgMusicAudio.volume = this.volume * 0.5;
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.bgMusicAudio) {
      this.bgMusicAudio.muted = muted;
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  private playCustomAudio(url: string, volMultiplier = 1) {
    if (this.muted) return;
    try {
      let audio = this.customAudios.get(url);
      if (!audio) {
        audio = new Audio(url);
        this.customAudios.set(url, audio);
      }
      audio.currentTime = 0;
      audio.volume = this.volume * volMultiplier;
      audio.play().catch(() => {});
    } catch {
      // Audio autoplay policy fallback
    }
  }

  playJump(customUrl?: string, preset = "boing") {
    if (this.muted) return;
    if (customUrl) {
      this.playCustomAudio(customUrl);
      return;
    }
    this.initContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      if (preset === "laser") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(150, t + 0.12);
      } else if (preset === "wheee") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(250, t);
        osc.frequency.linearRampToValueAtTime(600, t + 0.14);
      } else if (preset === "pop") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.05);
      } else {
        // default boing
        osc.type = "sine";
        osc.frequency.setValueAtTime(320, t);
        osc.frequency.exponentialRampToValueAtTime(700, t + 0.12);
      }

      gain.gain.setValueAtTime(0.25 * this.volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    } catch {}
  }

  playScore(customUrl?: string, preset = "ding") {
    if (this.muted) return;
    if (customUrl) {
      this.playCustomAudio(customUrl);
      return;
    }
    this.initContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      if (preset === "chime") {
        osc1.type = "triangle";
        osc1.frequency.setValueAtTime(523.25, t); // C5
        osc1.frequency.setValueAtTime(659.25, t + 0.08); // E5
        osc1.frequency.setValueAtTime(783.99, t + 0.16); // G5
      } else if (preset === "arcade") {
        osc1.type = "square";
        osc1.frequency.setValueAtTime(440, t);
        osc1.frequency.setValueAtTime(880, t + 0.08);
      } else {
        // default ding
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(587.33, t); // D5
        osc1.frequency.setValueAtTime(880, t + 0.07); // A5
      }

      gain.gain.setValueAtTime(0.22 * this.volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc1.connect(gain);
      gain.connect(this.ctx.destination);
      osc1.start(t);
      osc1.stop(t + 0.25);
    } catch {}
  }

  playCollision(customUrl?: string, preset = "bonk") {
    if (this.muted) return;
    if (customUrl) {
      this.playCustomAudio(customUrl);
      return;
    }
    this.initContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      if (preset === "explosion") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.28);
      } else if (preset === "oof") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(260, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.18);
      } else {
        // bonk
        osc.type = "square";
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.18);
      }

      gain.gain.setValueAtTime(0.35 * this.volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.22);
    } catch {}
  }

  playGameOver(customUrl?: string, preset = "wasted") {
    if (this.muted) return;
    if (customUrl) {
      this.playCustomAudio(customUrl);
      return;
    }
    this.initContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.linearRampToValueAtTime(220, t + 0.15);
      osc.frequency.linearRampToValueAtTime(160, t + 0.3);
      osc.frequency.linearRampToValueAtTime(100, t + 0.55);

      gain.gain.setValueAtTime(0.3 * this.volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.6);
    } catch {}
  }

  startBgMusic(url?: string) {
    if (!url || this.muted) return;
    try {
      if (this.bgMusicAudio) {
        this.bgMusicAudio.pause();
      }
      this.bgMusicAudio = new Audio(url);
      this.bgMusicAudio.loop = true;
      this.bgMusicAudio.volume = this.volume * 0.4;
      this.bgMusicAudio.play().catch(() => {});
    } catch {}
  }

  stopBgMusic() {
    if (this.bgMusicAudio) {
      this.bgMusicAudio.pause();
      this.bgMusicAudio.currentTime = 0;
    }
  }
}

// Microphone voice recorder helper
export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async startRecording(): Promise<boolean> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Microphone access is not supported on this browser.");
    }
    this.chunks = [];
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Choose optimal mimeType
    let mimeType = "";
    if (MediaRecorder.isTypeSupported("audio/webm")) {
      mimeType = "audio/webm";
    } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
      mimeType = "audio/mp4";
    } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
      mimeType = "audio/ogg";
    }

    this.mediaRecorder = mimeType ? new MediaRecorder(this.stream, { mimeType }) : new MediaRecorder(this.stream);

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.chunks.push(e.data);
      }
    };

    this.mediaRecorder.start();
    return true;
  }

  stopRecording(): Promise<{ blob: Blob; dataUrl: string }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        return reject(new Error("No active recording found."));
      }

      this.mediaRecorder.onstop = () => {
        const mime = this.chunks[0]?.type || "audio/webm";
        const blob = new Blob(this.chunks, { type: mime });
        const reader = new FileReader();
        reader.onloadend = () => {
          // Stop stream tracks to turn off mic indicator
          if (this.stream) {
            this.stream.getTracks().forEach((track) => track.stop());
            this.stream = null;
          }
          resolve({ blob, dataUrl: reader.result as string });
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      };

      this.mediaRecorder.stop();
    });
  }
}

