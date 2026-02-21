"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePartyStore } from "@/stores/party-store";
import type { AppSocket } from "@/lib/socket";

interface ReelViewerProps {
  socket: AppSocket | null;
}

export default function ReelViewer({ socket }: ReelViewerProps) {
  const { reels, currentReelIndex, roomId, phase } = usePartyStore();
  const [embedHtml, setEmbedHtml] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const [hasSwiped, setHasSwiped] = useState(false);

  const currentReel = reels[currentReelIndex];

  // Fetch oEmbed data for the current reel
  useEffect(() => {
    if (!currentReel?.url) {
      setEmbedHtml("");
      return;
    }

    setLoading(true);
    fetch(
      `/api/instagram/oembed?url=${encodeURIComponent(currentReel.url)}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.html) {
          setEmbedHtml(data.html);
          setTimeout(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (typeof window !== "undefined" && (window as unknown as Record<string, any>).instgrm) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (window as unknown as Record<string, any>).instgrm.Embeds.process();
            }
          }, 100);
        }
      })
      .catch(() => setEmbedHtml(""))
      .finally(() => setLoading(false));

    setHasSwiped(false);
  }, [currentReel?.url]);

  // Handle swipe up gesture
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const deltaY = touchStartY.current - e.changedTouches[0].clientY;
      if (deltaY > 50 && !hasSwiped && socket && roomId) {
        setHasSwiped(true);
        socket.emit("swipe-up", roomId);
      }
    },
    [socket, roomId, hasSwiped]
  );

  const handleSwipeClick = useCallback(() => {
    if (!hasSwiped && socket && roomId && (phase === "VIEWING" || phase === "WAITING_FOR_CONSENSUS")) {
      setHasSwiped(true);
      socket.emit("swipe-up", roomId);
    }
  }, [socket, roomId, phase, hasSwiped]);

  // No reels — show nothing here, the AddReelBar handles the empty state
  if (!currentReel) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="relative flex-1 flex flex-col items-center justify-center overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Instagram embed script */}
      <script async src="//www.instagram.com/embed.js" />

      {loading ? (
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : phase === "TRANSITIONING" ? (
        <div className="flex items-center justify-center">
          <div className="animate-slide-up text-white/50">
            <svg
              className="w-12 h-12 animate-bounce"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-[400px] mx-auto px-4">
          {embedHtml ? (
            <div
              className="instagram-embed-container"
              dangerouslySetInnerHTML={{ __html: embedHtml }}
            />
          ) : (
            <div className="bg-white/5 rounded-2xl p-6 text-center">
              <p className="text-white/70 text-sm mb-2">
                {currentReel.authorName && (
                  <span className="font-medium">{currentReel.authorName}</span>
                )}
              </p>
              <a
                href={currentReel.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 text-sm underline"
              >
                View on Instagram
              </a>
            </div>
          )}
        </div>
      )}

      {/* Swipe up button */}
      {(phase === "VIEWING" || phase === "WAITING_FOR_CONSENSUS") && (
        <button
          onClick={handleSwipeClick}
          disabled={hasSwiped}
          className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all ${
            hasSwiped
              ? "bg-green-500/20 text-green-400 cursor-default"
              : "bg-white/10 hover:bg-white/20 text-white animate-bounce"
          }`}
        >
          {hasSwiped ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Swiped
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              Swipe Up — Next Reel
            </>
          )}
        </button>
      )}
    </div>
  );
}
