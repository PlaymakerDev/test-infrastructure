// Types for the AI Chat (text-to-SQL) feature — mirrors the backend SSE/API
// contract described in docs/ai-chat/FRONTEND.md. SQL is never sent to the
// client; feedback references a turn via `message_id` (from the `done` frame).

// ── Business status codes (returned in body, independent of HTTP status) ──
export const RES_CODE = {
  SUCCESS: 20000,
  INTERNAL_ERROR: 50000,
  RATE_LIMIT: 42900,
  TOKEN_EXPIRED: 40119,
} as const

export type AskMode = "fast" | "accurate"
export type Confidence = "high" | "medium" | "low"

// ── Request ──
export interface AskRequest {
  message: string
  conversation_id?: string
  stream?: boolean
  mode?: AskMode
}

// ── Result table ──
// Cells are heterogeneous; the FE formats numbers/null/dates itself.
export type Cell = string | number | boolean | null

export interface ResultPayload {
  columns: string[]
  rows: Cell[][]
  row_count: number
}

// ── Chart hint — x/y are column names within result.columns ──
export type ChartType = "metric" | "bar" | "line" | "table"

export interface ChartHint {
  type: ChartType
  x?: string
  y?: string[]
}

// ── SSE frame payloads ──
export interface TokenPayload {
  text: string
}
export interface SuggestionsPayload {
  questions: string[]
}
export interface ExportPayload {
  message: string
  format: "xlsx" | "html"
}
export interface ErrorPayload {
  message: string
}
export interface DonePayload {
  confidence: Confidence
  message_id: string
}

// ── A single conversation turn rendered in the UI ──
export interface ChatTurn {
  id: string // local id for React keys
  question: string
  answer: string // streamed natural-language answer
  result?: ResultPayload
  chart?: ChartHint
  suggestions?: string[]
  exportHint?: ExportPayload
  confidence?: Confidence
  messageId?: string // from `done` frame — used for feedback
  status: "streaming" | "done" | "error"
  errorMessage?: string
  mode: AskMode
}
