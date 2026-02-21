"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { usePartyStore } from "@/stores/party-store";
import { connectSocket, disconnectSocket, type AppSocket } from "@/lib/socket";
import Navbar from "@/components/Navbar";
import ReelViewer from "@/components/ReelViewer";
import AddReelBar from "@/components/AddReelBar";
import SwipeConsensus from "@/components/SwipeConsensus";
import PartyChat from "@/components/PartyChat";
import VoiceChat from "@/components/VoiceChat";
import PartyMembers from "@/components/PartyMembers";

export default function PartyRoom() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;

  const socketRef = useRef<AppSocket | null>(null);
  const {
    setConnected,
    setRoomId,
    setPartyState,
    setPhase,
    updateSwipes,
    addMember,
    removeMember,
    setCurrentReelIndex,
    addReel,
    setConsensusTimer,
    addMessage,
    addVoiceUser,
    removeVoiceUser,
    phase,
    members,
    hostId,
    reels,
    currentReelIndex,
    reset,
  } = usePartyStore();

  const setupSocketListeners = useCallback(
    (socket: AppSocket) => {
      socket.on("room-state", (state) => {
        setPartyState(state);
      });

      socket.on("member-joined", (member) => {
        addMember(member);
        addMessage({
          id: `sys-${Date.now()}`,
          userId: "system",
          userName: "System",
          userImage: null,
          content: `${member.name || "Someone"} joined the party`,
          type: "system",
          createdAt: new Date().toISOString(),
        });
      });

      socket.on("member-left", (userId) => {
        const member = members.find((m) => m.userId === userId);
        removeMember(userId);
        addMessage({
          id: `sys-${Date.now()}`,
          userId: "system",
          userName: "System",
          userImage: null,
          content: `${member?.name || "Someone"} left the party`,
          type: "system",
          createdAt: new Date().toISOString(),
        });
      });

      socket.on("swipe-update", (swipes) => {
        updateSwipes(swipes);
      });

      socket.on("phase-change", (newPhase) => {
        setPhase(newPhase);
      });

      socket.on("next-reel", (index) => {
        setCurrentReelIndex(index);
      });

      socket.on("chat-message", (message) => {
        addMessage(message);
      });

      socket.on("reel-added", (reel) => {
        addReel(reel);
      });

      socket.on("voice-user-joined", (userId) => {
        addVoiceUser(userId);
      });

      socket.on("voice-user-left", (userId) => {
        removeVoiceUser(userId);
      });

      socket.on("consensus-timer", (secondsLeft) => {
        setConsensusTimer(Date.now() + secondsLeft * 1000);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Connect and join room
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/");
      return;
    }

    const userId = (session.user as { id: string }).id;
    const socket = connectSocket();
    socketRef.current = socket;

    socket.auth = {
      userId,
      userName: session.user?.name || "Anonymous",
      userImage: session.user?.image || null,
    };

    socket.on("connect", () => {
      setConnected(true);
      setRoomId(roomId);

      socket.emit("join-room", roomId, (success, state) => {
        if (success && state) {
          setPartyState(state);
        } else {
          alert("Failed to join room");
          router.push("/lobby");
        }
      });
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    setupSocketListeners(socket);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.emit("leave-room", roomId);
      socket.removeAllListeners();
      disconnectSocket();
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, roomId]);

  const isHost =
    session && (session.user as { id: string }).id === hostId;
  const hasReels = reels.length > 0;

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="h-screen bg-black text-white pt-14 flex flex-col">
        {/* Top bar: room info + members */}
        <div className="flex items-center justify-between px-4 py-2 bg-black/60 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div>
              {hasReels ? (
                <span className="text-sm font-semibold text-white/80">
                  Reel {currentReelIndex + 1}/{reels.length}
                </span>
              ) : (
                <span className="text-sm font-semibold text-white/50">
                  No reels yet
                </span>
              )}
              {hasReels && (
                <span
                  className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                    phase === "VIEWING"
                      ? "bg-green-500/20 text-green-400"
                      : phase === "WAITING_FOR_CONSENSUS"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : phase === "VOICE_DISCUSS"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-blue-500/20 text-blue-400"
                  }`}
                >
                  {phase === "VIEWING" && "Watching"}
                  {phase === "WAITING_FOR_CONSENSUS" && "Waiting..."}
                  {phase === "VOICE_DISCUSS" && "Discussing"}
                  {phase === "TRANSITIONING" && "Next..."}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <PartyMembers />
            {isHost && hasReels && (
              <button
                onClick={() =>
                  socketRef.current?.emit("force-next", roomId)
                }
                className="text-xs px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-white/60 hover:text-white transition-colors"
                title="Force skip (host only)"
              >
                Skip
              </button>
            )}
          </div>
        </div>

        {/* Add reel bar — always visible. When no reels, it IS the main content. */}
        <AddReelBar socket={socketRef.current} />

        {/* Voice chat panel (conditional) */}
        <VoiceChat socket={socketRef.current} />

        {/* Main reel viewer — only renders when there are reels */}
        <ReelViewer socket={socketRef.current} />

        {/* Consensus bar */}
        <SwipeConsensus />

        {/* Chat side panel */}
        <PartyChat socket={socketRef.current} />
      </main>
    </>
  );
}
