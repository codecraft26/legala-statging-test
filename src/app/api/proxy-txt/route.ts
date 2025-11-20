import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid url" },
        { status: 400 }
      );
    }

    const upstream = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "text/plain,*/*",
      },
    });

    if (!upstream.ok) {
      const message = await upstream.text();
      return NextResponse.json(
        {
          error: `Failed to fetch remote file (${upstream.status} ${upstream.statusText})`,
          details: message.slice(0, 2000),
        },
        { status: upstream.status }
      );
    }

    const text = await upstream.text();
    return NextResponse.json({ text });
  } catch (error) {
    console.error("proxy-txt error:", error);
    return NextResponse.json(
      { error: "Unable to fetch remote file." },
      { status: 500 }
    );
  }
}

