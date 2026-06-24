// Streaming transport for POST /api/chat/ask.
//
// `/ask` is POST + Server-Sent Events, so the native EventSource (GET-only)
// cannot be used. We read the ReadableStream manually and parse SSE frames.
// The JWT is the same token the rest of the app uses — fetched from the
// iron-session cookie via GET /api/auth/session (same mechanism as
// BaseService) and attached as `Authorization: Bearer`.
//
// `error` OR `done` both terminate the stream (an `error` frame is NOT
// followed by `done`).

import type {
  AskRequest,
  ChartHint,
  ChatErrorKind,
  DonePayload,
  ExportPayload,
  Provenance,
  ResultPayload,
} from "@/types/chat"
import {
  debugChatAuth,
  getChatAccessToken,
  isTokenExpired,
  isTokenInvalid,
  refreshChatSession,
} from "./chatAuth"

const CHAT_BASE = (process.env.NEXT_PUBLIC_CHAT_API ?? "").replace(/\/+$/, "")
const API_KEY = process.env.NEXT_PUBLIC_API_KEY

export interface AskStreamHandlers {
  onResult?: (payload: ResultPayload) => void
  onChart?: (payload: ChartHint) => void
  onToken?: (text: string) => void
  onSuggestions?: (questions: string[]) => void
  onProvenance?: (payload: Provenance) => void
  onExport?: (payload: ExportPayload) => void
  onError?: (message: string, kind: ChatErrorKind) => void
  onDone?: (payload: DonePayload) => void
}

const RATE_LIMIT_MESSAGE =
  "มีคำถามเข้ามาถี่เกินไป กรุณาลองใหม่อีกครั้งในสักครู่"
const GENERIC_ERROR_MESSAGE =
  "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง"
const AUTH_EXPIRED_MESSAGE = "เซสชันหมดอายุ — กรุณาเข้าสู่ระบบใหม่"
const AUTH_INVALID_MESSAGE =
  "เซสชันไม่ถูกต้องสำหรับระบบ Smart Search — กรุณาเข้าสู่ระบบใหม่"
const NOT_CONFIGURED_MESSAGE =
  "ยังไม่ได้ตั้งค่าที่อยู่ของระบบ Smart Search (NEXT_PUBLIC_CHAT_API)"

interface RawFrame {
  event: string
  data: string
}

// Parse one SSE block ("event: <type>\ndata: <json>"). Multiple `data:`
// lines are concatenated per the SSE spec.
function parseFrame(block: string): RawFrame | null {
  let event = "message"
  const dataLines: string[] = []

  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim()
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).replace(/^\s/, ""))
    }
  }

  if (!dataLines.length) return null
  return { event, data: dataLines.join("\n") }
}

// Dispatch a parsed frame. Returns true when the stream should end
// (`error` or `done`).
function dispatchFrame(frame: RawFrame, handlers: AskStreamHandlers): boolean {
  let data: unknown
  try {
    data = JSON.parse(frame.data)
  } catch {
    return false
  }

  switch (frame.event) {
    case "result":
      handlers.onResult?.(data as ResultPayload)
      return false
    case "chart":
      handlers.onChart?.(data as ChartHint)
      return false
    case "token":
      handlers.onToken?.((data as { text?: string }).text ?? "")
      return false
    case "suggestions":
      handlers.onSuggestions?.((data as { questions?: string[] }).questions ?? [])
      return false
    case "provenance":
      handlers.onProvenance?.(data as Provenance)
      return false
    case "export":
      handlers.onExport?.(data as ExportPayload)
      return false
    case "error":
      handlers.onError?.(
        (data as { message?: string }).message || GENERIC_ERROR_MESSAGE,
        "generic",
      )
      return true
    case "done":
      handlers.onDone?.(data as DonePayload)
      return true
    default:
      return false
  }
}

// Auth failures happen before streaming starts (non-2xx response). Read the
// body to detect res_code 40199 (token expired) without consuming the stream.
async function readResCode(res: Response): Promise<number | undefined> {
  try {
    const data = await res.clone().json()
    return data?.res_code
  } catch {
    return undefined
  }
}

/**
 * Stream an `/ask` request. Resolves when the stream ends. Throws on abort
 * (AbortError) — the caller is expected to treat that as a user-initiated stop.
 * On an expired token it refreshes the session once and retries transparently.
 */
export async function streamAsk(
  body: AskRequest,
  handlers: AskStreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  return runStream(body, handlers, signal, false)
}

async function runStream(
  body: AskRequest,
  handlers: AskStreamHandlers,
  signal: AbortSignal | undefined,
  isRetry: boolean,
): Promise<void> {
  if (!CHAT_BASE) {
    handlers.onError?.(NOT_CONFIGURED_MESSAGE, "generic")
    return
  }

  const url = `${CHAT_BASE}/api/chat/ask`
  const token = await getChatAccessToken()

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(API_KEY ? { "x-api-key": API_KEY } : {}),
    },
    body: JSON.stringify({ stream: true, mode: "fast", ...body }),
    signal,
  })

  if (!res.ok || !res.body) {
    const resCode = await readResCode(res)
    debugChatAuth("ask failed", { url, status: res.status, resCode, isRetry })

    if (res.status === 429) {
      handlers.onError?.(RATE_LIMIT_MESSAGE, "rate_limit")
      return
    }

    // Expired token / 401 (recoverable): refresh once and retry transparently.
    if (!isRetry && (isTokenExpired(resCode) || res.status === 401)) {
      if (await refreshChatSession()) {
        return runStream(body, handlers, signal, true)
      }
      handlers.onError?.(AUTH_EXPIRED_MESSAGE, "auth")
      return
    }

    // Invalid token (incl. a refreshed token the chat backend rejects): surface
    // an actionable auth error — do NOT log the user out of the whole app.
    if (isTokenInvalid(resCode) || res.status === 401) {
      handlers.onError?.(AUTH_INVALID_MESSAGE, "auth")
      return
    }

    handlers.onError?.(GENERIC_ERROR_MESSAGE, "generic")
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let sep: number
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const block = buffer.slice(0, sep)
      buffer = buffer.slice(sep + 2)
      const frame = parseFrame(block)
      if (!frame) continue
      if (dispatchFrame(frame, handlers)) return // error or done = end
    }
  }
}
