import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET /api/rooms/[id] — get room details
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const room = await prisma.room.findUnique({
    where: { id: params.id },
    include: {
      host: { select: { id: true, name: true, image: true } },
      members: {
        where: { isActive: true },
        include: { user: { select: { id: true, name: true, image: true } } },
      },
      reels: { orderBy: { position: "asc" } },
    },
  });

  if (!room) {
    // Try finding by code
    const byCode = await prisma.room.findUnique({
      where: { code: params.id },
      include: {
        host: { select: { id: true, name: true, image: true } },
        members: {
          where: { isActive: true },
          include: { user: { select: { id: true, name: true, image: true } } },
        },
        reels: { orderBy: { position: "asc" } },
      },
    });

    if (!byCode) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json(formatRoom(byCode));
  }

  return NextResponse.json(formatRoom(room));
}

// POST /api/rooms/[id] — join a room
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const room = await prisma.room.findFirst({
    where: {
      OR: [{ id: params.id }, { code: params.id }],
    },
  });

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  // Upsert membership
  await prisma.roomMember.upsert({
    where: { userId_roomId: { userId, roomId: room.id } },
    update: { isActive: true },
    create: { userId, roomId: room.id },
  });

  return NextResponse.json({ roomId: room.id, code: room.code });
}

// DELETE /api/rooms/[id] — end a room (host only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const room = await prisma.room.findUnique({
    where: { id: params.id },
  });

  if (!room || room.hostId !== userId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  await prisma.room.update({
    where: { id: params.id },
    data: { status: "ended" },
  });

  return NextResponse.json({ success: true });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatRoom(room: Record<string, any>) {
  return {
    id: room.id,
    name: room.name,
    description: room.description,
    code: room.code,
    hostId: room.hostId,
    hostName: room.host.name,
    hostImage: room.host.image,
    status: room.status,
    currentReelIndex: room.currentReelIndex,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    members: room.members.map((m: Record<string, any>) => ({
      id: m.id,
      userId: m.user.id,
      name: m.user.name,
      image: m.user.image,
      isActive: m.isActive,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reels: room.reels.map((r: Record<string, any>) => ({
      id: r.id,
      url: r.url,
      title: r.title,
      thumbnail: r.thumbnail,
      authorName: r.authorName,
      position: r.position,
    })),
    createdAt: room.createdAt.toISOString(),
  };
}
