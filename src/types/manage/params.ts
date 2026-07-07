// Shared list-query params for the Settings (/api-v2/manage/*) list endpoints.
// All four list endpoints (/project, /roads, /contractor, /general_user) accept
// the same three query parameters. Sections pass `{ page, limit, search }` into
// the list hooks so each combination gets its own React-Query cache slot.
//
// Server defaults (VERIFIED live 2026-07-06):
//   • page = 1
//   • limit = 10 when no `?limit` is sent — callers ALWAYS pass an explicit limit
//   • search — server-side full-text across relevant text fields
//     (EXCEPTION: /general_user ?search=… currently returns malformed JSON;
//      the frontend filters that ONE list client-side. See useUsersList.ts.)

export interface ListParams {
  page?: number
  limit?: number
  search?: string
}

/** Envelope meta_data — identical shape across all four list endpoints. */
export interface APIResponseMetaData {
  count: number
  page: number
  limit: number
  total_pages: number
}
