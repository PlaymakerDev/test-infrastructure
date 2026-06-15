"use client"
import { useSearchParams } from 'next/navigation'

/** Default department ID — falls back to dept 50 (used as the demo default
 *  in `drr-cm-fe`) when the URL query is missing. Allows direct navigation
 *  to /admin/traffic-signal without manually appending ?dept_id=. */
const DEFAULT_DEPT_ID = '50'

/** Returns the department ID from the URL query (`?dept_id=`).
 *  Falls back to `DEFAULT_DEPT_ID` so list pages still load when no
 *  param is set (e.g., direct navigation). */
export const useDeptId = (): string => {
  const params = useSearchParams()
  return params.get('dept_id') ?? DEFAULT_DEPT_ID
}
