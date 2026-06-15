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
  DonePayload,
  ExportPayload,
  ResultPayload,
} from "@/types/chat"

const CHAT_BASE = (process.env.NEXT_PUBLIC_CHAT_API ?? "").replace(/\/+$/, "")
const API_KEY = process.env.NEXT_PUBLIC_API_KEY

export interface AskStreamHandlers {
  onResult?: (payload: ResultPayload) => void
  onChart?: (payload: ChartHint) => void
  onToken?: (text: string) => void
  onSuggestions?: (questions: string[]) => void
  onExport?: (payload: ExportPayload) => void
  onError?: (message: string) => void
  onDone?: (payload: DonePayload) => void
}

const RATE_LIMIT_MESSAGE =
  "มีคำถามเข้ามาถี่เกินไป กรุณาลองใหม่อีกครั้งในสักครู่"
const GENERIC_ERROR_MESSAGE =
  "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง"

async function getAccessToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/session")
    const { access_token } = await res.json()
    return access_token ?? null
  } catch {
    return null
  }
}

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
    case "export":
      handlers.onExport?.(data as ExportPayload)
      return false
    case "error":
      handlers.onError?.(
        (data as { message?: string }).message || GENERIC_ERROR_MESSAGE,
      )
      return true
    case "done":
      handlers.onDone?.(data as DonePayload)
      return true
    default:
      return false
  }
}

/**
 * Stream an `/ask` request. Resolves when the stream ends. Throws on abort
 * (AbortError) — the caller is expected to treat that as a user-initiated stop.
 */
export async function streamAsk(
  body: AskRequest,
  handlers: AskStreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const token = await getAccessToken()

  const res = await fetch(`${CHAT_BASE}/api/chat/ask`, {
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
    handlers.onError?.(
      res.status === 429 ? RATE_LIMIT_MESSAGE : GENERIC_ERROR_MESSAGE,
    )
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
