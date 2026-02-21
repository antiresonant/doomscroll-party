"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePartyStore } from "@/stores/party-store";
import { VoiceManager } from "@/lib/webrtc";
import type { AppSocket } from "@/lib/socket";

interface VoiceChatProps {
  socket: AppSocket | null;
}

export default function VoiceChat({ socket }: VoiceChatProps) {
  const {
    voiceActive,
    voiceUsers,
    isMuted,
    toggleMute,
    members,
    phase,
    roomId,
  } = usePartyStore();
  const voiceManagerRef = useRef<VoiceManager | null>(null);

  // Auto-start voice when entering VOICE_DISCUSS phase
  useEffect(() => {
    if (phase === "VOICE_DISCUSS" && socket && roomId && !voiceManagerRef.current) {
      const manager = new VoiceManager(socket, roomId);
      voiceManagerRef.current = manager;
      manager.start().catch((err) => {
        console.error("Failed to start voice:", err);
      });
    }

    if (phase !== "VOICE_DISCUSS" && voiceManagerRef.current) {
      voiceManagerRef.current.stop();
      voiceManagerRef.current = null;
    }

    return () => {
      if (voiceManagerRef.current) {
        voiceManagerRef.current.stop();
        voiceManagerRef.current = null;
      }
    };
  }, [phase, socket, roomId]);

  // Handle mute toggle
  useEffect(() => {
    voiceManagerRef.current?.setMuted(isMuted);
  }, [isMuted]);

  const handleReadyToMoveOn = useCallback(() => {
    if (socket && roomId) {
      socket.emit("ready-to-move-on", roomId);
    }
  }, [socket, roomId]);

  if (!voiceActive && phase !== "VOICE_DISCUSS") return null;

  // Find members who haven't swiped (the holdouts)
  const holdouts = members.filter(
    (m) => !usePartyStore.getState().swipes[m.userId]
  );

  return (
    <div className="bg-red-500/10 border border-red-500/30 backdrop-blur-md rounded-2xl p-4 mx-4 mt-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <h4 className="text-sm font-semibold text-red-400">
            Voice Discussion
          </h4>
        </div>
        <span className="text-xs text-white/40">
          {voiceUsers.length} in voice
        </span>
      </div>

      {holdouts.length > 0 && (
        <p className="text-xs text-white/50 mb-3">
          Waiting on:{" "}
          {holdouts.map((h) => h.name || "Anonymous").join(", ")} — explain
          why this reel is worth staying on!
        </p>
      )}

      {/* Voice participants */}
      <div className="flex flex-wrap gap-2 mb-3">
        {members
          .filter((m) => voiceUsers.includes(m.userId))
          .map((member) => (
            <div
              key={member.userId}
              className="flex items-center gap-1.5 px-2 py-1 bg-red-500/20 rounded-full text-xs text-red-300"
            >
              {member.image ? (
                <img
                  src={member.image}
                  alt=""
                  className="w-4 h-4 rounded-full"
                />
              ) : (
                <div className="w-4 h-4 rounded-full bg-red-500/30" />
              )}
              {member.name || "Anonymous"}
              <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
            </div>
          ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleMute}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            isMuted
              ? "bg-red-500/30 text-red-300"
              : "bg-white/10 text-white/70"
          }`}
        >
          {isMuted ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
              Muted
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Unmuted
            </>
          )}
        </button>

        <button
          onClick={handleReadyToMoveOn}
          className="flex-1 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-full text-xs font-medium transition-colors"
        >
          Ready to move on
        </button>
      </div>
    </div>
  );
}
