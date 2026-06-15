// Shared token handling for the chat transports (chatHttp + chatStream).
//
// Chat is a SEPARATE service/host. The same JWT works there, but a chat auth
// failure must NOT log the user out of the whole app (the main session may be
// perfectly valid) — we only surface a chat-scoped error. The one recovery we
// attempt is a silent refresh on res_code 40199 (expired); 40100 (invalid) is
// surfaced as-is. Concurrent callers share one in-flight refresh.
import axios from "axios"

export const TOKEN_EXPIRED_CODE = 40199 // recoverable: refresh + retry
export const TOKEN_INVALID_CODE = 40100 // not recoverable here: surface error

// Dev-only override: when set, this token is used as the chat Bearer instead of
// the session token, so the chat UI can be tested against a local backend
// without the SSO refresh flow. Leave unset in production.
const DEV_TOKEN = process.env.NEXT_PUBLIC_CHAT_DEV_TOKEN

export const usingDevToken = !!DEV_TOKEN

let refreshInFlight: Promise<boolean> | null = null

// Dev-only diagnostic — surfaces what was sent and what came back so chat auth
// issues are debuggable. No-op in production.
export function debugChatAuth(context: string, info: Record<string, unknown>): void {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[chat-auth] ${context}`, {
      tokenSource: usingDevToken ? "dev-token" : "session",
      ...info,
    })
  }
}

// User-initiated recovery from a chat auth failure: clear the (stale) session
// and go to login. Re-login yields a fresh login token, which the chat backend
// accepts. NOT called automatically — chat never force-logs-out the app.
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

export function isTokenExpired(resCode: unknown): boolean {
  return resCode === TOKEN_EXPIRED_CODE
}

export function isTokenInvalid(resCode: unknown): boolean {
  return resCode === TOKEN_INVALID_CODE
}

// Resolve the Bearer token for every chat request (chatHttp + chatStream).
export async function getChatAccessToken(): Promise<string | null> {
  if (DEV_TOKEN) return DEV_TOKEN
  try {
    const res = await fetch("/api/auth/session")
    const { access_token } = await res.json()
    return access_token ?? null
  } catch {
    return null
  }
}

export function refreshChatSession(): Promise<boolean> {
  // A manually-provided dev token can't be refreshed — don't touch the session.
  if (DEV_TOKEN) return Promise.resolve(false)
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
