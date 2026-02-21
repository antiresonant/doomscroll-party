"use client";

import { useEffect, useState } from "react";
import { usePartyStore } from "@/stores/party-store";

export default function SwipeConsensus() {
  const { members, swipes, phase, consensusTimerEnd } = usePartyStore();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Countdown timer
  useEffect(() => {
    if (!consensusTimerEnd || phase !== "WAITING_FOR_CONSENSUS") {
      setTimeLeft(null);
      return;
    }

    const update = () => {
      const remaining = Math.max(
        0,
        Math.ceil((consensusTimerEnd - Date.now()) / 1000)
      );
      setTimeLeft(remaining);
    };

    update();
    const interval = setInterval(update, 100);
    return () => clearInterval(interval);
  }, [consensusTimerEnd, phase]);

  if (phase === "VIEWING" && Object.values(swipes).every((v) => !v)) {
    return null;
  }

  const totalMembers = members.length;
  const swipedCount = Object.values(swipes).filter(Boolean).length;
  const progress = totalMembers > 0 ? (swipedCount / totalMembers) * 100 : 0;

  return (
    <div className="bg-black/60 backdrop-blur-md border-t border-white/10 px-4 py-3">
      {/* Progress bar */}
      <div className="relative h-2 bg-white/10 rounded-full overflow-hidden mb-3">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Status text */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-white/70">
          {phase === "WAITING_FOR_CONSENSUS" && (
            <>
              {swipedCount}/{totalMembers} swiped
              {timeLeft !== null && (
                <span className="ml-2 text-yellow-400 font-mono">
                  {timeLeft}s
                </span>
              )}
            </>
          )}
          {phase === "VOICE_DISCUSS" && (
            <span className="text-red-400">
              Discussion time — voice chat active
            </span>
          )}
          {phase === "TRANSITIONING" && (
            <span className="text-green-400">Moving to next reel...</span>
          )}
        </span>

        {phase === "WAITING_FOR_CONSENSUS" && timeLeft !== null && timeLeft <= 5 && (
          <span className="text-xs text-red-400 animate-pulse">
            Voice chat starting soon...
          </span>
        )}
      </div>

      {/* Member swipe indicators */}
      <div className="flex flex-wrap gap-2">
        {members.map((member) => {
          const hasSwiped = swipes[member.userId];
          return (
            <div
              key={member.userId}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all ${
                hasSwiped
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-white/5 text-white/40 border border-white/10"
              }`}
            >
              {member.image ? (
                <img
                  src={member.image}
                  alt=""
                  className="w-4 h-4 rounded-full"
                />
              ) : (
                <div className="w-4 h-4 rounded-full bg-white/20" />
              )}
              <span>{member.name || "Anonymous"}</span>
              {hasSwiped ? (
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
