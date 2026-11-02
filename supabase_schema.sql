-- ============================================================
-- FLAPPYVERSE SUPABASE SCHEMA & RLS POLICIES
-- Run this script in the Supabase SQL Editor to set up tables.
-- ============================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  profile_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Games Table
CREATE TABLE IF NOT EXISTS public.games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  creator_name TEXT NOT NULL DEFAULT 'Anonymous',
  description TEXT DEFAULT '',
  is_published BOOLEAN DEFAULT false NOT NULL,
  play_count INTEGER DEFAULT 0 NOT NULL,
  high_score INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Game Configurations Table
CREATE TABLE IF NOT EXISTS public.game_configurations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE UNIQUE NOT NULL,
  character_config JSONB NOT NULL,
  background_config JSONB NOT NULL,
  sound_config JSONB NOT NULL,
  obstacle_config JSONB NOT NULL,
  physics_config JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Assets Table
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('character', 'background', 'audio', 'obstacle')),
  file_url TEXT NOT NULL,
  file_format TEXT,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Game Scores (Leaderboards) Table
CREATE TABLE IF NOT EXISTS public.game_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

-- Games Policies
CREATE POLICY "Public games can be viewed by anyone"
  ON public.games FOR SELECT
  USING (is_published = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own games"
  ON public.games FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own games"
  ON public.games FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own games"
  ON public.games FOR DELETE
  USING (auth.uid() = user_id);

-- Game Configurations Policies
CREATE POLICY "Public configurations can be viewed by anyone"
  ON public.game_configurations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.games g
    WHERE g.id = game_configurations.game_id
    AND (g.is_published = true OR g.user_id = auth.uid())
  ));

CREATE POLICY "Users can insert configuration for own games"
  ON public.game_configurations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update configuration for own games"
  ON public.game_configurations FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.games g
    WHERE g.id = game_configurations.game_id
    AND g.user_id = auth.uid()
  ));

-- Game Scores Policies
CREATE POLICY "Anyone can view high scores"
  ON public.game_scores FOR SELECT
  USING (true);

CREATE POLICY "Anyone can submit a game score"
  ON public.game_scores FOR INSERT
  WITH CHECK (true);

