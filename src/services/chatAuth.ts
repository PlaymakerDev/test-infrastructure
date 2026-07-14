// Shared token handling for the chat transports (chatHttp + chatStream).
//
// Chat is a SEPARATE service/host. A chat auth failure must NOT log the user
// out of the whole app (the main session may be valid) — we only surface a
// chat-scoped error.
//
// Token source priority:
//   1. NEXT_PUBLIC_CHAT_DEV_TOKEN — a fixed dev token (manual override)
//   2. NEXT_PUBLIC_CHAT_LOCAL_AUTH=true — mint/refresh via the dev-only
//      /api/chat-auth route (local stack whose auth differs from the app)
//   3. the app session token (production default)
import axios from "axios"

// Token expired (recoverable). The backend returns 40199 in practice; FRONTEND.md
// documents 40119 — accept both to be safe.
export const TOKEN_EXPIRED_CODES = [40199, 40119]
export const TOKEN_INVALID_CODE = 40100 // not recoverable here: surface error

const DEV_TOKEN = process.env.NEXT_PUBLIC_CHAT_DEV_TOKEN
const LOCAL_AUTH = process.env.NEXT_PUBLIC_CHAT_LOCAL_AUTH === "true"

// basePath ('/atlas' in prod, '' in dev) — raw fetch/axios to the app's own
// routes aren't basePath-prefixed automatically, so prepend it.
const BASE_PATH = process.env.__NEXT_ROUTER_BASEPATH ?? ""

const tokenSource = DEV_TOKEN ? "dev-token" : LOCAL_AUTH ? "local-auth" : "session"

let refreshInFlight: Promise<boolean> | null = null
let tokenInFlight: Promise<string | null> | null = null

export function isTokenExpired(resCode: unknown): boolean {
  return typeof resCode === "number" && TOKEN_EXPIRED_CODES.includes(resCode)
}

export function isTokenInvalid(resCode: unknown): boolean {
  return resCode === TOKEN_INVALID_CODE
}

// Dev-only diagnostic — surfaces what was sent and what came back so chat auth
// issues are debuggable. No-op in production.
export function debugChatAuth(context: string, info: Record<string, unknown>): void {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[chat-auth] ${context}`, { tokenSource, ...info })
  }
}

// Resolve the Bearer token for every chat request (chatHttp + chatStream).
// Concurrent callers (e.g. the initial insights + conversations fetches) are
// coalesced into a single in-flight request so we don't hit the auth endpoint
// twice at once. Once it settles, the next request fetches fresh (no stale
// caching across calls).
export async function getChatAccessToken(): Promise<string | null> {
  if (DEV_TOKEN) return DEV_TOKEN
  if (tokenInFlight) return tokenInFlight

  const endpoint = `${BASE_PATH}${LOCAL_AUTH ? "/api/chat-auth" : "/api/auth/session"}`
  tokenInFlight = (async () => {
    try {
      const res = await fetch(endpoint)
      const { access_token } = await res.json()
      return access_token ?? null
    } catch {
      return null
    } finally {
      tokenInFlight = null
    }
  })()
  return tokenInFlight
}

// Recover from an expired token. Local-auth mode re-mints via the dev route;
// session mode refreshes the app session. A fixed dev token can't be refreshed.
export function refreshChatSession(): Promise<boolean> {
  if (DEV_TOKEN) return Promise.resolve(false)

  if (LOCAL_AUTH) {
    return fetch(`${BASE_PATH}/api/chat-auth?refresh=1`)
      .then((res) => res.json())
      .then((data) => !!data?.access_token)
      .catch(() => false)
  }

  if (refreshInFlight) return refreshInFlight
  refreshInFlight = (async () => {
    try {
      // Empty body — the route reads refresh_token from the server-side cookie.
      // Wrap in the same Web Lock as BaseService (keep the name in sync) so the
      // shared refresh token is never rotated concurrently → no rotation race.
      const doRefresh = () => axios.post(`${BASE_PATH}/api/auth/refresh`, {})
      const locks = typeof navigator !== "undefined" ? navigator.locks : undefined
      await (locks?.request ? locks.request("drr-auth-refresh", doRefresh) : doRefresh())
      return true
    } catch {
      return false
    } finally {
      refreshInFlight = null
    }
  })()
  return refreshInFlight
}

// User-initiated recovery from a chat auth failure (session mode): clear the
// stale session and go to login. NOT called automatically.
export async function reloginChat(): Promise<void> {
  try {
    await axios.post(`${BASE_PATH}/api/auth/logout`, {})
  } catch {
    // ignore — redirect regardless
  }
  if (typeof window !== "undefined") {
    window.location.href = "/auth/login"
  }
}
