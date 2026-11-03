"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import confetti from "canvas-confetti";
import { Game } from "../lib/types";
import { GameRenderer, PipeItem } from "../lib/gameRenderer";
import { AudioEngine } from "../lib/audioEngine";
import { Volume2, VolumeX, Maximize2, Minimize2, RotateCcw } from "lucide-react";

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

  // Fullscreen & Responsive dimensions
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width, height });

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
  const frameRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const gameStateRef = useRef<"START" | "PLAYING" | "PAUSED" | "GAMEOVER">("START");
  const lastFlapTimeRef = useRef<number>(0);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    setBestScore(game.highScore || 0);
  }, [game.highScore]);

  // Fullscreen change & window resize listener to fit entire screen on maximize
  useEffect(() => {
    const handleDimensionChange = () => {
      const isFs = !!(
        document.fullscreenElement ||
        (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
      );
      setIsFullscreen(isFs);

      if (isFs) {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      } else {
        setDimensions({ width, height });
      }
    };

    document.addEventListener("fullscreenchange", handleDimensionChange);
    document.addEventListener("webkitfullscreenchange", handleDimensionChange);
    window.addEventListener("resize", handleDimensionChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleDimensionChange);
      document.removeEventListener("webkitfullscreenchange", handleDimensionChange);
      window.removeEventListener("resize", handleDimensionChange);
    };
  }, [width, height]);

  // Initialize Audio & Renderer and preload sounds for 0ms latency
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!audioRef.current) {
        audioRef.current = new AudioEngine();
      }
      audioRef.current.setVolume(game.sounds.volume || 0.85);

      // Preload custom audio buffers
      if (game.sounds.jumpUrl) audioRef.current.preloadAudio(game.sounds.jumpUrl);
      if (game.sounds.scoreUrl) audioRef.current.preloadAudio(game.sounds.scoreUrl);
      if (game.sounds.collisionUrl) audioRef.current.preloadAudio(game.sounds.collisionUrl);
      if (game.sounds.gameoverUrl) audioRef.current.preloadAudio(game.sounds.gameoverUrl);

      if (!rendererRef.current) {
        rendererRef.current = new GameRenderer();
      }
    }
  }, [game.sounds]);

  // Flap / Jump Trigger - Simultaneous sound & physics response (Sparks removed)
  const triggerFlap = useCallback(() => {
    const now = performance.now();
    // Debounce duplicate events within 55ms
    if (now - lastFlapTimeRef.current < 55) return;
    lastFlapTimeRef.current = now;

    const audio = audioRef.current;
    const sounds = game.sounds;
    const physics = game.physics;
    const curH = dimensions.height;
    const curW = dimensions.width;
    const scaleY = curH / 520;

    // Eagerly wake up audio context if suspended
    audio?.resume();

    const jumpVelocity = -(physics.jumpForce || 6.8) * Math.min(1.4, Math.max(0.85, scaleY));

    if (gameStateRef.current === "START") {
      setGameState("PLAYING");
      gameStateRef.current = "PLAYING";
      setIsNewRecord(false);
      birdRef.current.x = Math.max(80, Math.round(curW * 0.22));
      birdRef.current.y = curH / 2;
      birdRef.current.vy = jumpVelocity;
      audio?.playJump(sounds.jumpUrl, sounds.jumpPreset);
      audio?.startBgMusic(sounds.bgMusicUrl);
    } else if (gameStateRef.current === "PLAYING") {
      birdRef.current.vy = jumpVelocity;
      audio?.playJump(sounds.jumpUrl, sounds.jumpPreset);
      // Neon sparks removed per user request
    } else if (gameStateRef.current === "GAMEOVER") {
      // Reset game
      birdRef.current.x = Math.max(80, Math.round(curW * 0.22));
      birdRef.current.y = curH / 2;
      birdRef.current.vy = jumpVelocity;
      pipesRef.current = [];
      scoreRef.current = 0;
      setScore(0);
      setIsNewRecord(false);
      setGameState("PLAYING");
      gameStateRef.current = "PLAYING";
      audio?.playJump(sounds.jumpUrl, sounds.jumpPreset);
      audio?.startBgMusic(sounds.bgMusicUrl);
    }
  }, [game.sounds, game.physics, dimensions.width, dimensions.height]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        if (e.repeat) return; // Prevent key repeat sound lag
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

      const curW = dimensions.width;
      const curH = dimensions.height;
      const scaleY = curH / 520;
      const scaleX = curW / 380;

      // Clean bird radius without artificial neon ring
      const birdRadius = 18 * (game.character.scale || 1.0) * Math.min(1.4, Math.max(0.85, scaleY));

      // 1. Draw Background (Fills entire screen)
      if (renderer) {
        renderer.drawBackground(ctx, curW, curH, game, isPlaying);
      }

      // 2. Game Logic
      if (isPlaying) {
        const bird = birdRef.current;
        bird.x = Math.max(80, Math.round(curW * 0.22));
        bird.vy += (physics.gravity || 0.38) * Math.min(1.4, Math.max(0.85, scaleY));
        bird.y += bird.vy;

        // Ground / Ceiling Collision
        if (bird.y + birdRadius >= curH - 22 || bird.y - birdRadius <= 0) {
          audio?.playCollision(sounds.collisionUrl, sounds.collisionPreset);
          audio?.stopBgMusic();
          setTimeout(() => {
            audio?.playGameOver(sounds.gameoverUrl, sounds.gameoverPreset);
          }, 160);
          setGameState("GAMEOVER");
          gameStateRef.current = "GAMEOVER";
          if (onGameOver) onGameOver(scoreRef.current);
        }

        // Spawn Pipes with adaptive spacing for fullscreen
        const spacing = Math.round((obstacles.spacing || 110) * Math.min(1.3, Math.max(0.8, scaleX * 0.75)));
        if (frameRef.current % spacing === 0) {
          const gap = Math.round((obstacles.gap || 135) * Math.min(1.5, Math.max(0.9, scaleY)));
          const minPipe = Math.round(55 * scaleY);
          const maxPipe = curH - gap - minPipe - 35;
          const topHeight = Math.floor(Math.random() * (maxPipe - minPipe)) + minPipe;
          pipesRef.current.push({
            x: curW,
            topHeight,
            bottomY: topHeight + gap,
            passed: false,
          });
        }

        // Move Pipes & Check Collisions
        const speed = (physics.speed || 2.4) * Math.min(1.8, Math.max(1, scaleX * 0.65 + 0.35));
        const pipeWidth = Math.round((obstacles.width || 55) * Math.min(1.5, Math.max(1, scaleX * 0.65)));

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
          const inX = bird.x + birdRadius > pipe.x && bird.x - birdRadius < pipe.x + pipeWidth;
          const inTop = bird.y - birdRadius < pipe.topHeight;
          const inBtm = bird.y + birdRadius > pipe.bottomY;

          if (inX && (inTop || inBtm)) {
            audio?.playCollision(sounds.collisionUrl, sounds.collisionPreset);
            audio?.stopBgMusic();
            setTimeout(() => {
              audio?.playGameOver(sounds.gameoverUrl, sounds.gameoverPreset);
            }, 160);
            setGameState("GAMEOVER");
            gameStateRef.current = "GAMEOVER";
            if (onGameOver) onGameOver(scoreRef.current);
          }

          // Offscreen cull
          if (pipe.x < -pipeWidth - 40) {
            pipesRef.current.splice(i, 1);
          }
        }
      }

      // 3. Draw Pipes & Obstacles
      if (renderer) {
        renderer.drawPipes(ctx, pipesRef.current, curH, game);
      }

      // 4. Draw Character (Zero neon border, clean photo)
      if (renderer) {
        renderer.drawCharacter(
          ctx,
          birdRef.current.x,
          birdRef.current.y,
          birdRef.current.vy,
          game,
          frameRef.current,
          birdRadius
        );
      }

      // 5. Draw In-Game Score HUD
      if (isPlaying || gameStateRef.current === "PAUSED") {
        const hudSize = Math.round(34 * Math.min(1.4, Math.max(1, scaleY)));
        ctx.font = `bold ${hudSize}px monospace`;
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText(`${scoreRef.current}`, curW / 2, Math.round(52 * scaleY));
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [game, dimensions.width, dimensions.height, bestScore, onGameOver]);

  return (
    <div
      ref={containerRef}
      className={`select-none ${
        isFullscreen
          ? "fixed inset-0 w-screen h-screen z-50 bg-[#060618] flex items-center justify-center p-0 m-0 overflow-hidden"
          : `relative inline-flex flex-col items-center ${className}`
      }`}
    >
      <div
        className={
          isFullscreen
            ? "relative w-full h-full flex items-center justify-center p-0 m-0 bg-[#060618]"
            : "relative rounded-2xl p-1 bg-gradient-to-b from-cyan-400/50 via-purple-600/40 to-pink-500/50 shadow-[0_0_40px_rgba(157,0,255,0.35)]"
        }
      >
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          onPointerDown={(e) => {
            e.preventDefault();
            triggerFlap();
          }}
          className={
            isFullscreen
              ? "cursor-pointer block touch-none w-full h-full object-cover"
              : "rounded-xl cursor-pointer block touch-none"
          }
          style={{
            width: isFullscreen ? "100vw" : `${dimensions.width}px`,
            height: isFullscreen ? "100vh" : `${dimensions.height}px`,
            display: "block",
          }}
        />

        {/* Top Control Bar */}
        <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={toggleMute}
            className="p-2 rounded-full bg-slate-900/85 hover:bg-slate-800 text-cyan-400 border border-cyan-500/40 backdrop-blur-md shadow-md text-xs transition-transform active:scale-90"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={toggleFullscreen}
            className="p-2 rounded-full bg-slate-900/85 hover:bg-slate-800 text-purple-300 border border-purple-500/40 backdrop-blur-md shadow-md text-xs transition-transform active:scale-90"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* START OVERLAY */}
        {gameState === "START" && (
          <div
            onPointerDown={(e) => {
              e.preventDefault();
              triggerFlap();
            }}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20 cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-3xl mb-3 shadow-[0_0_30px_rgba(0,240,255,0.6)] animate-pulse">
              🚀
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-pink-400 mb-1">
              {game.title}
            </h2>
            <p className="text-xs sm:text-sm text-cyan-300/80 font-medium mb-5">By {game.creatorName}</p>
            <p className="text-xs sm:text-sm text-slate-300 mb-6 max-w-xs">
              Press <span className="px-2 py-0.5 bg-cyan-950 border border-cyan-500 rounded text-cyan-400 font-mono">SPACE</span> or <span className="text-cyan-400 font-semibold">TAP</span> to fly!
            </p>
            <button className="px-8 py-3.5 bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 hover:from-pink-600 hover:to-cyan-600 text-white font-extrabold text-sm sm:text-base rounded-full shadow-[0_0_25px_rgba(255,0,127,0.7)] transition-all transform hover:scale-105 active:scale-95">
              START GAME
            </button>
          </div>
        )}

        {/* GAMEOVER OVERLAY */}
        {gameState === "GAMEOVER" && (
          <div
            onPointerDown={(e) => {
              e.preventDefault();
              triggerFlap();
            }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20 cursor-pointer"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-pink-500 drop-shadow-[0_0_20px_rgba(255,0,127,0.8)] mb-3">
              GAME OVER
            </h2>
            {isNewRecord && (
              <span className="text-xs sm:text-sm font-bold px-3 py-1 bg-yellow-500/20 text-yellow-300 border border-yellow-400/50 rounded-full mb-3 shadow-md animate-bounce">
                🎉 NEW HIGH SCORE!
              </span>
            )}
            <div className="bg-slate-900/90 border border-purple-500/40 rounded-xl p-4 w-60 mb-6 shadow-2xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400 text-xs font-semibold">SCORE</span>
                <span className="text-3xl font-black text-cyan-400 font-mono">{score}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-800 pt-2">
                <span className="text-slate-400 text-xs font-semibold">BEST</span>
                <span className="text-2xl font-black text-yellow-400 font-mono">{bestScore}</span>
              </div>
            </div>
            <button className="flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm sm:text-base rounded-full shadow-[0_0_25px_rgba(0,240,255,0.6)] transition-all transform hover:scale-105 active:scale-95">
              <RotateCcw className="w-4 h-4" />
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>

      {/* On-Screen Mobile Jump Button (hidden in fullscreen) */}
      {!isFullscreen && (
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            triggerFlap();
          }}
          className="mt-4 sm:hidden w-full max-w-xs py-3.5 bg-gradient-to-r from-cyan-600/40 to-purple-600/40 hover:from-cyan-600/60 hover:to-purple-600/60 border border-cyan-400/50 rounded-2xl font-black tracking-widest text-cyan-300 shadow-lg active:scale-95 transition-all text-sm"
        >
          TAP TO JUMP ⚡
        </button>
      )}
    </div>
  );
}
