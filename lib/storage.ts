import { Game } from "./types";
import { getSupabase, isSupabaseConfigured } from "./supabase";

const DB_NAME = "FlappyVerse_DB";
const STORE_NAME = "games";
const DB_VERSION = 1;

// Default Showcase Avatars (High-quality SVG Data URLs for built-in community games)
export const DEFAULT_AVATARS = {
  cyberHero: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="g" cx="50%" cy="40%" r="50%"><stop offset="0%" stop-color="%23ffeb3b"/><stop offset="70%" stop-color="%23ff007f"/><stop offset="100%" stop-color="%237000ff"/></radialGradient></defs><circle cx="50" cy="50" r="46" fill="url(%23g)" stroke="%2300f0ff" stroke-width="4"/><circle cx="38" cy="42" r="7" fill="%2300f0ff"/><circle cx="62" cy="42" r="7" fill="%2300f0ff"/><ellipse cx="50" cy="42" rx="26" ry="10" fill="none" stroke="%2300f0ff" stroke-width="3"/><path d="M 38 65 Q 50 78 62 65" fill="none" stroke="%23ffffff" stroke-width="4" stroke-linecap="round"/></svg>`,
  spaceDoggo: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23ffb74d" stroke="%23ffe082" stroke-width="4"/><ellipse cx="25" cy="28" rx="10" ry="18" fill="%238d6e63" transform="rotate(-15 25 28)"/><ellipse cx="75" cy="28" rx="10" ry="18" fill="%238d6e63" transform="rotate(15 75 28)"/><circle cx="36" cy="48" r="6" fill="%23212121"/><circle cx="64" cy="48" r="6" fill="%23212121"/><ellipse cx="50" cy="58" rx="9" ry="6" fill="%23d84315"/><ellipse cx="50" cy="55" rx="5" ry="3" fill="%23212121"/><path d="M 44 65 Q 50 72 56 65" fill="none" stroke="%23212121" stroke-width="3" stroke-linecap="round"/></svg>`,
  retroGamer: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%2300e5ff" stroke="%23ff007f" stroke-width="4"/><rect x="22" y="36" width="56" height="18" rx="6" fill="%231a1a2e" stroke="%23ff007f" stroke-width="2"/><circle cx="36" cy="45" r="5" fill="%23ff007f"/><circle cx="64" cy="45" r="5" fill="%23ff007f"/><path d="M 38 70 Q 50 80 62 70" fill="none" stroke="%23ffffff" stroke-width="4" stroke-linecap="round"/></svg>`,
};

// Seed / Initial community showcase games
const SEED_GAMES: Game[] = [
  {
    id: "showcase-cyber-uday",
    title: "Cyber Uday: Neon Odyssey",
    slug: "cyber-uday-neon",
    creatorName: "Uday",
    description: "Flap through hyper-speed cyber pillars with neon thrusters and synthwave beats!",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPublished: true,
    playCount: 1420,
    highScore: 24,
    character: {
      name: "Cyber Uday",
      imageUrl: DEFAULT_AVATARS.cyberHero,
      scale: 1.1,
      rotation: 0,
      shape: "neon-glow",
      glowColor: "#00f0ff",
    },
    background: {
      theme: "space",
      effects: "stars",
      speed: 1.5,
    },
    sounds: {
      jumpPreset: "laser",
      collisionPreset: "explosion",
      scorePreset: "arcade",
      gameoverPreset: "wasted",
      volume: 0.8,
    },
    obstacles: {
      theme: "cyber",
      color: "#00f0ff",
      width: 58,
      gap: 135,
      spacing: 110,
    },
    physics: {
      difficulty: "medium",
      speed: 2.6,
      gravity: 0.38,
      jumpForce: 7.2,
    },
  },
  {
    id: "showcase-space-doggo",
    title: "Space Doggo's Galactic Journey",
    slug: "space-doggo-adventure",
    creatorName: "Alex & Luna",
    description: "A happy cosmic puppy jumping between glowing planetary energy towers.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPublished: true,
    playCount: 980,
    highScore: 18,
    character: {
      name: "Luna the Doggo",
      imageUrl: DEFAULT_AVATARS.spaceDoggo,
      scale: 1.0,
      rotation: 0,
      shape: "circle",
      glowColor: "#ff007f",
    },
    background: {
      theme: "sunset",
      effects: "stars",
      speed: 1.0,
    },
    sounds: {
      jumpPreset: "boing",
      collisionPreset: "bonk",
      scorePreset: "ding",
      gameoverPreset: "wasted",
      volume: 0.85,
    },
    obstacles: {
      theme: "crystals",
      color: "#ff007f",
      width: 52,
      gap: 145,
      spacing: 120,
    },
    physics: {
      difficulty: "easy",
      speed: 2.2,
      gravity: 0.34,
      jumpForce: 6.8,
    },
  },
  {
    id: "showcase-retro-arcade",
    title: "Pixel Runner: 8-Bit Overdrive",
    slug: "pixel-runner-8bit",
    creatorName: "PixelLab",
    description: "Fast-paced arcade challenge with tight gaps and retro synthesizer sound effects.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPublished: true,
    playCount: 2150,
    highScore: 31,
    character: {
      name: "Retro Gamer",
      imageUrl: DEFAULT_AVATARS.retroGamer,
      scale: 1.0,
      rotation: 0,
      shape: "circle",
      glowColor: "#9d00ff",
    },
    background: {
      theme: "city",
      effects: "rain",
      speed: 1.8,
    },
    sounds: {
      jumpPreset: "pop",
      collisionPreset: "oof",
      scorePreset: "chime",
      gameoverPreset: "wasted",
      volume: 0.8,
    },
    obstacles: {
      theme: "neon",
      color: "#9d00ff",
      width: 60,
      gap: 125,
      spacing: 100,
    },
    physics: {
      difficulty: "hard",
      speed: 3.1,
      gravity: 0.42,
      jumpForce: 7.6,
    },
  },
];

