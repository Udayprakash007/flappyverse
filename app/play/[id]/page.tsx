"use client";

import { use, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import GameCanvas from "../../../components/GameCanvas";
import QRCodeModal from "../../../components/QRCodeModal";
import { Game } from "../../../lib/types";
import { getGameByIdOrSlug, recordPlay, updateHighScore } from "../../../lib/storage";
import { Trophy, Share2, Sparkles, ArrowLeft, PlusCircle } from "lucide-react";

function PlayContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const idOrSlug = resolvedParams.id;

  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(window.location.href);
    }
    getGameByIdOrSlug(idOrSlug).then((loaded) => {
      if (loaded) {
        setGame(loaded);
        recordPlay(loaded.id);
      }
      setLoading(false);
    });
  }, [idOrSlug]);

  const handleGameOver = async (score: number) => {
    if (game) {
      const isNew = await updateHighScore(game.id, score);
      if (isNew) {
        setGame((prev) => (prev ? { ...prev, highScore: Math.max(prev.highScore || 0, score) } : null));
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060618] text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-14 h-14 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin mb-4" />
          <p className="text-cyan-300 font-bold tracking-wider animate-pulse">LOADING UNIVERSE...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-[#060618] text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="text-5xl mb-4">🛸</div>
          <h2 className="text-3xl font-black text-pink-500 mb-2">Universe Not Found</h2>
          <p className="text-slate-400 max-w-md mb-6">
            This game link may be invalid or has not been published yet.
          </p>
          <Link
            href="/explore"
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-full shadow-lg"
          >
            Explore Other Games
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060618] text-slate-100 flex flex-col select-none">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-between py-6 px-4">
        {/* Game Title Bar */}
        <div className="w-full max-w-md flex items-center justify-between mb-4">
          <Link
            href="/explore"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Explore
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 border border-yellow-400/30 rounded-full text-yellow-300 text-xs font-mono font-bold shadow-sm">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              BEST: {game.highScore || 0}
            </div>
            <button
              onClick={() => setShowShareModal(true)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 rounded-full transition-transform active:scale-95 shadow-md"
              title="Share Game"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* The Playable Game */}
        <div className="flex flex-col items-center">
          <GameCanvas game={game} onGameOver={handleGameOver} width={380} height={520} />
        </div>

        {/* Creator & Game Info Footer */}
        <div className="w-full max-w-md flex flex-col items-center mt-6 text-center space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-300">Created by</span>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-950 border border-purple-500/40 text-purple-300 text-xs font-bold font-mono">
              @{game.creatorName}
            </span>
          </div>
          {game.description && (
            <p className="text-xs text-slate-400 max-w-sm line-clamp-2">{game.description}</p>
          )}

          {/* Call to action: Create your own */}
          <div className="pt-2">
            <Link
              href={`/studio`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500/20 via-purple-600/30 to-pink-500/20 hover:from-cyan-500/30 hover:to-pink-500/30 border border-cyan-400/40 text-cyan-300 font-bold text-xs shadow-md transition-all hover:scale-105"
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              Make Your Own Custom Game with Your Photos!
            </Link>
          </div>
        </div>
      </main>

      {/* Share & QR Modal */}
      <QRCodeModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        gameTitle={game.title}
        shareUrl={shareUrl}
      />
    </div>
  );
}

export default function PlayGamePage(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#060618] text-white flex flex-col items-center justify-center p-8">
          <div className="w-12 h-12 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin mb-4" />
          <p className="text-cyan-300 font-bold tracking-wider animate-pulse">LOADING UNIVERSE...</p>
        </div>
      }
    >
      <PlayContent {...props} />
    </Suspense>
  );
}
