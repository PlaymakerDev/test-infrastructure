import { useMemo } from 'react'
import { useDepartments } from './useDepartments'
import type { APIResponseDepartment } from '@/types/manage/department-api'

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

/** Department id for the logged-in user (0 while loading / for ส่วนกลาง). */
export const useHomeDeptId = (): number => {
  const { data } = useDepartments()
  return useMemo(() => resolveHomeDeptId(data), [data])
}
