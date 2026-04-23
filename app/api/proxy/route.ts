import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json(
      { error: "Missing 'url' query parameter" },
      { status: 400 }
    );
  }

  try {
    const decoded = decodeURIComponent(targetUrl);

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(decoded);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Block requests to internal/private networks
    const hostname = parsedUrl.hostname;
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.")
    ) {
      return NextResponse.json(
        { error: "Requests to private networks are not allowed" },
        { status: 403 }
      );
    }

    const response = await fetch(decoded, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(15000),
    });

    const contentType = response.headers.get("content-type") || "";

    // For HLS streams, return as-is with appropriate headers
    if (
      decoded.endsWith(".m3u8") ||
      decoded.endsWith(".ts") ||
      contentType.includes("mpegurl") ||
      contentType.includes("mp2t")
    ) {
      const body = await response.arrayBuffer();
      const headers = new Headers();
      headers.set("Content-Type", contentType || "application/vnd.apple.mpegurl");
      headers.set("Access-Control-Allow-Origin", "*");
      return new NextResponse(body, { status: response.status, headers });
    }

    // For JSON API responses
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Proxy request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
