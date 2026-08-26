// Bureau-grouping helper used by the overall-page tables.
// Originally duplicated verbatim in TableTrafficVolume + SummaryTableTrafficVolume.
// Extracted here so a fix to the row-span algorithm or the bureau-header row
// shape lands in one place.

/** Minimum shape a row needs to be groupable: a bureau bucket label, a
 *  road code (used to compute the rowspan of duplicate codes), and a
 *  stable id. The helper is generic over the rest of the row shape so
 *  callers preserve all their domain-specific fields downstream. */
export interface BureauGroupable {
  bureau: string
  roadCode: string
  id: string
}

/** First non-empty identity out of a candidate chain — callers pass their
 *  row's identity fields in preference order (projectId, then contractNo, …).
 *  Returns undefined when every candidate is null/undefined/blank. */
export const projectKey = (
  ...candidates: Array<string | number | null | undefined>
): string | undefined => {
  for (const c of candidates) {
    if (c === null || c === undefined) continue
    const s = String(c).trim()
    if (s) return s
  }
  return undefined
}

/** Count DISTINCT projects in a bucket. Several install points (จุดติดตั้ง)
 *  can belong to one project/contract — e.g. traffic-volume ปท.3010 จุดที่ 1
 *  and จุดที่ 2 share คค 0709/29/2567 — so the "N โครงการ" badge must not
 *  count rows. Rows whose keyOf resolves to undefined (no identity at all)
 *  each count as their own project, so the badge never silently collapses
 *  unrelated identity-less rows into one. */
export const countDistinctProjects = <T>(
  items: T[],
  keyOf: (item: T) => string | undefined,
): number => {
  const keys = new Set<string>()
  let unidentified = 0
  for (const item of items) {
    const key = keyOf(item)
    if (key === undefined) unidentified++
    else keys.add(key)
  }
  return keys.size + unidentified
}

export type BureauGroupedRow<T extends BureauGroupable> =
  | {
      kind: 'bureau'
      id: string
      bureau: string
      /** Number of DISTINCT projects under this bureau — drives the
       *  "N โครงการ" count badge (not the number of install-point rows). */
      count: number
    }
  | {
      kind: 'project'
      id: string
      project: T
      /** > 0 on the first project row of a duplicated `roadCode` run (sets
       *  the cell's rowspan); 0 on the subsequent rows of the same run
       *  (causes antd to render an empty cell so the first one can span). */
      roadCodeSpan: number
    }

/** Group projects into bureau buckets and compute road-code rowspans.
 *  Insertion order of bureaus follows the input order (Map preserves it),
 *  so callers control sort order via the input list.
 *
 *  Time complexity: O(N) for the bucket fill + O(N) for the inner-while
 *  rowspan scan = O(N) total. The inner `while` only advances the outer
 *  index, never re-scans previous rows. */
export const groupByBureau = <T extends BureauGroupable>(
  projects: T[],
  /** Resolves a row's project identity (use `projectKey(...)`) so the bureau
   *  header counts DISTINCT projects. Required on purpose: an accessor-less
   *  call is how the old rows-not-projects badge bug happened. */
  projectKeyOf: (item: T) => string | undefined,
): BureauGroupedRow<T>[] => {
  const groups = new Map<string, T[]>()
  for (const p of projects) {
    const list = groups.get(p.bureau) ?? []
    list.push(p)
    groups.set(p.bureau, list)
  }
  const out: BureauGroupedRow<T>[] = []
  for (const [bureau, items] of groups) {
    out.push({
      kind: 'bureau',
      id: `bureau-${bureau}`,
      bureau,
      count: countDistinctProjects(items, projectKeyOf),
    })

    let i = 0
    while (i < items.length) {
      const code = items[i].roadCode
      let span = 1
      while (i + span < items.length && items[i + span].roadCode === code) {
        span++
      }
      out.push({
        kind: 'project',
        id: items[i].id,
        project: items[i],
        roadCodeSpan: span,
      })
      for (let j = 1; j < span; j++) {
        out.push({
          kind: 'project',
          id: items[i + j].id,
          project: items[i + j],
          roadCodeSpan: 0,
        })
      }
      i += span
    }
  }
  return out
}
