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

export const TOKEN_EXPIRED_CODE = 40199 // recoverable: refresh + retry
export const TOKEN_INVALID_CODE = 40100 // not recoverable here: surface error

const DEV_TOKEN = process.env.NEXT_PUBLIC_CHAT_DEV_TOKEN
const LOCAL_AUTH = process.env.NEXT_PUBLIC_CHAT_LOCAL_AUTH === "true"

const tokenSource = DEV_TOKEN ? "dev-token" : LOCAL_AUTH ? "local-auth" : "session"

let refreshInFlight: Promise<boolean> | null = null

export function isTokenExpired(resCode: unknown): boolean {
  return resCode === TOKEN_EXPIRED_CODE
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
export async function getChatAccessToken(): Promise<string | null> {
  if (DEV_TOKEN) return DEV_TOKEN
  const endpoint = LOCAL_AUTH ? "/api/chat-auth" : "/api/auth/session"
  try {
    const res = await fetch(endpoint)
    const { access_token } = await res.json()
    return access_token ?? null
  } catch {
    return null
  }
}

// Recover from an expired token. Local-auth mode re-mints via the dev route;
// session mode refreshes the app session. A fixed dev token can't be refreshed.
export function refreshChatSession(): Promise<boolean> {
  if (DEV_TOKEN) return Promise.resolve(false)

  if (LOCAL_AUTH) {
    return fetch("/api/chat-auth?refresh=1")
      .then((res) => res.json())
      .then((data) => !!data?.access_token)
      .catch(() => false)
  }

  if (refreshInFlight) return refreshInFlight
  refreshInFlight = (async () => {
    try {
      const sessionRes = await fetch("/api/auth/session")
      const { refresh_token } = await sessionRes.json()
      if (!refresh_token) return false
      await axios.post("/api/auth/refresh", { refresh_token })
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
    await axios.post("/api/auth/logout", {})
  } catch {
    // ignore — redirect regardless
  }
  if (typeof window !== "undefined") {
    window.location.href = "/auth/login"
  }
}
