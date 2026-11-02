"use client";

import { useState } from "react";
import { X, Copy, Check, Share2, ExternalLink } from "lucide-react";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameTitle: string;
  shareUrl: string;
}

export default function QRCodeModal({ isOpen, onClose, gameTitle, shareUrl }: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappText = encodeURIComponent(
    `🎮 Play my custom game "${gameTitle}" on FlappyVerse! Can you beat my high score?\n👉 ${shareUrl}`
  );
  const whatsappUrl = `https://api.whatsapp.com/send?text=${whatsappText}`;

  const telegramText = encodeURIComponent(
    `🎮 Play my custom game "${gameTitle}" on FlappyVerse! 👉`
  );
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${telegramText}`;

  // Generate QR Code via standard SVG API
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=00f0ff&bgcolor=080821&data=${encodeURIComponent(
    shareUrl
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#0a0a2f] border border-cyan-500/40 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,240,255,0.3)]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex p-3 rounded-full bg-cyan-500/10 border border-cyan-400/40 text-cyan-400 mb-3 shadow-[0_0_20px_rgba(0,240,255,0.4)]">
            <Share2 className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500">
            Share Your Game!
          </h3>
          <p className="text-sm text-slate-300 mt-1 font-medium line-clamp-1">{gameTitle}</p>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-4 bg-[#050518] border border-purple-500/30 rounded-xl mb-5 shadow-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrApiUrl}
            alt="Game QR Code"
            className="w-44 h-44 rounded-lg shadow-[0_0_20px_rgba(0,240,255,0.2)]"
          />
          <span className="text-xs text-cyan-400 mt-2 font-mono">Scan with Phone Camera to Play</span>
        </div>

        {/* Shareable Link Box */}
        <div className="flex items-center gap-2 p-2.5 bg-slate-900 border border-slate-700 rounded-xl mb-5">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 bg-transparent text-xs sm:text-sm text-slate-200 outline-none font-mono select-all truncate"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md active:scale-95 shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>
        </div>

        {/* Social Share Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-transform hover:scale-102 active:scale-98"
          >
            💬 WhatsApp
          </a>
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-transform hover:scale-102 active:scale-98"
          >
            ✈️ Telegram
          </a>
        </div>

        {/* Direct Play Link */}
        <a
          href={shareUrl}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm rounded-xl shadow-[0_0_20px_rgba(255,0,127,0.4)] transition-all"
        >
          <ExternalLink className="w-4 h-4" />
          Open Play Page Now
        </a>
      </div>
    </div>
  );
}

