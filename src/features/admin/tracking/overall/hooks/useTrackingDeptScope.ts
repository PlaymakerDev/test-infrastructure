"use client"
import { useSearchParams } from 'next/navigation'

/** Request params that the WTS (wim) upstream can scope by department. Every
 *  endpoint this module talks to takes the department as `department_id` — see
 *  the request types in `@/types/tracking/{overall,detail}-api`. */
export interface TrackingDeptScopedParams {
  department_id?: string | number
}

/**
 * Merges the URL's `?dept_id=` into a tracking request as `department_id`.
 *
 * Called by every hook in this directory so the whole page follows the
 * department the rest of /admin is scoped to (`?dept_id=60&tab=WIM`) without
 * each of the ~20 call sites having to thread it through.
 *
 * Two deliberate rules:
 * - No `?dept_id` in the URL → params pass through UNCHANGED. The param is an
 *   optional upstream filter, so defaulting it the way the shared
 *   `useDeptId()` does (it falls back to dept 50 for pages that put the id in a
 *   required path segment) would silently narrow every unparameterised visit to
 *   one department. Hence the raw `useSearchParams()` read here.
 * - An explicit `department_id` in `params` WINS over the URL. In-page pickers
 *   (the หน่วยงาน dropdown in `FormSearchUnitPlan`) must be able to override the
 *   page scope, so the URL value is only a default.
 */
export function useTrackingDeptScope<T extends TrackingDeptScopedParams>(params: T): T {
  const deptId = useSearchParams().get('dept_id')

  if (deptId === null || params.department_id !== undefined) return params
  return { ...params, department_id: deptId }
}

export default useTrackingDeptScope