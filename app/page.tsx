"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import GameCanvas from "../components/GameCanvas";
import QRCodeModal from "../components/QRCodeModal";
import { Game } from "../lib/types";
import { getAllGames, getUserGames, deleteGame, duplicateGame } from "../lib/storage";
import {
  Sparkles,
  PlusCircle,
  Compass,
  Trophy,
  Play,
  Share2,
  Copy,
  Trash2,
  Edit,
  Camera,
  Mic,
  QrCode,
  Flame,
  ArrowRight,
  FolderHeart,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [userGames, setUserGames] = useState<Game[]>([]);
  const [featuredGame, setFeaturedGame] = useState<Game | null>(null);
  const [selectedShareGame, setSelectedShareGame] = useState<Game | null>(null);

  useEffect(() => {
    getAllGames().then((games) => {
      setAllGames(games);
      if (games.length > 0) {
        setFeaturedGame(games[0]);
      }
    });

    getUserGames().then((myGames) => {
      setUserGames(myGames);
    });
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this game?")) {
      await deleteGame(id);
      setUserGames((prev) => prev.filter((g) => g.id !== id));
      setAllGames((prev) => prev.filter((g) => g.id !== id));
    }
  };

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const copy = await duplicateGame(id);
    if (copy) {
      setUserGames((prev) => [copy, ...prev]);
      setAllGames((prev) => [copy, ...prev]);
    }
  };

  return (
    <div className="min-h-screen bg-[#060618] text-slate-100 flex flex-col selection:bg-pink-500 selection:text-white">
      <Navbar />

      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 px-4 sm:px-6 lg:px-8 border-b border-purple-900/30">
        {/* Ambient Glow Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headlines & Call to Actions (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 border border-cyan-400/40 text-cyan-300 text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(0,240,255,0.3)] animate-pulse">
              <Sparkles className="w-4 h-4 text-pink-400" />
              The Next-Gen Personalized Arcade Platform
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
              Your Friends.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-500 to-purple-400 drop-shadow-[0_0_25px_rgba(255,0,127,0.5)]">
                Your Photos.
              </span>{" "}
              Your Sounds.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-300">
                Your Game.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-xl font-medium leading-relaxed">
              Turn your favorite people, photos, and sounds into your own playable arcade game. Create it, play it, and challenge your friends with instant shareable links!
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                href="/studio"
                className="flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-500 hover:from-cyan-400 hover:via-purple-500 hover:to-pink-400 rounded-full font-black text-base text-white shadow-[0_0_30px_rgba(0,240,255,0.6)] hover:shadow-[0_0_40px_rgba(255,0,127,0.8)] transition-all transform hover:scale-105 active:scale-95"
              >
                <PlusCircle className="w-5 h-5" />
                CREATE YOUR GAME
              </Link>
              <Link
                href="/explore"
                className="flex items-center gap-2 px-6 py-4 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 rounded-full font-bold text-base text-slate-200 transition-all shadow-lg active:scale-95"
              >
                <Compass className="w-5 h-5 text-cyan-400" />
                Explore Games
              </Link>
            </div>

            {/* Social Proof Tags */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-4 text-xs font-semibold text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> Real Photo Cutouts
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> Microphone Voice Recorder
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> No Login Needed to Play
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Featured Arcade Cabinet (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            {featuredGame ? (
              <div className="relative flex flex-col items-center">
                <div className="text-center mb-3">
                  <span className="text-xs font-mono font-bold text-cyan-400 tracking-wider">
                    🕹️ TRY PLAYING NOW:
                  </span>
                  <h3 className="text-sm font-black text-slate-200">{featuredGame.title}</h3>
                </div>
                <GameCanvas game={featuredGame} width={360} height={480} />
              </div>
            ) : (
              <div className="w-80 h-96 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
            )}
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS SECTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-purple-900/30 bg-[#080824]/60">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest font-mono">
              SIMPLE 3-STEP PROCESS
            </span>
            <h2 className="text-3xl sm:text-4xl font-black mt-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-pink-400 to-purple-400">
              How FlappyVerse Works
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Transform your friends, personal memories, and inside jokes into viral arcade games in under two minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-8 rounded-2xl bg-[#0a0a2f] border border-cyan-500/20 hover:border-cyan-400/50 shadow-xl transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-400 mb-6 shadow-[0_0_20px_rgba(0,240,255,0.3)] group-hover:scale-110 transition-transform">
                <Camera className="w-7 h-7" />
              </div>
              <span className="text-xs font-mono font-bold text-cyan-400">STEP 01</span>
              <h3 className="text-xl font-black text-slate-100 mt-1 mb-3">Upload Photos</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Take a selfie, upload a friend&apos;s face from your phone gallery, or pick your pet. Our circle mask and cutout tools transform their face into the flying hero.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-2xl bg-[#0a0a2f] border border-pink-500/20 hover:border-pink-400/50 shadow-xl transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-400/40 flex items-center justify-center text-pink-400 mb-6 shadow-[0_0_20px_rgba(255,0,127,0.3)] group-hover:scale-110 transition-transform">
                <Mic className="w-7 h-7" />
              </div>
              <span className="text-xs font-mono font-bold text-pink-400">STEP 02</span>
              <h3 className="text-xl font-black text-slate-100 mt-1 mb-3">Record Funny Sounds</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Record your voice directly into the microphone: funny scream for collision, silly &apos;wheee&apos; for jump, victory chime for scores, or upload custom MP3 audio.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-2xl bg-[#0a0a2f] border border-purple-500/20 hover:border-purple-400/50 shadow-xl transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-400/40 flex items-center justify-center text-purple-400 mb-6 shadow-[0_0_20px_rgba(157,0,255,0.3)] group-hover:scale-110 transition-transform">
                <QrCode className="w-7 h-7" />
              </div>
              <span className="text-xs font-mono font-bold text-purple-400">STEP 03</span>
              <h3 className="text-xl font-black text-slate-100 mt-1 mb-3">Publish & Challenge Friends</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Click Publish to get an instant public URL, QR code, WhatsApp, and Telegram link. Friends can immediately open and play without needing to sign up or download!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MY GAMES DASHBOARD SECTION */}
      <section id="my-games" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-purple-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-pink-400 mb-1">
                <FolderHeart className="w-4 h-4" />
                PERSONAL ARCADE VAULT
              </div>
              <h2 className="text-3xl font-black text-slate-100">My Created Games</h2>
            </div>
            <Link
              href="/studio"
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-transform active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              Create New Game
            </Link>
          </div>

          {userGames.length === 0 ? (
            <div className="p-12 rounded-2xl bg-[#0a0a2f]/60 border border-purple-900/30 text-center flex flex-col items-center justify-center">
              <div className="text-4xl mb-3">🎮</div>
              <h3 className="text-xl font-bold text-slate-200">You haven&apos;t created any games yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1 mb-6">
                Ready to turn your face or a friend&apos;s photo into a playable game? Open the Studio and customize your first arcade adventure!
              </p>
              <Link
                href="/studio"
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-xs rounded-full shadow-[0_0_20px_rgba(255,0,127,0.5)]"
              >
                Launch Studio
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {userGames.map((g) => (
                <div
                  key={g.id}
                  className="bg-[#0a0a2f] border border-slate-800 hover:border-cyan-400/50 rounded-2xl p-5 shadow-xl transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={g.character.imageUrl}
                          alt={g.character.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-cyan-400"
                        />
                        <div>
                          <h4 className="font-black text-sm text-slate-100 line-clamp-1">{g.title}</h4>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                              g.isPublished
                                ? "bg-emerald-950 text-emerald-400 border-emerald-500/40"
                                : "bg-yellow-950 text-yellow-400 border-yellow-500/40"
                            }`}
                          >
                            {g.isPublished ? "● Published" : "○ Draft"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleDuplicate(g.id, e)}
                          className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-slate-800"
                          title="Duplicate Game"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(g.id, e)}
                          className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800"
                          title="Delete Game"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 mb-4 bg-slate-900/60 p-2 rounded-xl">
                      <span>Plays: {g.playCount || 0}</span>
                      <span>Best: {g.highScore || 0}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                    <Link
                      href={`/studio?id=${g.id}`}
                      className="flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl"
                    >
                      <Edit className="w-3.5 h-3.5 text-cyan-400" />
                      Edit
                    </Link>
                    <Link
                      href={`/play/${g.slug || g.id}`}
                      className="flex items-center justify-center gap-1.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Play
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. FEATURED COMMUNITY GAMES */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#080824]/40">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1">
                <Flame className="w-4 h-4 text-pink-400" />
                COMMUNITY HIGHLIGHTS
              </span>
              <h2 className="text-3xl font-black text-slate-100 mt-1">Featured Community Games</h2>
            </div>
            <Link
              href="/explore"
              className="flex items-center gap-1 text-xs sm:text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allGames
              .filter((g) => g.isPublished)
              .slice(0, 3)
              .map((g) => (
                <div
                  key={g.id}
                  className="group bg-[#0a0a2f] border border-cyan-500/20 hover:border-cyan-400/60 rounded-2xl p-5 shadow-xl transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={g.character.imageUrl}
                          alt={g.character.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-pink-400 shadow-md group-hover:scale-105 transition-transform"
                        />
                        <div>
                          <h4 className="font-black text-sm text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-1">
                            {g.title}
                          </h4>
                          <span className="text-xs text-purple-300 font-mono">@{g.creatorName}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedShareGame(g)}
                        className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-slate-800"
                        title="Share Game"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mb-4">{g.description}</p>
                  </div>

                  <Link
                    href={`/play/${g.slug || g.id}`}
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition-transform group-hover:scale-102"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    PLAY NOW
                  </Link>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-purple-900/30 bg-[#050515] text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500">
              FLAPPYVERSE
            </span>
            <span className="text-xs text-slate-500">© 2026 • Your Friends, Your Photos, Your Game</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400">
            <Link href="/explore" className="hover:text-cyan-400 transition-colors">
              Explore
            </Link>
            <Link href="/studio" className="hover:text-pink-400 transition-colors">
              Studio
            </Link>
            <Link href="/#my-games" className="hover:text-purple-400 transition-colors">
              My Games
            </Link>
          </div>
        </div>
      </footer>

      {/* Share Modal */}
      {selectedShareGame && (
        <QRCodeModal
          isOpen={Boolean(selectedShareGame)}
          onClose={() => setSelectedShareGame(null)}
          gameTitle={selectedShareGame.title}
          shareUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/play/${
            selectedShareGame.slug || selectedShareGame.id
          }`}
        />
      )}
    </div>
  );
}
