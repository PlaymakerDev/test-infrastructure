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
// "map" → choropleth by province/region (x = area column, y = value column).
export type ChartType = "metric" | "bar" | "line" | "map" | "table"

export interface ChartHint {
  type: ChartType
  x?: string
  y?: string[]
  value?: number | string // metric only — the single value for the card
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

// ── Provenance (§1) — data lineage shown under an answer. Live-only: emitted as
// a `provenance` frame (and in the JSON AskResult); NOT persisted in history, so
// re-rendered old turns won't carry it. `truncated` = result hit the ~200 cap.
export interface Provenance {
  source_views: string[]
  row_count: number
  truncated: boolean
}

// ── Feedback (§4) — references a turn by message_id; backend resolves SQL ──
export type FeedbackVote = "like" | "dislike"

export interface FeedbackRequest {
  conversation_id: string
  message_id: string
  vote: FeedbackVote
  note?: string
}

export type ExportFormat = "xlsx" | "html"

// ── Non-streaming /ask result (stream:false) — used by the dashboard and the
// compare view, where a one-shot answer is simpler than a stream. ──
export interface AskResult {
  message_id: string
  answer: string
  result?: ResultPayload
  chart?: ChartHint
  suggestions?: string[]
  confidence?: Confidence
  provenance?: Provenance
  action?: "export"
  format?: ExportFormat
}

// ── Conversation history (sidebar) ──
export interface ConversationSummary {
  id: string
  title: string
  updated_at: string // RFC3339
  message_count: number
}

// A persisted turn returned by GET /conversations/:id — full fidelity
// (no SQL). `id` is the message_id used for feedback.
export interface ConversationMessage {
  id: string
  question: string
  answer: string
  result?: ResultPayload
  chart?: ChartHint
  confidence?: Confidence
  suggestions?: string[]
  time: string // RFC3339
}

export interface ConversationDetail {
  id: string
  title: string
  created_at: string
  updated_at: string
  messages: ConversationMessage[]
}

// ── Proactive insights (§5) ──
export type InsightType = "status" | "mover"

export interface Insight {
  type: InsightType
  metric: string
  unit?: string
  recent: number
  prior: number
  pct_change: number
  direction: string // "offline" | "up" | "down"
  summary: string // Thai, ready to display
  road_code?: string
  road_name?: string
}

export interface InsightsResponse {
  period: string
  insights: Insight[]
}

// ── Map scope (§5.1) — the provinces/regions a user is responsible for (RLS).
// Fetched once and cached; used to draw/fit the choropleth to the user's area
// (incl. provinces with zero devices, which never appear in `result`).
// `scoped:false` = admin/unscoped → whole country.
export interface ScopeResponse {
  scoped: boolean
  provinces: string[] // full Thai names = th.provinces.name_th (match GeoJSON)
  regions: string[]
}

// ── Error classification for a turn (drives the error UI) ──
export type ChatErrorKind = "auth" | "rate_limit" | "generic"

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
  provenance?: Provenance // live-only data lineage (not in history)
  messageId?: string // from `done` frame — used for feedback
  status: "streaming" | "done" | "error"
  errorMessage?: string
  errorKind?: ChatErrorKind
  mode: AskMode
}
