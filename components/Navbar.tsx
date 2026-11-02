"use client";

import Link from "next/link";
import { useState } from "react";
import { Gamepad2, PlusCircle, Compass, FolderHeart, Menu, X } from "lucide-react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-[#070724]/85 backdrop-blur-md border-b border-purple-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 via-pink-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.5)] group-hover:scale-105 transition-transform">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-pink-400 to-purple-400 drop-shadow-[0_0_12px_rgba(0,240,255,0.4)]">
              FLAPPYVERSE
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/explore"
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-300 hover:text-cyan-400 transition-colors"
            >
              <Compass className="w-4 h-4" />
              Explore Games
            </Link>
            <Link
              href="/#my-games"
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-300 hover:text-pink-400 transition-colors"
            >
              <FolderHeart className="w-4 h-4" />
              My Games
            </Link>
            <Link
              href="/studio"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400 text-white text-sm font-bold shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-[0_0_25px_rgba(255,0,127,0.6)] transition-all transform hover:scale-105 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              Create Game
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0a0a33] border-b border-purple-900/40 px-4 pt-2 pb-4 space-y-2">
          <Link
            href="/explore"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 p-2.5 rounded-lg text-slate-200 hover:bg-slate-800"
          >
            <Compass className="w-5 h-5 text-cyan-400" />
            Explore Games
          </Link>
          <Link
            href="/#my-games"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 p-2.5 rounded-lg text-slate-200 hover:bg-slate-800"
          >
            <FolderHeart className="w-5 h-5 text-pink-400" />
            My Games
          </Link>
          <Link
            href="/studio"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-bold text-center"
          >
            <PlusCircle className="w-5 h-5" />
            Create Game
          </Link>
        </div>
      )}
    </nav>
  );
}