// IndexedDB Helper
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      return reject(new Error("IndexedDB requires browser environment"));
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Get all games (both local user games and seed showcase games)
export async function getAllGames(): Promise<Game[]> {
  if (typeof window === "undefined") return SEED_GAMES;
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    return new Promise((resolve) => {
      req.onsuccess = () => {
        const localGames: Game[] = req.result || [];
        // Combine local games with seed showcase games without duplicating IDs
        const localIds = new Set(localGames.map((g) => g.id));
        const combined = [...localGames, ...SEED_GAMES.filter((g) => !localIds.has(g.id))];
        resolve(combined);
      };
      req.onerror = () => resolve(SEED_GAMES);
    });
  } catch {
    return SEED_GAMES;
  }
}

// Get games created by current user
export async function getUserGames(): Promise<Game[]> {
  if (typeof window === "undefined") return [];
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    return new Promise((resolve) => {
      req.onsuccess = () => {
        const games: Game[] = req.result || [];
        // Filter out seed showcase games unless user modified/saved them
        resolve(games.filter((g) => !g.id.startsWith("showcase-")));
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

// Get a specific game by ID or slug
export async function getGameByIdOrSlug(idOrSlug: string): Promise<Game | null> {
  const all = await getAllGames();
  const found = all.find((g) => g.id === idOrSlug || g.slug === idOrSlug);
  if (found) return found;

  // Attempt Supabase lookup if configured
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabase();
      if (supabase) {
        const { data } = await supabase
          .from("games")
          .select("*, game_configurations(*)")
          .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
          .single();

        if (data && data.game_configurations) {
          const cfg = data.game_configurations;
          const remoteGame: Game = {
            id: data.id,
            title: data.title,
            slug: data.slug,
            creatorName: data.creator_name,
            description: data.description || "",
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            isPublished: data.is_published,
            playCount: data.play_count || 0,
            highScore: data.high_score || 0,
            character: cfg.character_config,
            background: cfg.background_config,
            sounds: cfg.sound_config,
            obstacles: cfg.obstacle_config,
            physics: cfg.physics_config,
          };
          // Cache locally
          await saveGame(remoteGame);
          return remoteGame;
        }
      }
    } catch {}
  }

  return null;
}

// Save or update a game
export async function saveGame(game: Game): Promise<Game> {
  const updatedGame = {
    ...game,
    updatedAt: new Date().toISOString(),
  };

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(updatedGame);
  } catch (err) {
    console.error("Failed to save to IndexedDB", err);
  }

  // Sync to Supabase in background if available
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from("games").upsert({
          id: updatedGame.id,
          title: updatedGame.title,
          slug: updatedGame.slug,
          creator_name: updatedGame.creatorName,
          description: updatedGame.description,
          is_published: updatedGame.isPublished,
          play_count: updatedGame.playCount,
          high_score: updatedGame.highScore,
          updated_at: updatedGame.updatedAt,
        });

        await supabase.from("game_configurations").upsert({
          game_id: updatedGame.id,
          character_config: updatedGame.character,
          background_config: updatedGame.background,
          sound_config: updatedGame.sounds,
          obstacle_config: updatedGame.obstacles,
          physics_config: updatedGame.physics,
          updated_at: updatedGame.updatedAt,
        });
      }
    } catch (err) {
      console.warn("Supabase sync optional warning:", err);
    }
  }

  return updatedGame;
}

// Delete game
export async function deleteGame(id: string): Promise<boolean> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);

    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from("games").delete().eq("id", id);
      }
    }
    return true;
  } catch {
    return false;
  }
}

// Duplicate game
export async function duplicateGame(id: string): Promise<Game | null> {
  const original = await getGameByIdOrSlug(id);
  if (!original) return null;

  const newId = `game-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newSlug = `${original.slug}-copy-${Math.floor(Math.random() * 1000)}`;

  const copy: Game = {
    ...original,
    id: newId,
    title: `${original.title} (Copy)`,
    slug: newSlug,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    playCount: 0,
    highScore: 0,
    isPublished: false,
  };

  return await saveGame(copy);
}

// Record play count
export async function recordPlay(id: string): Promise<void> {
  const game = await getGameByIdOrSlug(id);
  if (game) {
    game.playCount = (game.playCount || 0) + 1;
    await saveGame(game);
  }
}

// Record high score
export async function updateHighScore(id: string, score: number): Promise<boolean> {
  const game = await getGameByIdOrSlug(id);
  if (game && score > (game.highScore || 0)) {
    game.highScore = score;
    await saveGame(game);
    return true;
  }
  return false;
}

