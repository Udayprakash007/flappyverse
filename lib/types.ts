export type GameDifficulty = "easy" | "medium" | "hard" | "custom";
export type BackgroundTheme = "space" | "city" | "mountains" | "beach" | "forest" | "sunset" | "night" | "custom";
export type BackgroundEffect = "stars" | "rain" | "snow" | "clouds" | "none";
export type ObstacleTheme = "neon" | "classic" | "cyber" | "crystals" | "custom";
export type CharacterShape = "circle" | "original" | "neon-glow";

export interface CharacterConfig {
  name: string;
  imageUrl: string; // base64 data URL or external URL
  scale: number; // 0.6 - 1.6
  rotation: number;
  shape: CharacterShape;
  glowColor: string;
}

export interface BackgroundConfig {
  theme: BackgroundTheme;
  customImageUrl?: string;
  effects: BackgroundEffect;
  speed: number;
}

export interface SoundConfig {
  jumpUrl?: string; // base64 or audio URL
  collisionUrl?: string;
  scoreUrl?: string;
  gameoverUrl?: string;
  bgMusicUrl?: string;
  jumpPreset: string;
  collisionPreset: string;
  scorePreset: string;
  gameoverPreset: string;
  volume: number; // 0.0 - 1.0
}

export interface ObstacleConfig {
  theme: ObstacleTheme;
  color: string;
  customImageUrl?: string;
  width: number;
  gap: number;
  spacing: number;
}

export interface PhysicsConfig {
  difficulty: GameDifficulty;
  speed: number;
  gravity: number;
  jumpForce: number;
}

export interface Game {
  id: string;
  title: string;
  slug: string;
  creatorName: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
  playCount: number;
  highScore: number;
  character: CharacterConfig;
  background: BackgroundConfig;
  sounds: SoundConfig;
  obstacles: ObstacleConfig;
  physics: PhysicsConfig;
}
