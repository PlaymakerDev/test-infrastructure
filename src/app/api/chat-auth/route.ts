import axios from "axios"
import { NextRequest, NextResponse } from "next/server"

// Dev-only: mint (and cache) a token from the LOCAL chat auth service, whose
// auth differs from the app's main backend. Lets the chat UI be tested against
// a local stack. Active only when CHAT_DEV_AUTH_* env vars are set — in
// production they're unset and this route returns null (no-op). Credentials
// stay server-side (no NEXT_PUBLIC), so they never reach the browser.
const AUTH_URL = process.env.CHAT_DEV_AUTH_URL
const USER = process.env.CHAT_DEV_AUTH_USER
const PASS = process.env.CHAT_DEV_AUTH_PASS
const API_KEY = process.env.NEXT_PUBLIC_API_KEY

let cache: { token: string; expiresAt: number } | null = null

function decodeJwtExpMs(token: string): number | null {
  try {
    const payload = token.split(".")[1]
    const json = Buffer.from(
      payload.replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    ).toString("utf8")
    const exp = JSON.parse(json)?.exp
    return typeof exp === "number" ? exp * 1000 : null
  } catch {
    return null
  }
}

async function mintToken(): Promise<string | null> {
  if (!AUTH_URL || !USER || !PASS) return null
  try {
    const res = await axios.post(
      `${AUTH_URL}/api/auth/login`,
      { username: USER, password: PASS },
      { headers: { "x-api-key": API_KEY ?? "" } },
    )
    const token: string | null =
      res.data?.access_token ?? res.data?.res_data?.access_token ?? null
    if (token) {
      const expMs = decodeJwtExpMs(token)
      cache = { token, expiresAt: expMs ?? Date.now() + 5 * 60_000 }
    }
    return token
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const force = request.nextUrl.searchParams.get("refresh") === "1"
  if (!force && cache && cache.expiresAt > Date.now() + 30_000) {
    return NextResponse.json({ access_token: cache.token })
  }
  return NextResponse.json({ access_token: await mintToken() })
}
