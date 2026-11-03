// Audio Engine for FlappyVerse
// High-performance, sample-accurate, zero-latency Web Audio API engine
// Uses AudioBuffer caching for 0ms delay on custom sounds & synthesized presets

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private bufferCache: Map<string, AudioBuffer> = new Map();
  private pendingDecodes: Map<string, Promise<AudioBuffer | null>> = new Map();
  private masterGain: GainNode | null = null;
  private bgMusicSource: AudioBufferSourceNode | null = null;
  private bgMusicGain: GainNode | null = null;
  private volume: number = 0.85;
  private muted: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      // Pre-warm audio context on any early user interaction
      const warmUp = () => {
        this.initContext();
        window.removeEventListener("touchstart", warmUp);
        window.removeEventListener("mousedown", warmUp);
        window.removeEventListener("keydown", warmUp);
      };
      window.addEventListener("touchstart", warmUp, { passive: true });
      window.addEventListener("mousedown", warmUp, { passive: true });
      window.addEventListener("keydown", warmUp, { passive: true });
    }
  }

  initContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx({ latencyHint: "interactive" });
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
    }
    if (this.bgMusicGain && this.ctx) {
      this.bgMusicGain.gain.setValueAtTime(this.muted ? 0 : this.volume * 0.4, this.ctx.currentTime);
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  // Pre-decode audio URL into memory buffer so playback is instantaneous (0ms lag)
  async preloadAudio(url?: string): Promise<AudioBuffer | null> {
    if (!url) return null;
    if (this.bufferCache.has(url)) {
      return this.bufferCache.get(url)!;
    }
    if (this.pendingDecodes.has(url)) {
      return this.pendingDecodes.get(url)!;
    }

    const decodePromise = (async () => {
      try {
        const ctx = this.initContext();
        if (!ctx) return null;

        let arrayBuffer: ArrayBuffer;
        if (url.startsWith("data:")) {
          // Convert data URL directly to ArrayBuffer
          const res = await fetch(url);
          arrayBuffer = await res.arrayBuffer();
        } else {
          const res = await fetch(url);
          arrayBuffer = await res.arrayBuffer();
        }

        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        this.bufferCache.set(url, audioBuffer);
        return audioBuffer;
      } catch (err) {
        console.warn("Could not decode audio buffer for:", url, err);
        return null;
      } finally {
        this.pendingDecodes.delete(url);
      }
    })();

    this.pendingDecodes.set(url, decodePromise);
    return decodePromise;
  }

  // 0ms Latency Playback via AudioBufferSourceNode
  private playBuffer(buffer: AudioBuffer, volMultiplier = 1) {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    try {
      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volMultiplier, ctx.currentTime);

      source.connect(gain);
      gain.connect(this.masterGain);

      // Start immediately with zero delay
      source.start(0);
    } catch (err) {
      console.warn("Buffer playback error:", err);
    }
  }

  // Play custom sound or fallback
  async playCustomOrSynthesize(
    customUrl: string | undefined,
    synthesizeFallback: () => void,
    volMultiplier = 1
  ) {
    if (this.muted) return;

    if (customUrl) {
      const cached = this.bufferCache.get(customUrl);
      if (cached) {
        this.playBuffer(cached, volMultiplier);
        return;
      }

      // If not yet cached, decode and play immediately
      const decoded = await this.preloadAudio(customUrl);
      if (decoded) {
        this.playBuffer(decoded, volMultiplier);
        return;
      }
    }

    // Synthesizer Fallback
    synthesizeFallback();
  }

  // 1. Jump Sound (Instantaneous on tap / spacebar)
  playJump(customUrl?: string, preset = "boing") {
    this.playCustomOrSynthesize(customUrl, () => {
      const ctx = this.initContext();
      if (!ctx || !this.masterGain) return;

      try {
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        if (preset === "laser") {
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(900, t);
          osc.frequency.exponentialRampToValueAtTime(140, t + 0.1);
        } else if (preset === "wheee") {
          osc.type = "sine";
          osc.frequency.setValueAtTime(280, t);
          osc.frequency.linearRampToValueAtTime(650, t + 0.12);
        } else if (preset === "pop") {
          osc.type = "sine";
          osc.frequency.setValueAtTime(650, t);
          osc.frequency.exponentialRampToValueAtTime(100, t + 0.05);
        } else {
          // default boing
          osc.type = "sine";
          osc.frequency.setValueAtTime(340, t);
          osc.frequency.exponentialRampToValueAtTime(750, t + 0.11);
        }

        gain.gain.setValueAtTime(0.28, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.11);
      } catch {}
    });
  }

  // 2. Score Sound (Instant on passing obstacle)
  playScore(customUrl?: string, preset = "ding") {
    this.playCustomOrSynthesize(customUrl, () => {
      const ctx = this.initContext();
      if (!ctx || !this.masterGain) return;

      try {
        const t = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const gain = ctx.createGain();

        if (preset === "chime") {
          osc1.type = "triangle";
          osc1.frequency.setValueAtTime(523.25, t); // C5
          osc1.frequency.setValueAtTime(659.25, t + 0.07); // E5
          osc1.frequency.setValueAtTime(783.99, t + 0.14); // G5
        } else if (preset === "arcade") {
          osc1.type = "square";
          osc1.frequency.setValueAtTime(440, t);
          osc1.frequency.setValueAtTime(880, t + 0.07);
        } else {
          // default ding
          osc1.type = "sine";
          osc1.frequency.setValueAtTime(600, t);
          osc1.frequency.setValueAtTime(920, t + 0.06);
        }

        gain.gain.setValueAtTime(0.24, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        osc1.connect(gain);
        gain.connect(this.masterGain);

        osc1.start(t);
        osc1.stop(t + 0.22);
      } catch {}
    });
  }

  // 3. Collision Sound (Instant on hit)
  playCollision(customUrl?: string, preset = "bonk") {
    this.playCustomOrSynthesize(customUrl, () => {
      const ctx = this.initContext();
      if (!ctx || !this.masterGain) return;

      try {
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        if (preset === "explosion") {
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(200, t);
          osc.frequency.exponentialRampToValueAtTime(25, t + 0.25);
        } else if (preset === "oof") {
          osc.type = "triangle";
          osc.frequency.setValueAtTime(280, t);
          osc.frequency.exponentialRampToValueAtTime(50, t + 0.16);
        } else {
          // bonk
          osc.type = "square";
          osc.frequency.setValueAtTime(240, t);
          osc.frequency.exponentialRampToValueAtTime(40, t + 0.16);
        }

        gain.gain.setValueAtTime(0.38, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.2);
      } catch {}
    });
  }

  // 4. Game Over Sound
  playGameOver(customUrl?: string, preset = "wasted") {
    this.playCustomOrSynthesize(customUrl, () => {
      const ctx = this.initContext();
      if (!ctx || !this.masterGain) return;

      try {
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(320, t);
        osc.frequency.linearRampToValueAtTime(240, t + 0.14);
        osc.frequency.linearRampToValueAtTime(180, t + 0.28);
        osc.frequency.linearRampToValueAtTime(100, t + 0.5);

        gain.gain.setValueAtTime(0.32, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.55);
      } catch {}
    });
  }

  async startBgMusic(url?: string) {
    if (!url || this.muted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    this.stopBgMusic();

    const buffer = await this.preloadAudio(url);
    if (!buffer) return;

    try {
      this.bgMusicSource = ctx.createBufferSource();
      this.bgMusicSource.buffer = buffer;
      this.bgMusicSource.loop = true;

      this.bgMusicGain = ctx.createGain();
      this.bgMusicGain.gain.setValueAtTime(this.muted ? 0 : this.volume * 0.4, ctx.currentTime);

      this.bgMusicSource.connect(this.bgMusicGain);
      this.bgMusicGain.connect(ctx.destination);

      this.bgMusicSource.start(0);
    } catch {}
  }

  stopBgMusic() {
    if (this.bgMusicSource) {
      try {
        this.bgMusicSource.stop();
        this.bgMusicSource.disconnect();
      } catch {}
      this.bgMusicSource = null;
    }
  }
}

// Microphone voice recorder helper with optimized output
export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async startRecording(): Promise<boolean> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Microphone access is not supported on this device/browser.");
    }
    this.chunks = [];
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });

    let mimeType = "";
    if (MediaRecorder.isTypeSupported("audio/webm")) {
      mimeType = "audio/webm";
    } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
      mimeType = "audio/mp4";
    } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
      mimeType = "audio/ogg";
    }

    this.mediaRecorder = mimeType
      ? new MediaRecorder(this.stream, { mimeType })
      : new MediaRecorder(this.stream);

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.chunks.push(e.data);
      }
    };

    this.mediaRecorder.start(50); // Small chunk slices for prompt data collection
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
