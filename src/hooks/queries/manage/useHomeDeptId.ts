import { useMemo } from 'react'
import { useDepartments } from './useDepartments'
import { resolveHomeDeptId } from '@/lib/homeDept'

// `resolveHomeDeptId` / `deptQuery` moved to `@/lib/homeDept` (2026-08-10) so
// the Edge middleware and the login route handler can use them without pulling
// React + TanStack Query into their bundles. Re-exported here so every existing
// `@/hooks/queries/manage` import keeps working unchanged.
export { resolveHomeDeptId, deptQuery } from '@/lib/homeDept'

/** Department id for the logged-in user (0 while loading / for ส่วนกลาง). */
export const useHomeDeptId = (): number => {
  const { data } = useDepartments()
  return useMemo(() => resolveHomeDeptId(data), [data])
}
