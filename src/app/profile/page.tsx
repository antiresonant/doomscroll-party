"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    router.push("/");
    return null;
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black text-white pt-14">
        <div className="max-w-lg mx-auto px-4 py-12">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            {session.user?.image && (
              <Image
                src={session.user.image}
                alt=""
                width={96}
                height={96}
                className="rounded-full mx-auto mb-4"
              />
            )}

            <h1 className="text-2xl font-bold mb-1">
              {session.user?.name || "Anonymous"}
            </h1>
            <p className="text-sm text-white/50 mb-6">
              {session.user?.email}
            </p>

            <div className="space-y-3">
              <button
                onClick={() => router.push("/lobby")}
                className="w-full px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-semibold rounded-xl text-sm transition-all"
              >
                Go to Lobby
              </button>

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white/70 rounded-xl text-sm transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
