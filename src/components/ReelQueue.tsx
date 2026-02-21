"use client";

import { useState } from "react";
import { usePartyStore } from "@/stores/party-store";
import type { AppSocket } from "@/lib/socket";

interface ReelQueueProps {
  socket: AppSocket | null;
}

export default function ReelQueue({ socket }: ReelQueueProps) {
  const { reels, currentReelIndex, queueOpen, toggleQueue, roomId } =
    usePartyStore();
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);

  const addReel = () => {
    if (!url.trim() || !socket || !roomId) return;

    // Basic Instagram URL validation
    const instagramPattern =
      /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/(reel|reels|p)\//;
    if (!instagramPattern.test(url.trim())) {
      alert("Please enter a valid Instagram Reel URL");
      return;
    }

    setAdding(true);
    socket.emit("add-reel", roomId, url.trim());
    setUrl("");
    setAdding(false);
  };

  if (!queueOpen) {
    return (
      <button
        onClick={toggleQueue}
        className="fixed left-4 bottom-24 z-40 w-12 h-12 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center shadow-lg transition-colors"
      >
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 10h16M4 14h16M4 18h16"
          />
        </svg>
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-400 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {reels.length}
        </span>
      </button>
    );
  }

  return (
    <div className="fixed left-0 top-14 bottom-0 w-80 bg-black/90 backdrop-blur-md border-r border-white/10 z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white">Reel Queue</h3>
        <button
          onClick={toggleQueue}
          className="text-white/50 hover:text-white transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Add reel input */}
      <div className="p-3 border-b border-white/10">
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addReel()}
            placeholder="Paste Instagram Reel URL..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50"
          />
          <button
            onClick={addReel}
            disabled={!url.trim() || adding}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/10 disabled:text-white/30 rounded-lg text-sm text-white transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Queue list */}
      <div className="flex-1 overflow-y-auto">
        {reels.length === 0 ? (
          <p className="text-center text-white/30 text-sm mt-8 px-4">
            No reels in the queue. Paste an Instagram Reel URL above to
            add one!
          </p>
        ) : (
          <div className="divide-y divide-white/5">
            {reels.map((reel, index) => (
              <div
                key={reel.id}
                className={`flex items-center gap-3 px-4 py-3 ${
                  index === currentReelIndex
                    ? "bg-purple-500/10 border-l-2 border-purple-500"
                    : index < currentReelIndex
                    ? "opacity-40"
                    : ""
                }`}
              >
                <span
                  className={`text-xs font-mono w-6 text-center ${
                    index === currentReelIndex
                      ? "text-purple-400 font-bold"
                      : "text-white/30"
                  }`}
                >
                  {index + 1}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 truncate">
                    {reel.authorName || reel.title || "Instagram Reel"}
                  </p>
                  <p className="text-xs text-white/30 truncate">{reel.url}</p>
                </div>

                {index === currentReelIndex && (
                  <span className="text-xs text-purple-400 font-medium">
                    Now
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
