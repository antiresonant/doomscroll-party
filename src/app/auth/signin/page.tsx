"use client";

import { Suspense } from "react";
import { signIn, getProviders } from "next-auth/react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";

type Provider = {
  id: string;
  name: string;
  type: string;
};

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}

function SignInContent() {
  const [providers, setProviders] = useState<Record<string, Provider>>({});
  const [guestName, setGuestName] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/lobby";
  const error = searchParams.get("error");

  useEffect(() => {
    getProviders().then((p) => {
      if (p) setProviders(p);
    });
  }, []);

  const handleGuestSignIn = async () => {
    if (!guestName.trim()) return;
    setLoading(true);
    await signIn("credentials", {
      name: guestName.trim(),
      callbackUrl,
    });
  };

  const oauthProviders = Object.values(providers).filter(
    (p) => p.type !== "credentials"
  );

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black text-white pt-14 flex items-center justify-center">
        <div className="w-full max-w-sm mx-auto px-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <h1 className="text-2xl font-bold text-center mb-2">
              Join the Party
            </h1>
            <p className="text-sm text-white/50 text-center mb-6">
              Sign in to create or join a doomscroll party
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                {error === "CredentialsSignin"
                  ? "Invalid sign in. Please try again."
                  : `Error: ${error}`}
              </div>
            )}

            {/* Guest / Credentials sign in */}
            <div className="space-y-3 mb-6">
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGuestSignIn()}
                placeholder="Enter your name..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50"
              />
              <button
                onClick={handleGuestSignIn}
                disabled={!guestName.trim() || loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all"
              >
                {loading ? "Signing in..." : "Continue as Guest"}
              </button>
            </div>

            {/* OAuth providers */}
            {oauthProviders.length > 0 && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-black px-3 text-white/30">
                      or continue with
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {oauthProviders.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => signIn(provider.id, { callbackUrl })}
                      className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                      Sign in with {provider.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
