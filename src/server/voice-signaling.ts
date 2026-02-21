import type { Server, Socket } from "socket.io";

// Track which users are in voice chat per room
const voiceRooms: Map<string, Set<string>> = new Map();

export function setupVoiceSignaling(io: Server, socket: Socket): void {
  socket.on("voice-join", (roomId: string) => {
    const userId = (socket.data as { userId?: string }).userId;
    if (!userId) return;

    if (!voiceRooms.has(roomId)) {
      voiceRooms.set(roomId, new Set());
    }

    const room = voiceRooms.get(roomId)!;

    // Notify existing voice users about the new joiner
    for (const existingUserId of room) {
      const sockets = Array.from(io.sockets.sockets.values());
      const existing = sockets.find(
        (s) => (s.data as { userId?: string }).userId === existingUserId
      );
      if (existing) {
        existing.emit("voice-user-joined", userId);
      }
    }

    room.add(userId);

    // Tell the new user about all existing voice participants
    for (const existingUserId of room) {
      if (existingUserId !== userId) {
        socket.emit("voice-user-joined", existingUserId);
      }
    }
  });

  socket.on("voice-signal", ({ to, signal }: { to: string; signal: unknown }) => {
    const fromUserId = (socket.data as { userId?: string }).userId;
    if (!fromUserId) return;

    // Find the target socket by userId
    const sockets = Array.from(io.sockets.sockets.values());
    const target = sockets.find(
      (s) => (s.data as { userId?: string }).userId === to
    );
    if (target) {
      target.emit("voice-signal", { from: fromUserId, signal });
    }
  });

  socket.on("voice-leave", (roomId: string) => {
    const userId = (socket.data as { userId?: string }).userId;
    if (!userId) return;

    removeFromVoice(io, roomId, userId);
  });
}

export function removeFromVoice(io: Server, roomId: string, userId: string): void {
  const room = voiceRooms.get(roomId);
  if (!room) return;

  room.delete(userId);

  // Notify remaining voice users
  for (const existingUserId of room) {
    const sockets = Array.from(io.sockets.sockets.values());
    const existing = sockets.find(
      (s) => (s.data as { userId?: string }).userId === existingUserId
    );
    if (existing) {
      existing.emit("voice-user-left", userId);
    }
  }

  if (room.size === 0) {
    voiceRooms.delete(roomId);
  }
}
