import type { PartyPhase, PartyState, RoomMember, ReelItem } from "../types";

const CONSENSUS_TIMEOUT_MS = 15_000;

interface RoomState {
  roomId: string;
  phase: PartyPhase;
  members: Map<string, RoomMember & { socketId: string }>;
  swipes: Map<string, boolean>;
  currentReelIndex: number;
  reels: ReelItem[];
  consensusTimer: ReturnType<typeof setTimeout> | null;
  consensusTimerEnd: number | null;
  hostId: string;
  readyToMoveOn: Set<string>;
}

class RoomManager {
  private rooms: Map<string, RoomState> = new Map();

  createRoom(roomId: string, hostId: string): RoomState {
    const room: RoomState = {
      roomId,
      phase: "VIEWING",
      members: new Map(),
      swipes: new Map(),
      currentReelIndex: 0,
      reels: [],
      consensusTimer: null,
      consensusTimerEnd: null,
      hostId,
      readyToMoveOn: new Set(),
    };
    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  getOrCreateRoom(roomId: string, hostId: string): RoomState {
    return this.rooms.get(roomId) || this.createRoom(roomId, hostId);
  }

  addMember(
    roomId: string,
    userId: string,
    socketId: string,
    name: string,
    image: string | null
  ): RoomMember | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const member: RoomMember & { socketId: string } = {
      id: `${roomId}-${userId}`,
      userId,
      name,
      image,
      isActive: true,
      hasSwiped: false,
      socketId,
    };

    room.members.set(userId, member);
    room.swipes.set(userId, false);

    return member;
  }

  removeMember(roomId: string, userId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.members.delete(userId);
    room.swipes.delete(userId);
    room.readyToMoveOn.delete(userId);

    if (room.members.size === 0) {
      this.clearTimer(roomId);
      this.rooms.delete(roomId);
      return true;
    }

    // Check if removing this member means consensus is reached
    if (room.phase === "WAITING_FOR_CONSENSUS") {
      const allSwiped = this.checkConsensus(roomId);
      if (allSwiped) {
        return true; // signal to caller to advance
      }
    }

    return false;
  }

  getMemberBySocket(socketId: string): { roomId: string; userId: string } | null {
    for (const [roomId, room] of this.rooms) {
      for (const [userId, member] of room.members) {
        if (member.socketId === socketId) {
          return { roomId, userId };
        }
      }
    }
    return null;
  }

  swipeUp(
    roomId: string,
    userId: string
  ): { phase: PartyPhase; allSwiped: boolean } | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.swipes.set(userId, true);
    const memberEntry = room.members.get(userId);
    if (memberEntry) memberEntry.hasSwiped = true;

    if (room.phase === "VIEWING") {
      room.phase = "WAITING_FOR_CONSENSUS";
      this.startConsensusTimer(roomId);
    }

    const allSwiped = this.checkConsensus(roomId);

    return { phase: room.phase, allSwiped };
  }

  private checkConsensus(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const activeMembers = Array.from(room.members.values()).filter(
      (m) => m.isActive
    );
    return activeMembers.length > 0 && activeMembers.every((m) => room.swipes.get(m.userId));
  }

  advanceReel(roomId: string): number | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    this.clearTimer(roomId);

    room.currentReelIndex++;
    room.phase = "VIEWING";
    room.readyToMoveOn.clear();

    // Reset swipes
    for (const key of room.swipes.keys()) {
      room.swipes.set(key, false);
    }
    for (const member of room.members.values()) {
      member.hasSwiped = false;
    }

    return room.currentReelIndex;
  }

  triggerVoiceDiscuss(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.phase = "VOICE_DISCUSS";
    this.clearTimer(roomId);
    return true;
  }

  markReadyToMoveOn(roomId: string, userId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.phase !== "VOICE_DISCUSS") return false;

    room.readyToMoveOn.add(userId);

    const activeMembers = Array.from(room.members.values()).filter(
      (m) => m.isActive
    );
    return room.readyToMoveOn.size >= activeMembers.length;
  }

  addReel(roomId: string, reel: ReelItem): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.reels.push(reel);
    return true;
  }

  private startConsensusTimer(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    this.clearTimer(roomId);
    room.consensusTimerEnd = Date.now() + CONSENSUS_TIMEOUT_MS;

    room.consensusTimer = setTimeout(() => {
      if (room.phase === "WAITING_FOR_CONSENSUS") {
        room.phase = "VOICE_DISCUSS";
        room.consensusTimer = null;
        room.consensusTimerEnd = null;
        // The socket server will handle broadcasting this change
        this.onTimerExpired?.(roomId);
      }
    }, CONSENSUS_TIMEOUT_MS);
  }

  private clearTimer(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room?.consensusTimer) {
      clearTimeout(room.consensusTimer);
      room.consensusTimer = null;
      room.consensusTimerEnd = null;
    }
  }

  // Callback for when consensus timer expires
  onTimerExpired?: (roomId: string) => void;

  getPartyState(roomId: string): PartyState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const members: RoomMember[] = Array.from(room.members.values()).map(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ({ socketId, ...m }) => m
    );

    const swipes: Record<string, boolean> = {};
    for (const [key, val] of room.swipes) {
      swipes[key] = val;
    }

    return {
      roomId: room.roomId,
      phase: room.phase,
      members,
      swipes,
      currentReelIndex: room.currentReelIndex,
      reels: room.reels,
      consensusTimerEnd: room.consensusTimerEnd,
      hostId: room.hostId,
    };
  }

  getSwipes(roomId: string): Record<string, boolean> {
    const room = this.rooms.get(roomId);
    if (!room) return {};
    const swipes: Record<string, boolean> = {};
    for (const [key, val] of room.swipes) {
      swipes[key] = val;
    }
    return swipes;
  }
}

export const roomManager = new RoomManager();
