// Response row from POST https://vis.drr.go.th/sso/search — the upstream
// returns a bare JSON array (no envelope). Field casing is PascalCase to
// match the upstream contract verbatim, so components can consume the array
// items without an extra mapping layer.
export interface APIResponseSSOUser {
  Username: string
  FirstName: string
  LastName: string
  Description?: string
  Email?: string
  UserPrincipalName?: string
}

// Body accepted by the Next.js proxy (and by upstream) — Thai / ASCII are
// both valid; the proxy trims empty keywords upstream-side.
export interface APIRequestSSOSearch {
  keyword: string
}
