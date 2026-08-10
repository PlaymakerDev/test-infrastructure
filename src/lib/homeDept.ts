import type { APIResponseDepartment } from '@/types/manage/department-api'

/**
 * Pure (React-free) home-department helpers.
 *
 * These live in `lib/` rather than beside `useHomeDeptId` because THREE runtimes
 * need them and only one of them can load React:
 *   • client   — `useHomeDeptId()` / the login form
 *   • node     — `app/api/auth/[...all]/route.ts` stamps `home_dept_id` at login
 *   • edge     — `proxy.ts` builds the already-logged-in redirect's query
 * Importing them from `hooks/queries/manage/useHomeDeptId` would drag
 * `useDepartments` → TanStack Query → BaseService/axios into the middleware
 * bundle. `useHomeDeptId.ts` re-exports these so existing imports keep working.
 */

/**
 * Resolve the department the logged-in user should land on, from the
 * token-scoped `GET /manage/departments` list.
 *
 * `department_type`: 1 = สำนัก (bureau), 2 = แขวง (district).
 *   • exactly one สำนัก in scope → that สำนัก's id (user sees every แขวง in it)
 *   • many สำนัก (ส่วนกลาง)        → 0 (nationwide)
 *   • no สำนัก (แขวง-level user)    → the user's own แขวง id
 */
export function resolveHomeDeptId(
  depts?: APIResponseDepartment[] | null
): number {
  if (!depts || depts.length === 0) return 0
  const bureaus = depts.filter((d) => Number(d.department_type) === 1)
  if (bureaus.length === 1) return bureaus[0].id
  if (bureaus.length > 1) return 0
  return depts[0].id
}

/**
 * Build the overall-page query string for a department — "my whole scope"
 * entry points only (เมนูกลาง navbar + post-login landing + the middleware
 * redirect for an already-logged-in visitor).
 *
 * ALWAYS appends `scope=all` (rule updated 2026-07-10, was dept-0-only): the
 * URL param is what tells `centralScope()` to forward `scope=all` to every
 * dept-scoped API on the page, aggregating children (dept 0 → all permitted
 * bureaus; สทช. → its ขทช. children once BE ships it; แขวง → leaf, no-op —
 * always safe). The SIDEBAR intentionally does NOT use this helper — picking
 * a specific ขทช. there pushes a plain `dept_id=N` URL so requests stay
 * narrow to that one department.
 */
export function deptQuery(deptId: number): string {
  return `dept_id=${deptId}&scope=all`
}
