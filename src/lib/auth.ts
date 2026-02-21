import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Credentials provider for local dev (no OAuth setup needed)
    CredentialsProvider({
      name: "Guest",
      credentials: {
        name: { label: "Display Name", type: "text", placeholder: "Your name" },
      },
      async authorize(credentials) {
        const name = credentials?.name?.trim();
        if (!name) return null;

        // Find or create a user by name
        let user = await prisma.user.findFirst({
          where: { name },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              name,
              email: `${name.toLowerCase().replace(/\s+/g, ".")}@guest.local`,
            },
          });
        }

        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
    ...(process.env.DISCORD_CLIENT_ID
      ? [
          DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID!,
            clientSecret: process.env.DISCORD_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
