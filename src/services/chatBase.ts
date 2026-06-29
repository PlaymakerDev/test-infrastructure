// Resolves the full base URL for the AI Chat service — up to (not including)
// the endpoint, e.g. `/conversations`, `/ask`, `/scope`.
//
//   • dev:  NEXT_PUBLIC_CHAT_API points at the standalone chat server
//           (http://localhost:8016), whose endpoints live under `/api/chat`.
//   • prod: chat is served from the SAME host + version as the main backend,
//           under `/chat` (e.g. https://its.drr.go.th/api-v2/chat). When
//           NEXT_PUBLIC_CHAT_API is unset we derive from NEXT_PUBLIC_HOST_BACKEND
//           — which already includes the `/api-v2` path, so keep it (do NOT
//           strip to origin) and just append `/chat`.
//
// ⚠️ NEXT_PUBLIC_* is inlined at build time — set these in the build env and
// rebuild; changing them at runtime has no effect on the client bundle.
function resolveChatBase(): string {
  const explicit = process.env.NEXT_PUBLIC_CHAT_API?.replace(/\/+$/, "")
  if (explicit) return `${explicit}/api/chat`

  const main = process.env.NEXT_PUBLIC_HOST_BACKEND?.replace(/\/+$/, "")
  if (main) return `${main}/chat`

  return ""
}

export const CHAT_BASE = resolveChatBase()
