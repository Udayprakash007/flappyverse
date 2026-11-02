"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// Web Audio API Synthesizer for sound effects
class SoundController {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  playFlap() {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(750, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  playScore() {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch {
      // ignore
    }
  }

  playCrash() {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch {
      // ignore
    }
  }
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
}

interface Pipe {
  x: number;
  topHeight: number;
  bottomY: number;
  passed: boolean;
}

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  alpha: number;
}

export default function FlappyVersePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"START" | "PLAYING" | "GAMEOVER">("START");
  const [score, setScore] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const soundRef = useRef<SoundController | null>(null);

  // Gameplay state refs for requestAnimationFrame loop
  const birdRef = useRef({
    x: 80,
    y: 250,
    vy: 0,
    radius: 14,
    rotation: 0,
  });

  const pipesRef = useRef<Pipe[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>([]);
  const frameCountRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const gameStateRef = useRef<"START" | "PLAYING" | "GAMEOVER">("START");

  // Keep refs synced with React state
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      soundRef.current = new SoundController();
      const savedBest = localStorage.getItem("flappyverse_best_score");
      if (savedBest) {
        setBestScore(parseInt(savedBest, 10));
      }
    }
  }, []);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundRef.current?.setMuted(next);
  };

  const createParticles = (x: number, y: number, color: string, count = 8) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1,
        size: Math.random() * 3 + 2,
      });
    }
  };

  const triggerFlap = useCallback(() => {
    if (gameStateRef.current === "START") {
      setGameState("PLAYING");
      gameStateRef.current = "PLAYING";
      birdRef.current.vy = -6.8;
      soundRef.current?.playFlap();
      createParticles(birdRef.current.x - 10, birdRef.current.y, "#00f0ff", 6);
    } else if (gameStateRef.current === "PLAYING") {
      birdRef.current.vy = -6.8;
      soundRef.current?.playFlap();
      createParticles(birdRef.current.x - 10, birdRef.current.y, "#ff007f", 5);
    } else if (gameStateRef.current === "GAMEOVER") {
      // Reset
      birdRef.current.y = 250;
      birdRef.current.vy = 0;
      birdRef.current.rotation = 0;
      pipesRef.current = [];
      particlesRef.current = [];
      scoreRef.current = 0;
      setScore(0);
      setGameState("PLAYING");
      gameStateRef.current = "PLAYING";
      birdRef.current.vy = -6.8;
      soundRef.current?.playFlap();
    }
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        triggerFlap();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [triggerFlap]);

  // Main Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Initialize starry background
    starsRef.current = Array.from({ length: 45 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.8,
      speed: Math.random() * 0.6 + 0.3,
      alpha: Math.random() * 0.8 + 0.2,
    }));

    let animationId: number;

    const render = () => {
      frameCountRef.current++;
      const width = canvas.width;
      const height = canvas.height;

      // 1. Draw Space Gradient
      const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
      skyGradient.addColorStop(0, "#080824");
      skyGradient.addColorStop(0.5, "#10103b");
      skyGradient.addColorStop(1, "#180c38");
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, width, height);

      // 2. Animate Stars
      ctx.fillStyle = "#ffffff";
      starsRef.current.forEach((star) => {
        if (gameStateRef.current === "PLAYING") {
          star.x -= star.speed;
          if (star.x < 0) {
            star.x = width;
            star.y = Math.random() * height;
          }
        }
        ctx.save();
        ctx.globalAlpha = star.alpha;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 3. Game Logic when Playing
      if (gameStateRef.current === "PLAYING") {
        const bird = birdRef.current;
        bird.vy += 0.36; // Gravity
        bird.y += bird.vy;
        bird.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, bird.vy * 0.08));

        // Ground collision & Ceiling collision
        if (bird.y + bird.radius >= height - 20 || bird.y - bird.radius <= 0) {
          soundRef.current?.playCrash();
          createParticles(bird.x, bird.y, "#ff0055", 20);
          setGameState("GAMEOVER");
          gameStateRef.current = "GAMEOVER";
        }

        // Spawn Pipes
        if (frameCountRef.current % 110 === 0) {
          const gap = 135;
          const minPipe = 60;
          const maxPipe = height - gap - minPipe - 40;
          const topHeight = Math.floor(Math.random() * (maxPipe - minPipe)) + minPipe;
          pipesRef.current.push({
            x: width,
            topHeight,
            bottomY: topHeight + gap,
            passed: false,
          });
        }

        // Move Pipes & Check Collision
        const pipeSpeed = 2.4;
        for (let i = pipesRef.current.length - 1; i >= 0; i--) {
          const pipe = pipesRef.current[i];
          pipe.x -= pipeSpeed;

          // Check score
          if (!pipe.passed && pipe.x + 55 < bird.x) {
            pipe.passed = true;
            scoreRef.current += 1;
            setScore(scoreRef.current);
            soundRef.current?.playScore();
            createParticles(bird.x + 10, bird.y, "#00ff88", 10);

            if (scoreRef.current > bestScore) {
              setBestScore(scoreRef.current);
              localStorage.setItem("flappyverse_best_score", scoreRef.current.toString());
            }
          }

          // Pipe Box Collision
          const pipeWidth = 55;
          const inXRange = bird.x + bird.radius > pipe.x && bird.x - bird.radius < pipe.x + pipeWidth;
          const inTopPipe = bird.y - bird.radius < pipe.topHeight;
          const inBottomPipe = bird.y + bird.radius > pipe.bottomY;

          if (inXRange && (inTopPipe || inBottomPipe)) {
            soundRef.current?.playCrash();
            createParticles(bird.x, bird.y, "#ff007f", 25);
            setGameState("GAMEOVER");
            gameStateRef.current = "GAMEOVER";
          }

          // Remove offscreen pipes
          if (pipe.x < -60) {
            pipesRef.current.splice(i, 1);
          }
        }
      }

      // 4. Draw Pipes (Neon Towers)
      pipesRef.current.forEach((pipe) => {
        const pipeWidth = 55;

        // Top Pipe
        const topGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipeWidth, 0);
        topGrad.addColorStop(0, "#9d00ff");
        topGrad.addColorStop(1, "#00f0ff");
        ctx.fillStyle = topGrad;
        ctx.shadowColor = "#00f0ff";
        ctx.shadowBlur = 12;
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight);

        // Top Pipe Cap
        ctx.fillStyle = "#ff007f";
        ctx.fillRect(pipe.x - 3, pipe.topHeight - 16, pipeWidth + 6, 16);

        // Bottom Pipe
        const btmGrad = ctx.createLinearGradient(pipe.x, pipe.bottomY, pipe.x + pipeWidth, pipe.bottomY);
        btmGrad.addColorStop(0, "#00f0ff");
        btmGrad.addColorStop(1, "#9d00ff");
        ctx.fillStyle = btmGrad;
        ctx.shadowColor = "#9d00ff";
        ctx.shadowBlur = 12;
        ctx.fillRect(pipe.x, pipe.bottomY, pipeWidth, height - pipe.bottomY - 20);

        // Bottom Pipe Cap
        ctx.fillStyle = "#ff007f";
        ctx.fillRect(pipe.x - 3, pipe.bottomY, pipeWidth + 6, 16);
      });
      ctx.shadowBlur = 0; // Reset shadow

      // 5. Draw Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.03;
        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 6. Draw Cyber Bird
      const bird = birdRef.current;
      ctx.save();
      ctx.translate(bird.x, bird.y);
      ctx.rotate(bird.rotation);

      // Glow effect
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 16;

      // Body (Neon gradient sphere)
      const birdGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, bird.radius);
      birdGrad.addColorStop(0, "#fffb00");
      birdGrad.addColorStop(0.7, "#ff007f");
      birdGrad.addColorStop(1, "#7b00ff");
      ctx.fillStyle = birdGrad;
      ctx.beginPath();
      ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
      ctx.fill();

      // Cyber Visor / Eye
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 6;
      ctx.fillStyle = "#00f0ff";
      ctx.beginPath();
      ctx.ellipse(5, -3, 6, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wing (Cyber triangle)
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.beginPath();
      ctx.moveTo(-6, 2);
      ctx.lineTo(-15, -4 + (frameCountRef.current % 12 > 6 ? 6 : -3));
      ctx.lineTo(-4, 7);
      ctx.closePath();
      ctx.fill();

      // Beak
      ctx.fillStyle = "#ffaa00";
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(19, 4);
      ctx.lineTo(10, 8);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // 7. Ground / Grid Line
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 10;
      ctx.strokeStyle = "#00f0ff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, height - 20);
      ctx.lineTo(width, height - 20);
      ctx.stroke();

      ctx.fillStyle = "rgba(10, 10, 45, 0.9)";
      ctx.fillRect(0, height - 20, width, 20);
      ctx.shadowBlur = 0;

      // 8. In-Game HUD: Score Display
      if (gameStateRef.current === "PLAYING") {
        ctx.font = "bold 32px monospace";
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#ff007f";
        ctx.shadowBlur = 12;
        ctx.textAlign = "center";
        ctx.fillText(`${scoreRef.current}`, width / 2, 54);
        ctx.shadowBlur = 0;
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [bestScore]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-between px-4 py-8 text-slate-100 select-none">
      {/* Header Section */}
      <header className="flex flex-col items-center gap-2 mb-4 text-center">
        <div className="flex items-center gap-3">
          <span className="text-3xl animate-bounce">⚡</span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] via-[#ff007f] to-[#9d00ff] drop-shadow-[0_0_20px_rgba(0,240,255,0.6)]">
            FLAPPYVERSE
          </h1>
          <span className="text-3xl animate-bounce">⚡</span>
        </div>
        <p className="text-sm sm:text-base text-cyan-300 tracking-wide font-medium">
          Multiverse Arcade Experience • Fly Through Cyber Portals
        </p>
      </header>

      {/* Arcade Game Canvas Container */}
      <main className="relative flex flex-col items-center">
        <div className="relative rounded-2xl p-1 bg-gradient-to-b from-[#00f0ff]/40 via-[#9d00ff]/40 to-[#ff007f]/40 shadow-[0_0_40px_rgba(157,0,255,0.35)]">
          <canvas
            ref={canvasRef}
            width={380}
            height={520}
            onClick={triggerFlap}
            className="rounded-xl cursor-pointer block touch-none max-w-full"
            style={{ width: "380px", height: "520px" }}
          />

          {/* Sound Toggle Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleMute();
            }}
            className="absolute top-4 right-4 bg-slate-900/80 hover:bg-slate-800 text-cyan-400 p-2 rounded-full border border-cyan-500/40 backdrop-blur-md transition-all shadow-lg text-sm"
            title={isMuted ? "Unmute Sound" : "Mute Sound"}
          >
            {isMuted ? "🔇" : "🔊"}
          </button>

          {/* START Overlay */}
          {gameState === "START" && (
            <div
              onClick={triggerFlap}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex flex-col items-center justify-center p-6 rounded-xl cursor-pointer text-center"
            >
              <div className="w-16 h-16 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-3xl mb-4 shadow-[0_0_25px_rgba(0,240,255,0.7)] animate-pulse">
                🚀
              </div>
              <h2 className="text-2xl font-bold text-cyan-300 drop-shadow mb-2">
                READY TO ENTER?
              </h2>
              <p className="text-sm text-slate-300 mb-6">
                Press <span className="px-2 py-1 bg-cyan-950 border border-cyan-500 rounded text-cyan-400 font-mono">SPACE</span> or <span className="text-cyan-400 font-semibold">TAP SCREEN</span> to jump.
              </p>
              <button className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 font-bold rounded-full shadow-[0_0_20px_rgba(255,0,127,0.7)] transition-transform transform hover:scale-105 active:scale-95">
                START FLYING
              </button>
            </div>
          )}

          {/* GAMEOVER Overlay */}
          {gameState === "GAMEOVER" && (
            <div
              onClick={triggerFlap}
              className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center p-6 rounded-xl cursor-pointer text-center"
            >
              <h2 className="text-3xl font-extrabold text-pink-500 drop-shadow-[0_0_15px_rgba(255,0,127,0.8)] mb-4">
                PORTAL CRASHED
              </h2>
              <div className="bg-slate-900/90 border border-purple-500/40 rounded-xl p-4 w-56 mb-6 shadow-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400 text-sm font-semibold">SCORE:</span>
                  <span className="text-2xl font-black text-cyan-400 font-mono">{score}</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-800 pt-2">
                  <span className="text-slate-400 text-sm font-semibold">BEST:</span>
                  <span className="text-2xl font-black text-yellow-400 font-mono">{bestScore}</span>
                </div>
              </div>
              <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 font-bold rounded-full shadow-[0_0_20px_rgba(0,240,255,0.7)] transition-transform transform hover:scale-105 active:scale-95">
                PLAY AGAIN
              </button>
            </div>
          )}
        </div>

        {/* Mobile Tap Button */}
        <div className="mt-4 sm:hidden">
          <button
            onClick={triggerFlap}
            className="w-72 py-3 bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-400/50 rounded-xl font-bold tracking-widest text-cyan-300 active:scale-95 transition-all"
          >
            TAP TO JUMP
          </button>
        </div>
      </main>

      {/* Feature & Multiverse Lore Cards */}
      <footer className="mt-8 max-w-2xl w-full grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
        <div className="p-3 bg-slate-900/50 border border-cyan-500/20 rounded-xl backdrop-blur-sm">
          <div className="text-cyan-400 font-bold text-sm mb-1">🎮 Real-Time Physics</div>
          <p className="text-xs text-slate-400">Smooth 60 FPS gravitational flight engine</p>
        </div>
        <div className="p-3 bg-slate-900/50 border border-pink-500/20 rounded-xl backdrop-blur-sm">
          <div className="text-pink-400 font-bold text-sm mb-1">🔊 Synthesized Audio</div>
          <p className="text-xs text-slate-400">Web Audio API generative arcade sounds</p>
        </div>
        <div className="p-3 bg-slate-900/50 border border-purple-500/20 rounded-xl backdrop-blur-sm">
          <div className="text-purple-400 font-bold text-sm mb-1">🏆 Vault Storage</div>
          <p className="text-xs text-slate-400">Personal high scores saved automatically</p>
        </div>
      </footer>
    </div>
  );
}
