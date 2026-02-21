"use client";

import SimplePeer from "simple-peer";
import type { AppSocket } from "./socket";

interface PeerConnection {
  peer: SimplePeer.Instance;
  userId: string;
}

export class VoiceManager {
  private peers: Map<string, PeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private socket: AppSocket;
  private roomId: string;
  private onSpeaking?: (userId: string, speaking: boolean) => void;

  constructor(
    socket: AppSocket,
    roomId: string,
    onSpeaking?: (userId: string, speaking: boolean) => void
  ) {
    this.socket = socket;
    this.roomId = roomId;
    this.onSpeaking = onSpeaking;
  }

  async start(): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      this.socket.emit("voice-join", this.roomId);

      this.socket.on("voice-user-joined", (userId: string) => {
        this.createPeer(userId, true);
      });

      this.socket.on("voice-signal", ({ from, signal }) => {
        const existing = this.peers.get(from);
        if (existing) {
          existing.peer.signal(signal as SimplePeer.SignalData);
        } else {
          this.createPeer(from, false, signal as SimplePeer.SignalData);
        }
      });

      this.socket.on("voice-user-left", (userId: string) => {
        this.removePeer(userId);
      });
    } catch (err) {
      console.error("Failed to get microphone access:", err);
      throw err;
    }
  }

  private createPeer(
    userId: string,
    initiator: boolean,
    incomingSignal?: SimplePeer.SignalData
  ): void {
    if (this.peers.has(userId)) return;

    const peer = new SimplePeer({
      initiator,
      stream: this.localStream || undefined,
      trickle: true,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      },
    });

    peer.on("signal", (signal) => {
      this.socket.emit("voice-signal", { to: userId, signal });
    });

    peer.on("stream", (remoteStream) => {
      const audio = new Audio();
      audio.srcObject = remoteStream;
      audio.play().catch(() => {});
    });

    peer.on("error", (err) => {
      console.error(`Peer error with ${userId}:`, err);
      this.removePeer(userId);
    });

    peer.on("close", () => {
      this.removePeer(userId);
    });

    if (incomingSignal) {
      peer.signal(incomingSignal);
    }

    this.peers.set(userId, { peer, userId });
  }

  private removePeer(userId: string): void {
    const conn = this.peers.get(userId);
    if (conn) {
      conn.peer.destroy();
      this.peers.delete(userId);
    }
  }

  setMuted(muted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  stop(): void {
    this.socket.emit("voice-leave", this.roomId);
    this.peers.forEach((conn) => conn.peer.destroy());
    this.peers.clear();
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
    this.socket.off("voice-user-joined");
    this.socket.off("voice-signal");
    this.socket.off("voice-user-left");
  }
}
