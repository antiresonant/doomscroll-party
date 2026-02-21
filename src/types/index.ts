// ===== Room & Party Types =====

export type RoomStatus = "waiting" | "active" | "ended";

export type PartyPhase =
  | "VIEWING"
  | "WAITING_FOR_CONSENSUS"
  | "TRANSITIONING"
  | "VOICE_DISCUSS";

export interface RoomInfo {
  id: string;
  name: string;
  description: string | null;
  code: string;
  hostId: string;
  status: RoomStatus;
  currentReelIndex: number;
  memberCount: number;
  createdAt: string;
}

export interface RoomMember {
  id: string;
  userId: string;
  name: string;
  image: string | null;
  isActive: boolean;
  hasSwiped: boolean;
}

// ===== Reel Types =====

export interface ReelItem {
  id: string;
  url: string;
  title: string | null;
  thumbnail: string | null;
  authorName: string | null;
  position: number;
  html?: string;
}

export interface OEmbedResponse {
  html: string;
  title: string;
  author_name: string;
  thumbnail_url: string;
  thumbnail_width: number;
  thumbnail_height: number;
}

// ===== Chat Types =====

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userImage: string | null;
  content: string;
  type: "text" | "system" | "reaction";
  createdAt: string;
}

// ===== Socket Event Types =====

export interface ServerToClientEvents {
  "room-state": (state: PartyState) => void;
  "member-joined": (member: RoomMember) => void;
  "member-left": (userId: string) => void;
  "swipe-update": (swipes: Record<string, boolean>) => void;
  "phase-change": (phase: PartyPhase) => void;
  "next-reel": (index: number) => void;
  "chat-message": (message: ChatMessage) => void;
  "reel-added": (reel: ReelItem) => void;
  "voice-signal": (data: { from: string; signal: unknown }) => void;
  "voice-user-joined": (userId: string) => void;
  "voice-user-left": (userId: string) => void;
  "consensus-timer": (secondsLeft: number) => void;
  error: (message: string) => void;
}

export interface ClientToServerEvents {
  "join-room": (
    roomId: string,
    callback: (success: boolean, state?: PartyState) => void
  ) => void;
  "leave-room": (roomId: string) => void;
  "swipe-up": (roomId: string) => void;
  "reset-swipe": (roomId: string) => void;
  "chat-message": (roomId: string, content: string) => void;
  "add-reel": (roomId: string, url: string) => void;
  "force-next": (roomId: string) => void;
  "voice-signal": (data: { to: string; signal: unknown }) => void;
  "voice-join": (roomId: string) => void;
  "voice-leave": (roomId: string) => void;
  "ready-to-move-on": (roomId: string) => void;
}

// ===== Party State =====

export interface PartyState {
  roomId: string;
  phase: PartyPhase;
  members: RoomMember[];
  swipes: Record<string, boolean>;
  currentReelIndex: number;
  reels: ReelItem[];
  consensusTimerEnd: number | null;
  hostId: string;
}
