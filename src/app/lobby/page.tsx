"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import RoomCard from "@/components/RoomCard";

interface Room {
  id: string;
  name: string;
  description: string | null;
  code: string;
  hostName: string | null;
  memberCount: number;
  status: string;
}

export default function LobbyPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [newRoom, setNewRoom] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchRooms() {
    try {
      const res = await fetch("/api/rooms");
      const data = await res.json();
      setRooms(data);
    } catch {
      console.error("Failed to fetch rooms");
    } finally {
      setLoading(false);
    }
  }

  async function createRoom() {
    if (!newRoom.name.trim() || !session) return;
    setCreating(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRoom),
      });
      const data = await res.json();
      if (data.id) {
        router.push(`/party/${data.id}`);
      }
    } catch {
      alert("Failed to create room");
    } finally {
      setCreating(false);
    }
  }

  async function joinByCode() {
    if (!joinCode.trim() || !session) return;
    try {
      const res = await fetch(`/api/rooms/${joinCode.trim().toUpperCase()}`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.roomId) {
        router.push(`/party/${data.roomId}`);
      } else {
        alert("Room not found");
      }
    } catch {
      alert("Failed to join room");
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black text-white pt-14">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Party Lobby</h1>
            {session && (
              <button
                onClick={() => setShowCreate(!showCreate)}
                className="px-5 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-semibold rounded-full text-sm transition-all"
              >
                {showCreate ? "Cancel" : "Create Party"}
              </button>
            )}
          </div>

          {/* Join by code */}
          <div className="mb-6 flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && joinByCode()}
              placeholder="Enter room code..."
              maxLength={6}
              className="flex-1 max-w-xs bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 font-mono tracking-widest"
            />
            <button
              onClick={joinByCode}
              disabled={!joinCode.trim() || !session}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white rounded-xl text-sm transition-colors"
            >
              Join
            </button>
          </div>

          {/* Create room form */}
          {showCreate && session && (
            <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-2xl">
              <h2 className="text-lg font-semibold mb-4">Create New Party</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  value={newRoom.name}
                  onChange={(e) =>
                    setNewRoom({ ...newRoom, name: e.target.value })
                  }
                  placeholder="Party name..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50"
                />
                <textarea
                  value={newRoom.description}
                  onChange={(e) =>
                    setNewRoom({ ...newRoom, description: e.target.value })
                  }
                  placeholder="Description (optional)..."
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 resize-none"
                />
                <button
                  onClick={createRoom}
                  disabled={!newRoom.name.trim() || creating}
                  className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all"
                >
                  {creating ? "Creating..." : "Create & Join"}
                </button>
              </div>
            </div>
          )}

          {/* Room list */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold mb-2">No active parties</h3>
              <p className="text-white/50 text-sm">
                Be the first to create a party!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rooms.map((room) => (
                <RoomCard key={room.id} {...room} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
