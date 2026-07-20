import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { NextRequest, NextResponse } from "next/server";
import { SessionData, sessionOptions } from "@/lib/defaultSession";

// Same-origin image proxy for PDF exports.
//
// Detection photos live on hosts that don't send CORS headers (e.g.
// wts.drr.go.th) — an on-screen <img> renders them fine, but the export needs
// the raw bytes (fetch → canvas → PDF embed), which CORS blocks. This route
// fetches server-side and streams the image back same-origin.
//
// Guards (this is otherwise an open SSRF proxy):
//  • session required — same iron-session the rest of the app uses
//  • host allowlist — *.drr.go.th plus the configured backend host only
//  • http(s) only, 10s timeout, image/* responses only

const ALLOWED_HOST_SUFFIX = ".drr.go.th";

const backendHost = ((): string | null => {
  try {
    return new URL(process.env.NEXT_PUBLIC_HOST_BACKEND ?? "").hostname || null;
  } catch {
    return null;
  }
})();

function isAllowedUrl(raw: string): URL | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    const host = url.hostname.toLowerCase();
    const allowed =
      host === backendHost ||
      host === ALLOWED_HOST_SUFFIX.slice(1) ||
      host.endsWith(ALLOWED_HOST_SUFFIX);
    return allowed ? url : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.access_token) {
    return NextResponse.json({ message: "unauthorized" }, { status: 401 });
  }

  const raw = request.nextUrl.searchParams.get("url") ?? "";
  const url = isAllowedUrl(raw);
  if (!url) {
    return NextResponse.json({ message: "url not allowed" }, { status: 400 });
  }

  try {
    const upstream = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!upstream.ok) {
      return NextResponse.json({ message: `upstream ${upstream.status}` }, { status: 502 });
    }
    const contentType = upstream.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ message: "not an image" }, { status: 502 });
    }
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Detection snapshots are immutable — let the browser cache them for
        // the session so re-exports don't re-download every photo.
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ message: "fetch failed" }, { status: 502 });
  }
}
