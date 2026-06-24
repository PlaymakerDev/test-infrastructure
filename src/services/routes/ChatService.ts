import chatHttp from "../chatHttp"
import type {
  AskMode,
  AskResult,
  ConversationDetail,
  ConversationSummary,
  FeedbackRequest,
  InsightsResponse,
  ScopeResponse,
} from "@/types/chat"

// Some endpoints may wrap the body in the { res_code, res_data } envelope
// (see FRONTEND.md §6) while others return the shape directly — tolerate both.
function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "res_data" in payload) {
    return (payload as { res_data: T }).res_data
  }
  return payload as T
}

export async function fetchConversations(): Promise<ConversationSummary[]> {
  const res = await chatHttp.get("/conversations")
  const data = unwrap<{ conversations: ConversationSummary[] }>(res.data)
  return data.conversations ?? []
}

export async function fetchConversation(
  id: string,
): Promise<ConversationDetail> {
  const res = await chatHttp.get(`/conversations/${id}`)
  return unwrap<ConversationDetail>(res.data)
}

export async function renameConversation(
  id: string,
  title: string,
): Promise<void> {
  await chatHttp.patch(`/conversations/${id}`, { title })
}

export async function deleteConversation(id: string): Promise<void> {
  await chatHttp.delete(`/conversations/${id}`)
}

// ── Export (§3) — re-runs the original question and returns a file ──
export async function exportXlsx(message: string): Promise<Blob> {
  const res = await chatHttp.post(
    "/export",
    { message, format: "xlsx" },
    { responseType: "blob" },
  )
  return res.data as Blob
}

export async function exportHtml(message: string): Promise<string> {
  const res = await chatHttp.post(
    "/export",
    { message, format: "html" },
    { responseType: "text" },
  )
  return res.data as string
}

// ── Feedback (§4) ──
export async function submitFeedback(body: FeedbackRequest): Promise<void> {
  await chatHttp.post("/feedback", body)
}

// ── Proactive insights (§5) ──
export async function fetchInsights(): Promise<InsightsResponse> {
  const res = await chatHttp.get("/insights")
  return unwrap<InsightsResponse>(res.data)
}

// ── Map scope (§5.1) — the user's provinces/regions, for bounding the map ──
export async function fetchScope(): Promise<ScopeResponse> {
  const res = await chatHttp.get("/scope")
  return unwrap<ScopeResponse>(res.data)
}

// ── One-shot ask (stream:false) — for dashboard cards & compare panes ──
export async function askOnce(
  message: string,
  mode: AskMode = "fast",
): Promise<AskResult> {
  const res = await chatHttp.post("/ask", { message, stream: false, mode })
  return unwrap<AskResult>(res.data)
}
