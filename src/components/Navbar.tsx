"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            Doomscroll Party
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/lobby"
            className="text-sm text-white/70 hover:text-white transition-colors"
          >
            Lobby
          </Link>

          {session?.user ? (
            <div className="flex items-center gap-3">
              <Link href="/profile" className="flex items-center gap-2">
                {session.user.image && (
                  <Image
                    src={session.user.image}
                    alt=""
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                )}
                <span className="text-sm text-white/80 hidden sm:block">
                  {session.user.name}
                </span>
              </Link>
              <button
                onClick={() => signOut()}
                className="text-xs text-white/50 hover:text-white/80 transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn()}
              className="px-4 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
