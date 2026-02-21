import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { roomManager } from "./room-manager";
import { setupVoiceSignaling, removeFromVoice } from "./voice-signaling";
import type { ReelItem } from "../types";

export function createSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  // Set up the timer expired callback
  roomManager.onTimerExpired = (roomId: string) => {
    const state = roomManager.getPartyState(roomId);
    if (state) {
      io.to(roomId).emit("phase-change", "VOICE_DISCUSS");
      io.to(roomId).emit("room-state", state);
    }
  };

  io.on("connection", (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // Set up voice signaling handlers
    setupVoiceSignaling(io, socket);

    socket.on("join-room", (roomId: string, callback) => {
      const userId = (socket.data as { userId?: string }).userId || socket.id;
      const userName = (socket.data as { userName?: string }).userName || "Anonymous";
      const userImage = (socket.data as { userImage?: string | null }).userImage || null;

      // Get or create room state
      roomManager.getOrCreateRoom(roomId, userId);

      // Add member
      const member = roomManager.addMember(roomId, userId, socket.id, userName, userImage);
      if (!member) {
        callback(false);
        return;
      }

      socket.join(roomId);

      // Broadcast to others
      socket.to(roomId).emit("member-joined", member);

      // Send current state back
      const state = roomManager.getPartyState(roomId);
      if (state) {
        callback(true, state);
      } else {
        callback(false);
      }
    });

    socket.on("leave-room", (roomId: string) => {
      const userId = (socket.data as { userId?: string }).userId || socket.id;
      handleLeave(io, socket, roomId, userId);
    });

    socket.on("swipe-up", (roomId: string) => {
      const userId = (socket.data as { userId?: string }).userId || socket.id;
      const result = roomManager.swipeUp(roomId, userId);
      if (!result) return;

      // Broadcast swipe status
      io.to(roomId).emit("swipe-update", roomManager.getSwipes(roomId));

      if (result.allSwiped) {
        // Consensus reached! Advance to next reel
        const newIndex = roomManager.advanceReel(roomId);
        if (newIndex !== null) {
          io.to(roomId).emit("phase-change", "TRANSITIONING");

          // Brief delay for transition animation
          setTimeout(() => {
            io.to(roomId).emit("next-reel", newIndex);
            io.to(roomId).emit("phase-change", "VIEWING");
            io.to(roomId).emit("swipe-update", roomManager.getSwipes(roomId));
          }, 500);
        }
      } else if (result.phase === "WAITING_FOR_CONSENSUS") {
        io.to(roomId).emit("phase-change", "WAITING_FOR_CONSENSUS");
        const state = roomManager.getPartyState(roomId);
        if (state?.consensusTimerEnd) {
          const secondsLeft = Math.ceil(
            (state.consensusTimerEnd - Date.now()) / 1000
          );
          io.to(roomId).emit("consensus-timer", secondsLeft);
        }
      }
    });

    socket.on("ready-to-move-on", (roomId: string) => {
      const userId = (socket.data as { userId?: string }).userId || socket.id;
      const allReady = roomManager.markReadyToMoveOn(roomId, userId);

      if (allReady) {
        const newIndex = roomManager.advanceReel(roomId);
        if (newIndex !== null) {
          io.to(roomId).emit("phase-change", "TRANSITIONING");
          setTimeout(() => {
            io.to(roomId).emit("next-reel", newIndex);
            io.to(roomId).emit("phase-change", "VIEWING");
            io.to(roomId).emit("swipe-update", roomManager.getSwipes(roomId));
          }, 500);
        }
      }
    });

    socket.on("force-next", (roomId: string) => {
      const userId = (socket.data as { userId?: string }).userId || socket.id;
      const room = roomManager.getRoom(roomId);
      if (!room || room.hostId !== userId) return;

      const newIndex = roomManager.advanceReel(roomId);
      if (newIndex !== null) {
        io.to(roomId).emit("phase-change", "TRANSITIONING");
        setTimeout(() => {
          io.to(roomId).emit("next-reel", newIndex);
          io.to(roomId).emit("phase-change", "VIEWING");
          io.to(roomId).emit("swipe-update", roomManager.getSwipes(roomId));
        }, 500);
      }
    });

    socket.on("chat-message", (roomId: string, content: string) => {
      const userId = (socket.data as { userId?: string }).userId || socket.id;
      const userName = (socket.data as { userName?: string }).userName || "Anonymous";
      const userImage = (socket.data as { userImage?: string | null }).userImage || null;

      const message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        userId,
        userName,
        userImage,
        content,
        type: "text" as const,
        createdAt: new Date().toISOString(),
      };

      io.to(roomId).emit("chat-message", message);
    });

    socket.on("add-reel", (roomId: string, url: string) => {
      const room = roomManager.getRoom(roomId);
      if (!room) return;

      const reel: ReelItem = {
        id: `reel-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        url,
        title: null,
        thumbnail: null,
        authorName: null,
        position: room.reels.length,
      };

      roomManager.addReel(roomId, reel);
      io.to(roomId).emit("reel-added", reel);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
      const info = roomManager.getMemberBySocket(socket.id);
      if (info) {
        handleLeave(io, socket, info.roomId, info.userId);
      }
    });
  });

  // Middleware to attach user data from auth query params
  io.use((socket, next) => {
    const { userId, userName, userImage } = socket.handshake.auth as {
      userId?: string;
      userName?: string;
      userImage?: string;
    };
    (socket.data as Record<string, unknown>).userId = userId || socket.id;
    (socket.data as Record<string, unknown>).userName = userName || "Anonymous";
    (socket.data as Record<string, unknown>).userImage = userImage || null;
    next();
  });

  return io;
}

function handleLeave(
  io: Server,
  socket: import("socket.io").Socket,
  roomId: string,
  userId: string
): void {
  socket.leave(roomId);
  removeFromVoice(io, roomId, userId);

  const shouldAdvance = roomManager.removeMember(roomId, userId);
  io.to(roomId).emit("member-left", userId);

  if (shouldAdvance) {
    // If removing member caused consensus, advance
    const room = roomManager.getRoom(roomId);
    if (room) {
      const newIndex = roomManager.advanceReel(roomId);
      if (newIndex !== null) {
        io.to(roomId).emit("next-reel", newIndex);
        io.to(roomId).emit("phase-change", "VIEWING");
        io.to(roomId).emit("swipe-update", roomManager.getSwipes(roomId));
      }
    }
  }
}
