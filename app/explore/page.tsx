"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import QRCodeModal from "../../components/QRCodeModal";
import { Game } from "../../lib/types";
import { getAllGames } from "../../lib/storage";
import { Search, Trophy, Flame, Play, Share2, PlusCircle, Sparkles } from "lucide-react";

export default function ExplorePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"trending" | "recent" | "popular">("trending");
  const [selectedShareGame, setSelectedShareGame] = useState<Game | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
    getAllGames().then((all) => {
      // Show published games
      setGames(all.filter((g) => g.isPublished));
    });
  }, []);

  // Filter & Search Logic
  const filteredGames = games
    .filter((g) => {
      const q = searchQuery.toLowerCase();
      return (
        g.title.toLowerCase().includes(q) ||
        g.creatorName.toLowerCase().includes(q) ||
        (g.description && g.description.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (activeFilter === "popular") {
        return (b.playCount || 0) - (a.playCount || 0);
      } else if (activeFilter === "recent") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        // Trending: combination of plays and high score
        return (b.playCount || 0) * 0.7 + (b.highScore || 0) * 10 - ((a.playCount || 0) * 0.7 + (a.highScore || 0) * 10);
      }
    });

  return (
    <div className="min-h-screen bg-[#060618] text-slate-100 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 flex-1">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 text-xs font-bold mb-3 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              Community Multiverse
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-pink-400 to-purple-400">
              Explore Community Games
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Play custom arcade universes created by friends and the global community using their personal photos and hilarious voices!
            </p>
          </div>

          <Link
            href="/studio"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-black text-sm shadow-[0_0_20px_rgba(255,0,127,0.5)] transition-all transform hover:scale-105 active:scale-95 shrink-0 self-start md:self-end"
          >
            <PlusCircle className="w-4 h-4" />
            Create Your Own Game
          </Link>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-[#0a0a2f] p-3 rounded-2xl border border-purple-900/30 shadow-lg">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by game title or creator..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-400 transition-colors"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            {[
              { id: "trending", label: "🔥 Trending", icon: Flame },
              { id: "popular", label: "🎮 Most Played", icon: Play },
              { id: "recent", label: "⚡ Recently Created", icon: Sparkles },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as typeof activeFilter)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeFilter === tab.id
                    ? "bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                    : "bg-slate-900/70 border border-transparent text-slate-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Games Grid */}
        {filteredGames.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-[#0a0a2f]/40 border border-purple-900/30 rounded-2xl text-center">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="text-lg font-bold text-slate-300">No games found</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">Try adjusting your search terms or be the first to create one!</p>
            <Link
              href="/studio"
              className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-full"
            >
              Start Creating Now
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGames.map((g) => (
              <div
                key={g.id}
                className="group relative bg-[#0a0a2f] border border-cyan-500/20 hover:border-cyan-400/60 rounded-2xl p-5 shadow-xl hover:shadow-[0_0_30px_rgba(0,240,255,0.25)] transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Character Avatar & Badge */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-14 rounded-full overflow-hidden p-0.5 bg-gradient-to-tr from-cyan-400 to-pink-500 shadow-md group-hover:scale-105 transition-transform shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={g.character.imageUrl}
                          alt={g.character.name}
                          className="w-full h-full object-cover rounded-full bg-slate-950"
                        />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-1">
                          {g.title}
                        </h3>
                        <p className="text-xs text-purple-300 font-mono">By @{g.creatorName}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedShareGame(g)}
                      className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 border border-slate-700 transition-colors shrink-0"
                      title="Share Game"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                    {g.description || "Custom game created with photos and personal audio on FlappyVerse."}
                  </p>

                  {/* Badges / Stats */}
                  <div className="flex items-center gap-2 mb-5">
                    <span className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400">
                      <Play className="w-3 h-3 fill-current" />
                      {g.playCount || 0} Plays
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-yellow-400">
                      <Trophy className="w-3 h-3" />
                      Best: {g.highScore || 0}
                    </span>
                    <span className="text-[11px] capitalize font-mono px-2 py-1 rounded-lg bg-purple-950/60 border border-purple-500/30 text-purple-300 ml-auto">
                      {g.physics.difficulty}
                    </span>
                  </div>
                </div>

                {/* Play Button */}
                <Link
                  href={`/play/${g.slug || g.id}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs rounded-xl shadow-lg transition-all transform group-hover:scale-102"
                >
                  <Play className="w-4 h-4 fill-current" />
                  PLAY NOW
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Share Modal */}
      {selectedShareGame && (
        <QRCodeModal
          isOpen={Boolean(selectedShareGame)}
          onClose={() => setSelectedShareGame(null)}
          gameTitle={selectedShareGame.title}
          shareUrl={`${origin}/play/${selectedShareGame.slug || selectedShareGame.id}`}
        />
      )}
    </div>
  );
}

