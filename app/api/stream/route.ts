import { NextRequest, NextResponse } from "next/server";

const BLOCKED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0"];

function isPrivateHost(hostname: string): boolean {
  return (
    BLOCKED_HOSTS.includes(hostname) ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    hostname.startsWith("172.16.") ||
    hostname.startsWith("172.17.") ||
    hostname.startsWith("172.18.") ||
    hostname.startsWith("172.19.") ||
    hostname.startsWith("172.2") ||
    hostname.startsWith("172.30.") ||
    hostname.startsWith("172.31.")
  );
}

function resolveUrl(base: string, relative: string): string {
  // If already absolute, return as-is
  if (relative.startsWith("http://") || relative.startsWith("https://")) {
    return relative;
  }

  const baseUrl = new URL(base);

  if (relative.startsWith("/")) {
    // Absolute path — resolve against origin
    return `${baseUrl.protocol}//${baseUrl.host}${relative}`;
  }

  // Relative path — resolve against the base URL's directory
  const basePath = baseUrl.pathname.substring(
    0,
    baseUrl.pathname.lastIndexOf("/") + 1
  );
  return `${baseUrl.protocol}//${baseUrl.host}${basePath}${relative}`;
}

function rewriteM3u8(content: string, baseUrl: string): string {
  const lines = content.split("\n");
  const rewritten: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments (but preserve them)
    if (trimmed === "" || trimmed.startsWith("#")) {
      // Rewrite URI= attributes inside tags like #EXT-X-KEY or #EXT-X-MAP
      if (trimmed.includes("URI=")) {
        const rewrittenLine = trimmed.replace(
          /URI="([^"]+)"/g,
          (_match, uri) => {
            const absoluteUri = resolveUrl(baseUrl, uri);
            return `URI="/api/stream?url=${encodeURIComponent(absoluteUri)}"`;
          }
        );
        rewritten.push(rewrittenLine);
      } else {
        rewritten.push(line);
      }
      continue;
    }

    // This is a URL line (segment .ts, or variant .m3u8)
    const absoluteUrl = resolveUrl(baseUrl, trimmed);
    rewritten.push(`/api/stream?url=${encodeURIComponent(absoluteUrl)}`);
  }

  return rewritten.join("\n");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json(
      { error: "Missing 'url' query parameter" },
      { status: 400 }
    );
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(targetUrl);
  } catch {
    return NextResponse.json({ error: "Invalid URL encoding" }, { status: 400 });
  }

  // Validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(decoded);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (isPrivateHost(parsedUrl.hostname)) {
    return NextResponse.json(
      { error: "Requests to private networks are not allowed" },
      { status: 403 }
    );
  }

  try {
    // Fetch with redirect following enabled (default behavior)
    const response = await fetch(decoded, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "*/*",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return new NextResponse(`Upstream returned ${response.status}`, {
        status: response.status,
      });
    }

    // Determine the final URL after any redirects
    const finalUrl = response.url || decoded;
    const contentType = response.headers.get("content-type") || "";

    const isM3u8 =
      decoded.endsWith(".m3u8") ||
      finalUrl.endsWith(".m3u8") ||
      contentType.includes("mpegurl") ||
      contentType.includes("x-mpegURL");

    const isTs =
      decoded.endsWith(".ts") ||
      finalUrl.endsWith(".ts") ||
      contentType.includes("mp2t") ||
      contentType.includes("video/mp2t");

    if (isM3u8) {
      // Read the m3u8 content as text, rewrite all URLs
      const text = await response.text();
      const rewritten = rewriteM3u8(text, finalUrl);

      return new NextResponse(rewritten, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    if (isTs) {
      // For .ts segments, pipe the body directly
      const body = response.body;
      if (!body) {
        return new NextResponse("Empty response from upstream", { status: 502 });
      }

      return new NextResponse(body as ReadableStream, {
        status: 200,
        headers: {
          "Content-Type": "video/MP2T",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=60",
        },
      });
    }

    // For any other content type (e.g., key files), pass through
    const body = response.body;
    return new NextResponse(body as ReadableStream, {
      status: 200,
      headers: {
        "Content-Type": contentType || "application/octet-stream",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Stream proxy request failed";
    console.error("Stream proxy error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
