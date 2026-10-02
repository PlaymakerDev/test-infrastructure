import type { ListData, SubDepartment, SubDptSolution } from '@/types/lpr/new-lpr-api'
import { matchesSearchTerm } from '@/utils/searchMatch'

/** Status-chip keys of the LPR overall page (`LPR_FILTERS` in DataDisplaySection). */
export type LPRFilterKey = 'all' | 'online' | 'offline' | 'warranty' | 'expired'

const PREDICATES: Record<Exclude<LPRFilterKey, 'all'>, (s: SubDptSolution) => boolean> = {
  online: (s) => !!s.is_online,
  offline: (s) => !s.is_online,
  warranty: (s) => !!s.is_warranty,
  expired: (s) => !s.is_warranty,
}

/** Keep only the install points (จุดติดตั้ง) `keep` accepts. Pruning happens at
 *  the `solutions[]` level of the `bureau → sub_department → solutions` tree,
 *  and sub-departments / bureaus left with nothing are dropped — so the
 *  "N โครงการ" badge and the merged project rows downstream are computed from
 *  the pruned data only. Never mutates the input. */
const pruneLPRList = (
  list: ListData[],
  keep: (solution: SubDptSolution, sub: SubDepartment) => boolean,
): ListData[] =>
  list.flatMap((dept) => {
    const subs = (dept?.sub_department ?? []).flatMap((sub) => {
      const solutions = (sub?.solutions ?? []).filter((s) => s && keep(s, sub))
      return solutions.length > 0 ? [{ ...sub, solutions }] : []
    })
    return subs.length > 0 ? [{ ...dept, sub_department: subs }] : []
  })

/** Keep only the install points matching the active status chip. 'all' (or any
 *  unknown key) returns the input untouched. */
export const filterLPRList = (list: ListData[] | undefined, filter: string): ListData[] | undefined => {
  const predicate = PREDICATES[filter as keyof typeof PREDICATES]
  if (!list || !predicate) return list
  return pruneLPRList(list, predicate)
}

/** Client-side search over what the table shows: หน่วยงาน (the bureau divider
 *  label), รหัสสายทาง and ชื่อโครงการ. Uses the shared `matchesSearchTerm`, so a
 *  road-code-shaped term ("ลพ", "สห.20") matches road codes by prefix only and
 *  doesn't drag in a bureau whose NAME merely contains those letters. An empty
 *  term returns the input untouched. */
export const searchLPRList = (list: ListData[] | undefined, term: string): ListData[] | undefined => {
  const t = term.trim()
  if (!list || !t) return list
  return pruneLPRList(list, (s, sub) =>
    matchesSearchTerm(t, {
      codes: [s.road?.code_name],
      text: [sub.department_short_name, s.project?.project_name],
    }),
  )
}
