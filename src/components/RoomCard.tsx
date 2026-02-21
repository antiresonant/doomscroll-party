"use client";

import Link from "next/link";

interface RoomCardProps {
  id: string;
  name: string;
  description: string | null;
  code: string;
  hostName: string | null;
  memberCount: number;
  status: string;
}

export default function RoomCard({
  id,
  name,
  description,
  code,
  hostName,
  memberCount,
  status,
}: RoomCardProps) {
  return (
    <Link href={`/party/${id}`}>
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:border-purple-500/50 transition-all duration-300 p-5 cursor-pointer">
        {/* Status indicator */}
        <div className="absolute top-4 right-4">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
              status === "active"
                ? "bg-green-500/20 text-green-400"
                : "bg-yellow-500/20 text-yellow-400"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                status === "active"
                  ? "bg-green-400 animate-pulse"
                  : "bg-yellow-400"
              }`}
            />
            {status === "active" ? "Live" : "Waiting"}
          </span>
        </div>

        {/* Room info */}
        <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors pr-20">
          {name}
        </h3>

        {description && (
          <p className="mt-1 text-sm text-white/50 line-clamp-2">
            {description}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-white/40">
            <span className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {memberCount}
            </span>

            {hostName && (
              <span className="text-white/30">
                Host: {hostName}
              </span>
            )}
          </div>

          <span className="text-xs font-mono text-white/30 bg-white/5 px-2 py-1 rounded">
            {code}
          </span>
        </div>
      </div>
    </Link>
  );
}
