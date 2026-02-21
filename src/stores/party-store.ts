"use client";

import { create } from "zustand";
import type {
  PartyPhase,
  PartyState,
  RoomMember,
  ReelItem,
  ChatMessage,
} from "@/types";

interface PartyStore {
  // Connection state
  connected: boolean;
  roomId: string | null;

  // Party state
  phase: PartyPhase;
  members: RoomMember[];
  swipes: Record<string, boolean>;
  currentReelIndex: number;
  reels: ReelItem[];
  consensusTimerEnd: number | null;
  hostId: string | null;

  // Chat state
  messages: ChatMessage[];

  // Voice state
  voiceActive: boolean;
  voiceUsers: string[];
  isMuted: boolean;

  // UI state
  chatOpen: boolean;
  queueOpen: boolean;

  // Actions
  setConnected: (connected: boolean) => void;
  setRoomId: (roomId: string | null) => void;
  setPartyState: (state: PartyState) => void;
  setPhase: (phase: PartyPhase) => void;
  updateSwipes: (swipes: Record<string, boolean>) => void;
  addMember: (member: RoomMember) => void;
  removeMember: (userId: string) => void;
  setCurrentReelIndex: (index: number) => void;
  addReel: (reel: ReelItem) => void;
  setConsensusTimer: (end: number | null) => void;
  addMessage: (message: ChatMessage) => void;
  setVoiceActive: (active: boolean) => void;
  addVoiceUser: (userId: string) => void;
  removeVoiceUser: (userId: string) => void;
  toggleMute: () => void;
  toggleChat: () => void;
  toggleQueue: () => void;
  reset: () => void;
}

const initialState = {
  connected: false,
  roomId: null,
  phase: "VIEWING" as PartyPhase,
  members: [],
  swipes: {},
  currentReelIndex: 0,
  reels: [],
  consensusTimerEnd: null,
  hostId: null,
  messages: [],
  voiceActive: false,
  voiceUsers: [],
  isMuted: false,
  chatOpen: false,
  queueOpen: false,
};

export const usePartyStore = create<PartyStore>((set) => ({
  ...initialState,

  setConnected: (connected) => set({ connected }),
  setRoomId: (roomId) => set({ roomId }),

  setPartyState: (state) =>
    set({
      phase: state.phase,
      members: state.members,
      swipes: state.swipes,
      currentReelIndex: state.currentReelIndex,
      reels: state.reels,
      consensusTimerEnd: state.consensusTimerEnd,
      hostId: state.hostId,
      voiceActive: state.phase === "VOICE_DISCUSS",
    }),

  setPhase: (phase) =>
    set({
      phase,
      voiceActive: phase === "VOICE_DISCUSS",
    }),

  updateSwipes: (swipes) => set({ swipes }),

  addMember: (member) =>
    set((state) => ({
      members: state.members.some((m) => m.userId === member.userId)
        ? state.members.map((m) =>
            m.userId === member.userId ? member : m
          )
        : [...state.members, member],
    })),

  removeMember: (userId) =>
    set((state) => ({
      members: state.members.filter((m) => m.userId !== userId),
    })),

  setCurrentReelIndex: (index) =>
    set({ currentReelIndex: index, swipes: {} }),

  addReel: (reel) =>
    set((state) => ({ reels: [...state.reels, reel] })),

  setConsensusTimer: (end) => set({ consensusTimerEnd: end }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setVoiceActive: (active) => set({ voiceActive: active }),

  addVoiceUser: (userId) =>
    set((state) => ({
      voiceUsers: state.voiceUsers.includes(userId)
        ? state.voiceUsers
        : [...state.voiceUsers, userId],
    })),

  removeVoiceUser: (userId) =>
    set((state) => ({
      voiceUsers: state.voiceUsers.filter((id) => id !== userId),
    })),

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  toggleChat: () => set((state) => ({ chatOpen: !state.chatOpen })),
  toggleQueue: () => set((state) => ({ queueOpen: !state.queueOpen })),

  reset: () => set(initialState),
}));
