import type { ListData, SubDptSolution } from '@/types/lpr/new-lpr-api'

/** Status-chip keys of the LPR overall page (`LPR_FILTERS` in DataDisplaySection). */
export type LPRFilterKey = 'all' | 'online' | 'offline' | 'warranty' | 'expired'

const PREDICATES: Record<Exclude<LPRFilterKey, 'all'>, (s: SubDptSolution) => boolean> = {
  online: (s) => !!s.is_online,
  offline: (s) => !s.is_online,
  warranty: (s) => !!s.is_warranty,
  expired: (s) => !s.is_warranty,
}

/** Keep only the install points (จุดติดตั้ง) matching the active status chip.
 *  Filtering happens at the `solutions[]` level of the
 *  `bureau → sub_department → solutions` tree, and sub-departments / bureaus
 *  left with nothing are dropped — so the "N โครงการ" badge and the merged
 *  project rows downstream are computed from the FILTERED data only. 'all' (or
 *  any unknown key) returns the input untouched. */
export const filterLPRList = (list: ListData[] | undefined, filter: string): ListData[] | undefined => {
  const predicate = PREDICATES[filter as keyof typeof PREDICATES]
  if (!list || !predicate) return list

  return list.flatMap((dept) => {
    const subs = (dept?.sub_department ?? []).flatMap((sub) => {
      const solutions = (sub?.solutions ?? []).filter((s) => s && predicate(s))
      return solutions.length > 0 ? [{ ...sub, solutions }] : []
    })
    return subs.length > 0 ? [{ ...dept, sub_department: subs }] : []
  })
}
