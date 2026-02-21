import { NextRequest, NextResponse } from "next/server";

// GET /api/instagram/oembed?url=...  — proxy Instagram oEmbed API
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL parameter required" }, { status: 400 });
  }

  // Validate it's an Instagram URL
  const instagramPattern = /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/(reel|reels|p)\//;
  if (!instagramPattern.test(url)) {
    return NextResponse.json(
      { error: "Invalid Instagram URL" },
      { status: 400 }
    );
  }

  try {
    const oembedUrl = `https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}&omitscript=true`;
    const response = await fetch(oembedUrl, {
      headers: {
        "User-Agent": "DoomscrollParty/1.0",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch oEmbed data" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Instagram oEmbed error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reel data" },
      { status: 500 }
    );
  }
}
