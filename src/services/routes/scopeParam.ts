/**
 * `scope=all` — forwarded to the API only when the CURRENT PAGE URL carries
 * `?scope=all` (rule agreed with BE 2026-07-10).
 *
 * Why URL-driven: the same overall page (e.g. `/admin/cctv?dept_id=50`) is
 * reachable from two entry points with different intent —
 *   • เมนูกลาง (navbar) / login-landing → "my whole scope": the URL is built
 *     with `&scope=all` (see `deptQuery()`), so every dept-scoped request on
 *     the page aggregates children (dept 0 → all bureaus; สทช. → its ขทช.;
 *     แขวง → leaf, no-op).
 *   • Sidebar (เมนูข้างซ้าย) → "exactly this one department": pushes plain
 *     `?dept_id=N` with NO scope param, so requests stay narrow.
 * Reading the intent off the URL keeps all 31 call sites on this single
 * helper with zero per-page wiring.
 *
 * Covered endpoint families (7 overall menus × 4 + dashboard):
 *   /overview · /overview/central/list · /overview/central/totals ·
 *   /cameras|overview/random-online · uptime-statistics (all 7 features) ·
 *   /manage/solution/{id}/position · /analytic/details/{id}/dashboard ·
 *   /counting/{id}/dashboard
 *
 * SSR-safe: services only run in the browser (BaseService pulls the token via
 * a client fetch), but guard `window` anyway. The dept id param is kept so a
 * future per-dept rule can be reinstated here without touching call sites.
 */
export const centralScope = (
  _deptId: string | number
): { scope: 'all' } | undefined => {
  if (typeof window === 'undefined') return undefined
  return new URLSearchParams(window.location.search).get('scope') === 'all'
    ? { scope: 'all' }
    : undefined
}

/** TanStack-Query key segment mirroring `centralScope()`. Since BE shipped
 *  scope support (2026-07-11), `dept_id=0` PLAIN vs `dept_id=0&scope=all`
 *  return very different payloads (own group ≈22 cameras vs nationwide
 *  ≈8,946) — so cached entries MUST be keyed apart or switching entry points
 *  (sidebar ↔ เมนูกลาง) shows the other scope's stale data. Append this to
 *  every dept-scoped key whose queryFn sends `centralScope()`. */
export const scopeKey = (): 'all' | 'own' =>
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('scope') === 'all'
    ? 'all'
    : 'own'
