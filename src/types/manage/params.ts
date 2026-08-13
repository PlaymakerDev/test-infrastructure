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

/** /manage/roads accepts two extra server-side filters on top of ListParams
 *  (probed live 2026-08-13): `province` (contains-match on the Thai name —
 *  also matches the trailing-space variants that exist in the data) and
 *  `department_id` (exact). Param name must be `department_id`; `dept_id` /
 *  `departmentId` are silently ignored. */
export interface RoadListParams extends ListParams {
  province?: string
  department_id?: number
}

/** Envelope meta_data — identical shape across all four list endpoints. */
export interface APIResponseMetaData {
  count: number
  page: number
  limit: number
  total_pages: number
}
