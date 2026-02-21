"use client";

import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function Home() {
  const { data: session } = useSession();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black text-white">
        {/* Hero section */}
        <div className="relative overflow-hidden">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-black" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-radial from-purple-500/10 to-transparent rounded-full blur-3xl" />

          <div className="relative max-w-4xl mx-auto px-4 pt-32 pb-20 text-center">
            <h1 className="text-5xl sm:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
                Doomscroll
              </span>
              <br />
              <span className="text-white">Party</span>
            </h1>

            <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-8">
              Watch Instagram Reels together. The feed only moves when
              <span className="text-purple-400 font-medium">
                {" "}
                everyone
              </span>{" "}
              swipes up. Can&apos;t agree? Voice chat auto-triggers so holdouts
              can explain themselves.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              {session ? (
                <>
                  <Link
                    href="/lobby"
                    className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-semibold rounded-full transition-all shadow-lg shadow-purple-500/25"
                  >
                    Create a Party
                  </Link>
                  <Link
                    href="/lobby"
                    className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full transition-all"
                  >
                    Browse Parties
                  </Link>
                </>
              ) : (
                <button
                  onClick={() => signIn()}
                  className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-semibold rounded-full transition-all shadow-lg shadow-purple-500/25"
                >
                  Sign in to Get Started
                </button>
              )}
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="text-3xl mb-3">🤝</div>
                <h3 className="text-lg font-semibold mb-2">
                  Consensus Scroll
                </h3>
                <p className="text-sm text-white/50">
                  The feed only advances when ALL party members swipe up.
                  Democracy in action.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="text-3xl mb-3">🎙️</div>
                <h3 className="text-lg font-semibold mb-2">
                  Auto Voice Chat
                </h3>
                <p className="text-sm text-white/50">
                  Can&apos;t agree? After 15 seconds, voice chat opens so
                  holdouts can defend their position.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="text-3xl mb-3">📱</div>
                <h3 className="text-lg font-semibold mb-2">Watch Together</h3>
                <p className="text-sm text-white/50">
                  Everyone sees the exact same reel at the same time. Share
                  reactions in real-time chat.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="max-w-4xl mx-auto px-4 py-20">
          <h2 className="text-3xl font-bold text-center mb-12">
            How It Works
          </h2>

          <div className="space-y-8">
            {[
              {
                step: "1",
                title: "Create a Party",
                desc: "Start a room and share the invite code with friends.",
              },
              {
                step: "2",
                title: "Queue Up Reels",
                desc: "Paste Instagram Reel URLs to build your party playlist.",
              },
              {
                step: "3",
                title: "Watch Together",
                desc: "Everyone sees the same reel. Swipe up when you're ready to move on.",
              },
              {
                step: "4",
                title: "Reach Consensus",
                desc: "The feed advances only when everyone swipes. Disagree? Voice chat kicks in.",
              },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-white/50">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
