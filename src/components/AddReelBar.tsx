"use client";

import { useState } from "react";
import { usePartyStore } from "@/stores/party-store";
import type { AppSocket } from "@/lib/socket";

interface AddReelBarProps {
  socket: AppSocket | null;
}

export default function AddReelBar({ socket }: AddReelBarProps) {
  const { reels, currentReelIndex, roomId } = usePartyStore();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const addReel = () => {
    if (!url.trim() || !socket || !roomId) return;

    const instagramPattern =
      /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/(reel|reels|p)\//;
    if (!instagramPattern.test(url.trim())) {
      setError("Paste a valid Instagram Reel URL (instagram.com/reel/...)");
      return;
    }

    setError("");
    socket.emit("add-reel", roomId, url.trim());
    setUrl("");
  };

  const hasReels = reels.length > 0;

  return (
    <div className={hasReels ? "" : "flex-1 flex flex-col"}>
      {/* Empty state — big, centered, impossible to miss */}
      {!hasReels && (
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="max-w-md w-full text-center">
            {/* Instagram-style gradient icon */}
            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-pink-500/20">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
              Add an Instagram Reel
            </h2>
            <p className="text-white/40 text-sm mb-8">
              Paste a link below and everyone in the party will watch it together
            </p>

            {/* URL input — large and prominent */}
            <div className="relative">
              <input
                type="url"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && addReel()}
                placeholder="https://www.instagram.com/reel/..."
                className="w-full bg-white/5 border-2 border-white/10 focus:border-purple-500 rounded-2xl pl-4 pr-20 py-4 text-sm text-white placeholder-white/20 focus:outline-none transition-colors"
                autoFocus
              />
              <button
                onClick={addReel}
                disabled={!url.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 disabled:from-white/10 disabled:to-white/10 disabled:text-white/30 text-white text-sm font-semibold rounded-xl transition-all"
              >
                Add
              </button>
            </div>

            {error && (
              <p className="mt-2 text-xs text-red-400">{error}</p>
            )}

            <p className="mt-4 text-white/20 text-xs">
              Tip: Open Instagram, find a Reel, tap Share, then Copy Link
            </p>
          </div>
        </div>
      )}

      {/* Compact add bar — shown when reels exist, pinned at top */}
      {hasReels && (
        <div className="px-4 py-2 bg-white/[0.03] border-b border-white/5">
          <div className="flex items-center gap-2 max-w-2xl mx-auto">
            {/* Queue counter */}
            <div className="flex items-center gap-1.5 text-xs text-white/40 whitespace-nowrap">
              <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <span>{currentReelIndex + 1}/{reels.length}</span>
            </div>

            {/* Input */}
            <div className="flex-1 relative">
              <input
                type="url"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && addReel()}
                placeholder="Paste Instagram Reel URL to add to queue..."
                className="w-full bg-white/5 border border-white/10 focus:border-purple-500/50 rounded-xl pl-3 pr-16 py-2 text-xs text-white placeholder-white/25 focus:outline-none transition-colors"
              />
              <button
                onClick={addReel}
                disabled={!url.trim()}
                className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 bg-purple-600 hover:bg-purple-500 disabled:bg-white/10 disabled:text-white/30 text-white text-xs font-medium rounded-lg transition-colors"
              >
                + Add
              </button>
            </div>
          </div>
          {error && (
            <p className="text-xs text-red-400 mt-1 text-center">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
