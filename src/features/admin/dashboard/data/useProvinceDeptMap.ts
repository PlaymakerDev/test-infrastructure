"use client"
import { useMemo } from 'react'
import { useDepartments } from '@/hooks/queries/manage'
import { PROVINCES } from './provinces'

/** Look up a Thai province code → the `department_id` of its overseeing ขทช.
 *
 *  Source: `/manage/departments` (100 rows for super-admin, filtered by RBAC
 *  for bureau/แขวง users — a bureau login only sees the 4 ขทช. under their
 *  สทช., a แขวง login only sees their own row).
 *
 *  Match rule (probed live against BE 2026-07-10, 76/77 exact match):
 *    - Regular provinces →  `department_short_name === "ขทช." + province.name`
 *    - กทม. (province.central = true) → dept_id 0 (ทช.ส่วนกลาง — no ขทช.)
 *
 *  Provinces the current user has NO access to are simply OMITTED from the
 *  returned Map, so the dashboard's click handler naturally no-ops on them —
 *  no error toast, no navigating to a dept the user can't view. */
export function useProvinceDeptMap(): Map<string, number> {
  const { data } = useDepartments()
  return useMemo(() => {
    const map = new Map<string, number>()
    if (!data) return map
    const byName = new Map<string, number>()
    // Also track dept ids present so central (กทม.) only maps in when the user
    // actually has access to dept 0 (ทช.ส่วนกลาง). Without this a bureau-scoped
    // user (e.g. drr-10 = สทช.10 → 4 ขทช. in the north) could click Bangkok on
    // the map and the URL would flip to dept_id=0, but their token can't fetch
    // that scope → cards would 401.
    const idsSeen = new Set<number>()
    for (const d of data) {
      byName.set(d.department_short_name, d.id)
      idsSeen.add(d.id)
    }
    for (const p of PROVINCES) {
      if (p.central) {
        // กทม. — no ขทช.; the province falls under ทช.ส่วนกลาง (dept 0).
        // Only expose it when the current user actually has access.
        if (idsSeen.has(0)) map.set(p.code, 0)
        continue
      }
      const id = byName.get(`ขทช.${p.name}`)
      if (id != null) map.set(p.code, id)
    }
    return map
  }, [data])
}
