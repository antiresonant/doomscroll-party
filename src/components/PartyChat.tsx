"use client";

import { useState, useRef, useEffect } from "react";
import { usePartyStore } from "@/stores/party-store";
import type { AppSocket } from "@/lib/socket";

interface PartyChatProps {
  socket: AppSocket | null;
}

export default function PartyChat({ socket }: PartyChatProps) {
  const { messages, chatOpen, toggleChat, roomId } = usePartyStore();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !socket || !roomId) return;
    socket.emit("chat-message", roomId, input.trim());
    setInput("");
  };

  if (!chatOpen) {
    return (
      <button
        onClick={toggleChat}
        className="fixed right-4 bottom-24 z-40 w-12 h-12 bg-purple-600 hover:bg-purple-500 rounded-full flex items-center justify-center shadow-lg transition-colors"
      >
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        {messages.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {messages.length > 99 ? "99" : messages.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed right-0 top-14 bottom-0 w-80 bg-black/90 backdrop-blur-md border-l border-white/10 z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white">Party Chat</h3>
        <button
          onClick={toggleChat}
          className="text-white/50 hover:text-white transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-white/30 text-sm mt-8">
            No messages yet. Say something!
          </p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex gap-2">
              {msg.type === "system" ? (
                <p className="text-xs text-white/30 italic w-full text-center py-1">
                  {msg.content}
                </p>
              ) : (
                <>
                  {msg.userImage ? (
                    <img
                      src={msg.userImage}
                      alt=""
                      className="w-6 h-6 rounded-full flex-shrink-0 mt-0.5"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-purple-500/30 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs text-purple-400 font-medium">
                      {msg.userName}
                    </p>
                    <p className="text-sm text-white/80 break-words">
                      {msg.content}
                    </p>
                  </div>
                </>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-white/10 disabled:text-white/30 rounded-lg text-sm text-white transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
