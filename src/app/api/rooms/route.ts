import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// GET /api/rooms — list active rooms
export async function GET() {
  const rooms = await prisma.room.findMany({
    where: { status: { not: "ended" } },
    include: {
      host: { select: { id: true, name: true, image: true } },
      _count: { select: { members: { where: { isActive: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const result = rooms.map((room) => ({
    id: room.id,
    name: room.name,
    description: room.description,
    code: room.code,
    hostId: room.hostId,
    hostName: room.host.name,
    hostImage: room.host.image,
    status: room.status,
    memberCount: room._count.members,
    currentReelIndex: room.currentReelIndex,
    createdAt: room.createdAt.toISOString(),
  }));

  return NextResponse.json(result);
}

// POST /api/rooms — create a new room
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "Room name is required" },
      { status: 400 }
    );
  }

  const userId = (session.user as { id: string }).id;

  // Generate unique room code
  let code = generateRoomCode();
  let attempts = 0;
  while (attempts < 10) {
    const existing = await prisma.room.findUnique({ where: { code } });
    if (!existing) break;
    code = generateRoomCode();
    attempts++;
  }

  const room = await prisma.room.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      code,
      hostId: userId,
      members: {
        create: {
          userId,
        },
      },
    },
    include: {
      host: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json({
    id: room.id,
    name: room.name,
    description: room.description,
    code: room.code,
    hostId: room.hostId,
    status: room.status,
  });
}
