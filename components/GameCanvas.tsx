"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import confetti from "canvas-confetti";
import { Game } from "../lib/types";
import { GameRenderer, Particle, PipeItem } from "../lib/gameRenderer";
import { AudioEngine } from "../lib/audioEngine";
import { Volume2, VolumeX, Maximize2, RotateCcw } from "lucide-react";

interface GameCanvasProps {
  game: Game;
  onGameOver?: (finalScore: number) => void;
  width?: number;
  height?: number;
  className?: string;
}

export default function GameCanvas({
  game,
  onGameOver,
  width = 380,
  height = 520,
  className = "",
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [gameState, setGameState] = useState<"START" | "PLAYING" | "PAUSED" | "GAMEOVER">("START");
  const [score, setScore] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(game.highScore || 0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);

  // Engine refs
  const audioRef = useRef<AudioEngine | null>(null);
  const rendererRef = useRef<GameRenderer | null>(null);

  // Gameplay state refs
  const birdRef = useRef({
    x: 80,
    y: height / 2,
    vy: 0,
  });

  const pipesRef = useRef<PipeItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const gameStateRef = useRef<"START" | "PLAYING" | "PAUSED" | "GAMEOVER">("START");

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    setBestScore(game.highScore || 0);
  }, [game.highScore]);

  // Initialize Audio & Renderer
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new AudioEngine();
      audioRef.current.setVolume(game.sounds.volume || 0.8);
      rendererRef.current = new GameRenderer();
    }
  }, [game.sounds.volume]);

  // Flap / Jump Trigger
  const triggerFlap = useCallback(() => {
    const audio = audioRef.current;
    const sounds = game.sounds;
    const physics = game.physics;

    if (gameStateRef.current === "START") {
      setGameState("PLAYING");
      gameStateRef.current = "PLAYING";
      setIsNewRecord(false);
      birdRef.current.vy = -(physics.jumpForce || 6.8);
      audio?.playJump(sounds.jumpUrl, sounds.jumpPreset);
      audio?.startBgMusic(sounds.bgMusicUrl);
    } else if (gameStateRef.current === "PLAYING") {
      birdRef.current.vy = -(physics.jumpForce || 6.8);
      audio?.playJump(sounds.jumpUrl, sounds.jumpPreset);

      // Flap particle burst
      particlesRef.current.push({
        x: birdRef.current.x - 12,
        y: birdRef.current.y,
        vx: -Math.random() * 2 - 1,
        vy: Math.random() * 2 - 1,
        color: game.character.glowColor || "#00f0ff",
        alpha: 1,
        size: Math.random() * 3 + 2,
        life: 20,
      });
    } else if (gameStateRef.current === "GAMEOVER") {
      // Reset game
      birdRef.current.y = height / 2;
      birdRef.current.vy = 0;
      pipesRef.current = [];
      particlesRef.current = [];
      scoreRef.current = 0;
      setScore(0);
      setIsNewRecord(false);
      setGameState("PLAYING");
      gameStateRef.current = "PLAYING";
      birdRef.current.vy = -(physics.jumpForce || 6.8);
      audio?.playJump(sounds.jumpUrl, sounds.jumpPreset);
      audio?.startBgMusic(sounds.bgMusicUrl);
    }
  }, [game.sounds, game.physics, game.character.glowColor, height]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        triggerFlap();
      } else if (e.code === "KeyP") {
        setGameState((prev) => (prev === "PLAYING" ? "PAUSED" : prev === "PAUSED" ? "PLAYING" : prev));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [triggerFlap]);

  // Sound Toggle
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isMuted;
    setIsMuted(next);
    audioRef.current?.setMuted(next);
  };

  // Fullscreen Toggle
  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const physics = game.physics;
    const obstacles = game.obstacles;
    const sounds = game.sounds;

    const render = () => {
      frameRef.current++;
      const isPlaying = gameStateRef.current === "PLAYING";
      const renderer = rendererRef.current;
      const audio = audioRef.current;

      // 1. Draw Background
      if (renderer) {
        renderer.drawBackground(ctx, width, height, game, isPlaying);
      }

      // 2. Game Logic
      if (isPlaying) {
        const bird = birdRef.current;
        bird.vy += physics.gravity || 0.38;
        bird.y += bird.vy;

        // Ground / Ceiling Collision
        const radius = 18 * (game.character.scale || 1.0);
        if (bird.y + radius >= height - 20 || bird.y - radius <= 0) {
          audio?.playCollision(sounds.collisionUrl, sounds.collisionPreset);
          audio?.playGameOver(sounds.gameoverUrl, sounds.gameoverPreset);
          audio?.stopBgMusic();
          setGameState("GAMEOVER");
          gameStateRef.current = "GAMEOVER";
          if (onGameOver) onGameOver(scoreRef.current);
        }

        // Spawn Pipes
        const spacing = obstacles.spacing || 110;
        if (frameRef.current % spacing === 0) {
          const gap = obstacles.gap || 135;
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

        // Move Pipes & Check Collisions
        const speed = physics.speed || 2.4;
        const pipeWidth = obstacles.width || 55;

        for (let i = pipesRef.current.length - 1; i >= 0; i--) {
          const pipe = pipesRef.current[i];
          pipe.x -= speed;

          // Score detection
          if (!pipe.passed && pipe.x + pipeWidth < bird.x) {
            pipe.passed = true;
            scoreRef.current += 1;
            const newScore = scoreRef.current;
            setScore(newScore);
            audio?.playScore(sounds.scoreUrl, sounds.scorePreset);

            // New high score confetti
            if (newScore > bestScore) {
              setBestScore(newScore);
              setIsNewRecord(true);
              confetti({
                particleCount: 25,
                spread: 60,
                origin: { y: 0.6 },
              });
            }
          }

          // Box collision
          const inX = bird.x + radius > pipe.x && bird.x - radius < pipe.x + pipeWidth;
          const inTop = bird.y - radius < pipe.topHeight;
          const inBtm = bird.y + radius > pipe.bottomY;

          if (inX && (inTop || inBtm)) {
            audio?.playCollision(sounds.collisionUrl, sounds.collisionPreset);
            audio?.playGameOver(sounds.gameoverUrl, sounds.gameoverPreset);
            audio?.stopBgMusic();
            setGameState("GAMEOVER");
            gameStateRef.current = "GAMEOVER";
            if (onGameOver) onGameOver(scoreRef.current);
          }

          // Offscreen cull
          if (pipe.x < -pipeWidth - 20) {
            pipesRef.current.splice(i, 1);
          }
        }
      }

      // 3. Draw Pipes & Obstacles
      if (renderer) {
        renderer.drawPipes(ctx, pipesRef.current, height, game);
      }

      // 4. Draw Particles
      if (renderer) {
        renderer.drawParticles(ctx, particlesRef.current);
      }

      // 5. Draw Character
      if (renderer) {
        renderer.drawCharacter(
          ctx,
          birdRef.current.x,
          birdRef.current.y,
          birdRef.current.vy,
          game,
          frameRef.current
        );
      }

      // 6. Draw In-Game Score HUD
      if (isPlaying || gameStateRef.current === "PAUSED") {
        ctx.font = "bold 34px monospace";
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = game.character.glowColor || "#00f0ff";
        ctx.shadowBlur = 12;
        ctx.textAlign = "center";
        ctx.fillText(`${scoreRef.current}`, width / 2, 52);
        ctx.shadowBlur = 0;
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [game, width, height, bestScore, onGameOver]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex flex-col items-center select-none ${className}`}
    >
      <div className="relative rounded-2xl p-1 bg-gradient-to-b from-cyan-400/50 via-purple-600/40 to-pink-500/50 shadow-[0_0_40px_rgba(157,0,255,0.35)]">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onClick={triggerFlap}
          className="rounded-xl cursor-pointer block touch-none"
          style={{ width: `${width}px`, height: `${height}px`, maxWidth: "100%" }}
        />

        {/* Top Control Bar */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 backdrop-blur-md shadow-md text-xs transition-transform active:scale-90"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-purple-300 border border-purple-500/30 backdrop-blur-md shadow-md text-xs transition-transform active:scale-90"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* START OVERLAY */}
        {gameState === "START" && (
          <div
            onClick={triggerFlap}
            className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs flex flex-col items-center justify-center p-6 rounded-xl cursor-pointer text-center animate-fade-in"
          >
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-3xl mb-3 shadow-[0_0_30px_rgba(0,240,255,0.6)] animate-pulse">
              🚀
            </div>
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-pink-400 mb-1">
              {game.title}
            </h2>
            <p className="text-xs text-cyan-300/80 font-medium mb-5">By {game.creatorName}</p>
            <p className="text-xs text-slate-300 mb-6 max-w-xs">
              Press <span className="px-2 py-0.5 bg-cyan-950 border border-cyan-500 rounded text-cyan-400 font-mono">SPACE</span> or <span className="text-cyan-400 font-semibold">TAP</span> to fly!
            </p>
            <button className="px-7 py-3 bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 hover:from-pink-600 hover:to-cyan-600 text-white font-extrabold text-sm rounded-full shadow-[0_0_25px_rgba(255,0,127,0.7)] transition-all transform hover:scale-105 active:scale-95">
              START GAME
            </button>
          </div>
        )}

        {/* GAMEOVER OVERLAY */}
        {gameState === "GAMEOVER" && (
          <div
            onClick={triggerFlap}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 rounded-xl cursor-pointer text-center animate-fade-in"
          >
            <h2 className="text-3xl font-black text-pink-500 drop-shadow-[0_0_20px_rgba(255,0,127,0.8)] mb-3">
              GAME OVER
            </h2>
            {isNewRecord && (
              <span className="text-xs font-bold px-3 py-1 bg-yellow-500/20 text-yellow-300 border border-yellow-400/50 rounded-full mb-3 shadow-md animate-bounce">
                🎉 NEW HIGH SCORE!
              </span>
            )}
            <div className="bg-slate-900/90 border border-purple-500/40 rounded-xl p-4 w-56 mb-6 shadow-2xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400 text-xs font-semibold">SCORE</span>
                <span className="text-3xl font-black text-cyan-400 font-mono">{score}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-800 pt-2">
                <span className="text-slate-400 text-xs font-semibold">BEST</span>
                <span className="text-2xl font-black text-yellow-400 font-mono">{bestScore}</span>
              </div>
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm rounded-full shadow-[0_0_25px_rgba(0,240,255,0.6)] transition-all transform hover:scale-105 active:scale-95">
              <RotateCcw className="w-4 h-4" />
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>

      {/* On-Screen Mobile Jump Button */}
      <button
        onClick={triggerFlap}
        className="mt-4 sm:hidden w-full max-w-xs py-3.5 bg-gradient-to-r from-cyan-600/40 to-purple-600/40 hover:from-cyan-600/60 hover:to-purple-600/60 border border-cyan-400/50 rounded-2xl font-black tracking-widest text-cyan-300 shadow-lg active:scale-95 transition-all text-sm"
      >
        TAP TO JUMP ⚡
      </button>
    </div>
  );
}

