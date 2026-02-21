"use client";

import { usePartyStore } from "@/stores/party-store";

export default function PartyMembers() {
  const { members, swipes, voiceUsers, hostId } = usePartyStore();

  return (
    <div className="flex items-center gap-1">
      {members.map((member) => {
        const hasSwiped = swipes[member.userId];
        const inVoice = voiceUsers.includes(member.userId);
        const isHost = member.userId === hostId;

        return (
          <div
            key={member.userId}
            className="relative group"
            title={`${member.name || "Anonymous"}${isHost ? " (Host)" : ""}`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full border-2 transition-colors ${
                hasSwiped
                  ? "border-green-500"
                  : inVoice
                  ? "border-red-500 animate-pulse"
                  : "border-white/20"
              }`}
            >
              {member.image ? (
                <img
                  src={member.image}
                  alt=""
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
                  {(member.name || "?")[0].toUpperCase()}
                </div>
              )}
            </div>

            {/* Host crown */}
            {isHost && (
              <span className="absolute -top-1 -right-1 text-[10px]">
                👑
              </span>
            )}

            {/* Voice indicator */}
            {inVoice && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-2 h-2 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                </svg>
              </span>
            )}

            {/* Tooltip */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-black rounded text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {member.name || "Anonymous"}
              {isHost && " (Host)"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
