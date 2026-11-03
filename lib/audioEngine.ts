// Audio Engine for FlappyVerse
// High-performance, sample-accurate, zero-latency Web Audio API engine
// Features:
// 1. Pre-synthesized AudioBuffers for all presets (0ms CPU/GC overhead on action)
// 2. Intelligent leading silence trimming for custom audio uploads & mic recordings
// 3. Keep-alive silent loop to prevent browser DAC sleep & hardware suspension lag
// 4. Instant PointerDown & KeyDown response with zero async blockage

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bufferCache: Map<string, AudioBuffer> = new Map();
  private presetBuffers: Map<string, AudioBuffer> = new Map();
  private pendingDecodes: Map<string, Promise<AudioBuffer | null>> = new Map();
  private bgMusicSource: AudioBufferSourceNode | null = null;
  private bgMusicGain: GainNode | null = null;
  private keepAliveSource: AudioBufferSourceNode | null = null;
  private volume: number = 0.85;
  private muted: boolean = false;
  private isSynthesizingPresets: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      // Pre-warm audio context and DAC on any earliest interaction
      const warmUp = () => {
        this.initContext();
        this.resume();
        window.removeEventListener("touchstart", warmUp);
        window.removeEventListener("pointerdown", warmUp);
        window.removeEventListener("mousedown", warmUp);
        window.removeEventListener("keydown", warmUp);
      };
      window.addEventListener("touchstart", warmUp, { passive: true });
      window.addEventListener("pointerdown", warmUp, { passive: true });
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
        this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // Keep-alive anti-sleep loop
        this.startKeepAlive();

        // Pre-render preset sound buffers
        this.preSynthesizeAllPresets();
      }
    }
    return this.ctx;
  }

  resume() {
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  // Prevents mobile & desktop audio DAC from entering low-power sleep mode
  private startKeepAlive() {
    if (!this.ctx || this.keepAliveSource) return;
    try {
      // 1 silent sample looped
      const silentBuffer = this.ctx.createBuffer(1, 1, 22050);
      const source = this.ctx.createBufferSource();
      source.buffer = silentBuffer;
      source.loop = true;

      const silentGain = this.ctx.createGain();
      silentGain.gain.setValueAtTime(0.00001, this.ctx.currentTime);

      source.connect(silentGain);
      silentGain.connect(this.ctx.destination);
      source.start(0);
      this.keepAliveSource = source;
    } catch {}
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

  // Pre-synthesize all presets using OfflineAudioContext for instant zero-overhead playback
  private async preSynthesizeAllPresets() {
    if (this.isSynthesizingPresets || typeof window === "undefined") return;
    this.isSynthesizingPresets = true;

    try {
      // Jump presets
      this.presetBuffers.set("flappy", await this.renderPreset(0.08, (ctx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(620, 0);
        osc.frequency.exponentialRampToValueAtTime(220, 0.08);
        gain.gain.setValueAtTime(0.4, 0);
        gain.gain.exponentialRampToValueAtTime(0.001, 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(0);
        osc.stop(0.08);
      }));

      this.presetBuffers.set("boing", await this.renderPreset(0.1, (ctx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(480, 0);
        osc.frequency.linearRampToValueAtTime(780, 0.04);
        osc.frequency.exponentialRampToValueAtTime(320, 0.1);
        gain.gain.setValueAtTime(0.38, 0);
        gain.gain.exponentialRampToValueAtTime(0.001, 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(0);
        osc.stop(0.1);
      }));

      this.presetBuffers.set("laser", await this.renderPreset(0.09, (ctx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(950, 0);
        osc.frequency.exponentialRampToValueAtTime(140, 0.09);
        gain.gain.setValueAtTime(0.28, 0);
        gain.gain.exponentialRampToValueAtTime(0.001, 0.09);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(0);
        osc.stop(0.09);
      }));

      this.presetBuffers.set("wheee", await this.renderPreset(0.12, (ctx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(420, 0);
        osc.frequency.linearRampToValueAtTime(840, 0.08);
        osc.frequency.exponentialRampToValueAtTime(560, 0.12);
        gain.gain.setValueAtTime(0.32, 0);
        gain.gain.exponentialRampToValueAtTime(0.001, 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(0);
        osc.stop(0.12);
      }));

      this.presetBuffers.set("pop", await this.renderPreset(0.04, (ctx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(780, 0);
        osc.frequency.exponentialRampToValueAtTime(120, 0.04);
        gain.gain.setValueAtTime(0.36, 0);
        gain.gain.exponentialRampToValueAtTime(0.001, 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(0);
        osc.stop(0.04);
      }));

      // Score presets
      this.presetBuffers.set("ding", await this.renderPreset(0.22, (ctx) => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(880, 0); // A5
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(1760, 0); // Overtone
        gain.gain.setValueAtTime(0.32, 0);
        gain.gain.exponentialRampToValueAtTime(0.001, 0.22);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start(0);
        osc2.start(0);
        osc1.stop(0.22);
        osc2.stop(0.22);
      }));

      this.presetBuffers.set("arcade", await this.renderPreset(0.18, (ctx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(987.77, 0); // B5
        osc.frequency.setValueAtTime(1318.51, 0.06); // E6
        gain.gain.setValueAtTime(0.25, 0);
        gain.gain.exponentialRampToValueAtTime(0.001, 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(0);
        osc.stop(0.18);
      }));

      this.presetBuffers.set("chime", await this.renderPreset(0.26, (ctx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(659.25, 0); // E5
        osc.frequency.setValueAtTime(830.61, 0.07); // G#5
        osc.frequency.setValueAtTime(1046.5, 0.14); // C6
        gain.gain.setValueAtTime(0.3, 0);
        gain.gain.exponentialRampToValueAtTime(0.001, 0.26);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(0);
        osc.stop(0.26);
      }));

      // Collision presets
      this.presetBuffers.set("bonk", await this.renderPreset(0.18, (ctx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(260, 0);
        osc.frequency.exponentialRampToValueAtTime(40, 0.16);
        gain.gain.setValueAtTime(0.42, 0);
        gain.gain.exponentialRampToValueAtTime(0.001, 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(0);
        osc.stop(0.18);
      }));

      this.presetBuffers.set("oof", await this.renderPreset(0.2, (ctx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(220, 0);
        osc.frequency.exponentialRampToValueAtTime(45, 0.18);
        gain.gain.setValueAtTime(0.45, 0);
        gain.gain.exponentialRampToValueAtTime(0.001, 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(0);
        osc.stop(0.2);
      }));

      this.presetBuffers.set("explosion", await this.renderPreset(0.25, (ctx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(240, 0);
        osc.frequency.exponentialRampToValueAtTime(20, 0.25);
        gain.gain.setValueAtTime(0.44, 0);
        gain.gain.exponentialRampToValueAtTime(0.001, 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(0);
        osc.stop(0.25);
      }));

      // Game Over presets
      this.presetBuffers.set("wasted", await this.renderPreset(0.5, (ctx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(370, 0);
        osc.frequency.linearRampToValueAtTime(330, 0.12);
        osc.frequency.linearRampToValueAtTime(277, 0.24);
        osc.frequency.linearRampToValueAtTime(220, 0.36);
        gain.gain.setValueAtTime(0.34, 0);
        gain.gain.exponentialRampToValueAtTime(0.001, 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(0);
        osc.stop(0.5);
      }));

      this.presetBuffers.set("dramatic", await this.renderPreset(0.5, (ctx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(293.66, 0);
        osc.frequency.exponentialRampToValueAtTime(90, 0.5);
        gain.gain.setValueAtTime(0.4, 0);
        gain.gain.exponentialRampToValueAtTime(0.001, 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(0);
        osc.stop(0.5);
      }));
    } catch (err) {
      console.warn("Could not pre-synthesize audio presets:", err);
    }
  }

  private renderPreset(duration: number, setup: (ctx: OfflineAudioContext) => void): Promise<AudioBuffer> {
    const sampleRate = 44100;
    const length = Math.ceil(sampleRate * duration);
    const offlineCtx = new OfflineAudioContext(1, length, sampleRate);
    setup(offlineCtx);
    return offlineCtx.startRendering();
  }

  // Detects and removes leading dead air/silence from uploaded sounds and mic recordings
  // Ensures audio hits sample 0 with instantaneous attack on action
  private trimLeadingSilence(buffer: AudioBuffer, threshold = 0.012): AudioBuffer {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const length = buffer.length;

    let firstSoundIndex = length;

    for (let c = 0; c < numChannels; c++) {
      const data = buffer.getChannelData(c);
      for (let i = 0; i < length; i++) {
        if (Math.abs(data[i]) > threshold) {
          if (i < firstSoundIndex) {
            firstSoundIndex = i;
          }
          break;
        }
      }
    }

    // If silence is already under 2ms, return original buffer
    const minSilenceSamples = Math.floor(sampleRate * 0.002);
    if (firstSoundIndex <= minSilenceSamples || firstSoundIndex >= length) {
      return buffer;
    }

    // Leave a 2ms tiny headroom before the transient to prevent digital pop
    const trimStart = Math.max(0, firstSoundIndex - minSilenceSamples);
    const newLength = length - trimStart;

    const ctx = this.initContext();
    if (!ctx) return buffer;

    const trimmed = ctx.createBuffer(numChannels, newLength, sampleRate);
    for (let c = 0; c < numChannels; c++) {
      const src = buffer.getChannelData(c);
      const dst = trimmed.getChannelData(c);
      dst.set(src.subarray(trimStart));

      // 2ms micro-fade in
      const fadeLen = Math.min(minSilenceSamples, newLength);
      for (let f = 0; f < fadeLen; f++) {
        dst[f] *= f / fadeLen;
      }
    }

    return trimmed;
  }

  // Pre-decode audio URL into memory buffer and trim leading silence
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

        const res = await fetch(url);
        const arrayBuffer = await res.arrayBuffer();
        const rawBuffer = await ctx.decodeAudioData(arrayBuffer);

        // Strip leading silence so sound is 100% simultaneous with action
        const readyBuffer = this.trimLeadingSilence(rawBuffer);

        this.bufferCache.set(url, readyBuffer);
        return readyBuffer;
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

  // Synchronous, zero-latency playback using AudioBufferSourceNode
  playBuffer(buffer: AudioBuffer, volMultiplier = 1) {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    try {
      const source = ctx.createBufferSource();
      source.buffer = buffer;

      if (volMultiplier !== 1) {
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(volMultiplier, ctx.currentTime);
        source.connect(gain);
        gain.connect(this.masterGain);
      } else {
        source.connect(this.masterGain);
      }

      // Start immediately on this exact audio clock tick
      source.start(ctx.currentTime);
    } catch (err) {
      console.warn("Buffer playback error:", err);
    }
  }

  // Synchronous dispatch: never delays action behind an async decode!
  private playSlot(customUrl: string | undefined, presetKey: string, defaultPreset: string) {
    if (this.muted) return;
    this.resume();

    // 1. If custom audio is cached in memory, play it instantaneously
    if (customUrl) {
      const cached = this.bufferCache.get(customUrl);
      if (cached) {
        this.playBuffer(cached);
        return;
      }
      // If not yet decoded, trigger background decode for future triggers
      this.preloadAudio(customUrl);
    }

    // 2. Play pre-synthesized preset buffer with 0ms delay
    const presetBuffer = this.presetBuffers.get(presetKey) || this.presetBuffers.get(defaultPreset);
    if (presetBuffer) {
      this.playBuffer(presetBuffer);
      return;
    }

    // 3. Last fallback: inline oscillator
    this.inlineBeep(520, 0.08);
  }

  private inlineBeep(freq: number, duration: number) {
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;
    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.4, t + duration);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + duration);
    } catch {}
  }

  // 1. Jump Sound (Instant simultaneous flap sound)
  playJump(customUrl?: string, preset = "boing") {
    this.playSlot(customUrl, preset, "flappy");
  }

  // 2. Score Sound (Instant simultaneous point sound)
  playScore(customUrl?: string, preset = "ding") {
    this.playSlot(customUrl, preset, "ding");
  }

  // 3. Collision Sound (Instant simultaneous impact sound)
  playCollision(customUrl?: string, preset = "bonk") {
    this.playSlot(customUrl, preset, "bonk");
  }

  // 4. Game Over Sound (Play on game end)
  playGameOver(customUrl?: string, preset = "wasted") {
    this.playSlot(customUrl, preset, "wasted");
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

    this.mediaRecorder.start(40);
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
