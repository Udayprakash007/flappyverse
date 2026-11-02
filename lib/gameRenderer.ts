import { Game } from "./types";

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
  life: number;
}

export interface PipeItem {
  x: number;
  topHeight: number;
  bottomY: number;
  passed: boolean;
}

export interface WeatherParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

export class GameRenderer {
  private characterImg: HTMLImageElement | null = null;
  private currentCharacterUrl: string | null = null;

  private bgImg: HTMLImageElement | null = null;
  private currentBgUrl: string | null = null;

  private obstacleImg: HTMLImageElement | null = null;
  private currentObstacleUrl: string | null = null;

  private bgScrollX: number = 0;
  private weatherParticles: WeatherParticle[] = [];

  constructor() {
    this.initWeather(380, 520, "stars");
  }

  initWeather(width: number, height: number, effect: string) {
    this.weatherParticles = [];
    const count = effect === "rain" ? 60 : effect === "snow" ? 45 : effect === "clouds" ? 6 : 40;

    for (let i = 0; i < count; i++) {
      if (effect === "rain") {
        this.weatherParticles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: -0.8,
          vy: Math.random() * 6 + 6,
          size: Math.random() * 2 + 1,
          alpha: Math.random() * 0.5 + 0.3,
        });
      } else if (effect === "snow") {
        this.weatherParticles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: Math.random() * 0.6 - 0.3,
          vy: Math.random() * 1.5 + 0.8,
          size: Math.random() * 3 + 1.5,
          alpha: Math.random() * 0.7 + 0.3,
        });
      } else if (effect === "clouds") {
        this.weatherParticles.push({
          x: Math.random() * width,
          y: Math.random() * (height * 0.4),
          vx: -0.4 - Math.random() * 0.3,
          vy: 0,
          size: Math.random() * 40 + 35,
          alpha: Math.random() * 0.25 + 0.1,
        });
      } else {
        // stars
        this.weatherParticles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: -Math.random() * 0.4 - 0.2,
          vy: 0,
          size: Math.random() * 2 + 0.8,
          alpha: Math.random() * 0.8 + 0.2,
        });
      }
    }
  }

  // Draw background with parallax and effects
  drawBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    game: Game,
    isPlaying: boolean
  ) {
    const bgConfig = game.background;

    // Load custom image if present
    if (bgConfig.customImageUrl && bgConfig.customImageUrl !== this.currentBgUrl) {
      this.currentBgUrl = bgConfig.customImageUrl;
      this.bgImg = new Image();
      this.bgImg.src = bgConfig.customImageUrl;
    }

    if (isPlaying) {
      this.bgScrollX = (this.bgScrollX + (bgConfig.speed || 1)) % width;
    }

    // 1. Draw Custom Background or Theme
    if (bgConfig.customImageUrl && this.bgImg && this.bgImg.complete && this.bgImg.naturalWidth > 0) {
      const scroll = this.bgScrollX;
      ctx.drawImage(this.bgImg, -scroll, 0, width, height);
      ctx.drawImage(this.bgImg, width - scroll, 0, width, height);
    } else {
      this.drawProceduralTheme(ctx, width, height, bgConfig.theme);
    }

    // 2. Draw Weather / Ambient Effects
    this.drawWeatherEffects(ctx, width, height, bgConfig.effects, isPlaying);

    // 3. Ground Layer
    this.drawGround(ctx, width, height, game.obstacles.color || "#00f0ff");
  }

  private drawProceduralTheme(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    theme: string
  ) {
    const grad = ctx.createLinearGradient(0, 0, 0, height);

    switch (theme) {
      case "city":
        grad.addColorStop(0, "#08061a");
        grad.addColorStop(0.5, "#151236");
        grad.addColorStop(1, "#281b4d");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Cyber skyline silhouettes
        ctx.fillStyle = "rgba(10, 8, 30, 0.75)";
        ctx.fillRect(20, height - 160, 45, 140);
        ctx.fillRect(80, height - 200, 55, 180);
        ctx.fillRect(150, height - 130, 60, 110);
        ctx.fillRect(230, height - 220, 50, 200);
        ctx.fillRect(300, height - 170, 55, 150);
        break;

      case "sunset":
        grad.addColorStop(0, "#2c0e37");
        grad.addColorStop(0.4, "#7a1a4c");
        grad.addColorStop(0.8, "#d94b38");
        grad.addColorStop(1, "#fca34d");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Sun
        ctx.fillStyle = "#fffae0";
        ctx.shadowColor = "#fca34d";
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(width * 0.75, height * 0.45, 36, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        break;

      case "mountains":
        grad.addColorStop(0, "#0a192f");
        grad.addColorStop(0.6, "#172a45");
        grad.addColorStop(1, "#203a43");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Mountain Silhouettes
        ctx.fillStyle = "rgba(5, 15, 30, 0.6)";
        ctx.beginPath();
        ctx.moveTo(0, height - 40);
        ctx.lineTo(80, height - 180);
        ctx.lineTo(190, height - 40);
        ctx.lineTo(280, height - 220);
        ctx.lineTo(width, height - 60);
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fill();
        break;

      case "beach":
        grad.addColorStop(0, "#0284c7");
        grad.addColorStop(0.5, "#38bdf8");
        grad.addColorStop(0.85, "#fde047");
        grad.addColorStop(1, "#eab308");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        break;

      case "forest":
        grad.addColorStop(0, "#062817");
        grad.addColorStop(0.6, "#0d4722");
        grad.addColorStop(1, "#1b5e20");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        break;

      case "night":
        grad.addColorStop(0, "#03030a");
        grad.addColorStop(0.5, "#0b0b24");
        grad.addColorStop(1, "#14143a");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Moon
        ctx.fillStyle = "#e0e7ff";
        ctx.shadowColor = "#e0e7ff";
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(width * 0.25, 70, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        break;

      case "space":
      default:
        grad.addColorStop(0, "#050515");
        grad.addColorStop(0.5, "#0c0a28");
        grad.addColorStop(1, "#180d38");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        break;
    }
  }

  private drawWeatherEffects(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    effect: string,
    isPlaying: boolean
  ) {
    if (effect === "none") return;

    ctx.save();
    this.weatherParticles.forEach((p) => {
      if (isPlaying) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y > height - 20) p.y = 0;
        if (p.y < 0) p.y = height - 20;
      }

      ctx.globalAlpha = p.alpha;
      if (effect === "rain") {
        ctx.strokeStyle = "#00f0ff";
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - 2, p.y + 10);
        ctx.stroke();
      } else if (effect === "snow") {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (effect === "clouds") {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.arc(p.x + p.size * 0.5, p.y - 10, p.size * 0.7, 0, Math.PI * 2);
        ctx.arc(p.x + p.size, p.y, p.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // stars
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();
  }

  private drawGround(ctx: CanvasRenderingContext2D, width: number, height: number, color: string) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, height - 20);
    ctx.lineTo(width, height - 20);
    ctx.stroke();

    ctx.fillStyle = "rgba(8, 8, 26, 0.95)";
    ctx.fillRect(0, height - 20, width, 20);
    ctx.restore();
  }

  // Draw obstacles (Pipes / Custom Pillars)
  drawPipes(
    ctx: CanvasRenderingContext2D,
    pipes: PipeItem[],
    height: number,
    game: Game
  ) {
    const obstacleConfig = game.obstacles;
    const width = obstacleConfig.width || 55;
    const color = obstacleConfig.color || "#00f0ff";

    if (obstacleConfig.customImageUrl && obstacleConfig.customImageUrl !== this.currentObstacleUrl) {
      this.currentObstacleUrl = obstacleConfig.customImageUrl;
      this.obstacleImg = new Image();
      this.obstacleImg.src = obstacleConfig.customImageUrl;
    }

    pipes.forEach((pipe) => {
      ctx.save();

      if (this.obstacleImg && this.obstacleImg.complete && this.obstacleImg.naturalWidth > 0) {
        // Draw custom image obstacle
        ctx.drawImage(this.obstacleImg, pipe.x, 0, width, pipe.topHeight);
        ctx.drawImage(this.obstacleImg, pipe.x, pipe.bottomY, width, height - pipe.bottomY - 20);
      } else if (obstacleConfig.theme === "crystals") {
        // Crystal Spikes
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;

        // Top spike
        ctx.beginPath();
        ctx.moveTo(pipe.x, 0);
        ctx.lineTo(pipe.x + width, 0);
        ctx.lineTo(pipe.x + width * 0.5, pipe.topHeight);
        ctx.closePath();
        ctx.fill();

        // Bottom spike
        ctx.beginPath();
        ctx.moveTo(pipe.x, height - 20);
        ctx.lineTo(pipe.x + width, height - 20);
        ctx.lineTo(pipe.x + width * 0.5, pipe.bottomY);
        ctx.closePath();
        ctx.fill();
      } else if (obstacleConfig.theme === "classic") {
        // Retro Arcade Pipes
        ctx.fillStyle = "#22c55e";
        ctx.strokeStyle = "#14532d";
        ctx.lineWidth = 3;
        ctx.fillRect(pipe.x, 0, width, pipe.topHeight);
        ctx.strokeRect(pipe.x, 0, width, pipe.topHeight);
        ctx.fillRect(pipe.x - 4, pipe.topHeight - 20, width + 8, 20);
        ctx.strokeRect(pipe.x - 4, pipe.topHeight - 20, width + 8, 20);

        ctx.fillRect(pipe.x, pipe.bottomY, width, height - pipe.bottomY - 20);
        ctx.strokeRect(pipe.x, pipe.bottomY, width, height - pipe.bottomY - 20);
        ctx.fillRect(pipe.x - 4, pipe.bottomY, width + 8, 20);
        ctx.strokeRect(pipe.x - 4, pipe.bottomY, width + 8, 20);
      } else {
        // Neon / Cyber Pillars
        const grad = ctx.createLinearGradient(pipe.x, 0, pipe.x + width, 0);
        grad.addColorStop(0, color);
        grad.addColorStop(1, "#9d00ff");

        ctx.fillStyle = grad;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;

        // Top
        ctx.fillRect(pipe.x, 0, width, pipe.topHeight);
        ctx.fillStyle = "#ff007f";
        ctx.fillRect(pipe.x - 3, pipe.topHeight - 16, width + 6, 16);

        // Bottom
        ctx.fillStyle = grad;
        ctx.fillRect(pipe.x, pipe.bottomY, width, height - pipe.bottomY - 20);
        ctx.fillStyle = "#ff007f";
        ctx.fillRect(pipe.x - 3, pipe.bottomY, width + 6, 16);
      }
      ctx.restore();
    });
  }

  // Draw the customized character with user photo, rotation, and wing flapping
  drawCharacter(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    vy: number,
    game: Game,
    frame: number
  ) {
    const char = game.character;
    const radius = 18 * (char.scale || 1.0);
    const rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, vy * 0.08));

    // Load photo if changed
    if (char.imageUrl && char.imageUrl !== this.currentCharacterUrl) {
      this.currentCharacterUrl = char.imageUrl;
      this.characterImg = new Image();
      this.characterImg.src = char.imageUrl;
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation + (char.rotation ? (char.rotation * Math.PI) / 180 : 0));

    // 1. Cyber Wing / Thruster Flapping behind character
    const wingFlap = Math.sin(frame * 0.3) * 6;
    ctx.fillStyle = char.glowColor || "#00f0ff";
    ctx.shadowColor = char.glowColor || "#00f0ff";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.4, 0);
    ctx.lineTo(-radius * 1.3, -radius * 0.5 + wingFlap);
    ctx.lineTo(-radius * 0.7, radius * 0.6);
    ctx.closePath();
    ctx.fill();

    // 2. Character Photo or Avatar
    if (this.characterImg && this.characterImg.complete && this.characterImg.naturalWidth > 0) {
      ctx.shadowColor = char.glowColor || "#00f0ff";
      ctx.shadowBlur = 14;

      if (char.shape === "circle" || char.shape === "neon-glow") {
        // Circular mask with glowing ring
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(this.characterImg, -radius, -radius, radius * 2, radius * 2);
        ctx.restore();

        // Glowing border ring
        ctx.strokeStyle = char.glowColor || "#00f0ff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Original cropped image
        ctx.drawImage(this.characterImg, -radius, -radius, radius * 2, radius * 2);
      }
    } else {
      // Fallback glowing neon bird
      ctx.shadowColor = char.glowColor || "#00f0ff";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#ffeb3b";
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Draw particle system
  drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.025;

      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

