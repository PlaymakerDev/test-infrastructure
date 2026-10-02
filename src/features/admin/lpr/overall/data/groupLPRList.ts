import {
  countDistinctProjects,
  projectKey,
} from '@/features/admin/traffic-volume/shared/utils/groupByBureau'
import type { ListData, SubDptSolution } from '@/types/lpr/new-lpr-api'

/** Interleaved table row — a bureau (สำนัก/แขวง) divider header, or one
 *  install-point (จุดติดตั้ง) row. Same interleaved shape as the other overall
 *  tables, plus `groupSpan` because LPR merges more than the road code. */
export type LPRTableRow =
  | {
      kind: 'bureau'
      id: string
      bureau: string
      /** DISTINCT projects under this bureau — drives the "N โครงการ" badge. */
      count: number
    }
  | {
      kind: 'solution'
      id: string
      item: SubDptSolution
      /** > 0 on the first install-point row of a project group (= the rowSpan
       *  of the merged รหัสสายทาง / ชื่อโครงการ / เลขที่สัญญา / การค้ำประกัน
       *  cells); 0 on the remaining rows of that group so antd hides them. */
      groupSpan: number
    }

/** Card-grid shape of the same grouping: one section per bureau, holding that
 *  bureau's install points in table order (a project's points stay adjacent). */
export interface LPRSection {
  id: string
  bureau: string
  /** DISTINCT projects — same count the table's bureau badge shows. */
  count: number
  rows: { id: string; item: SubDptSolution }[]
}

const solutionProjectKey = (s: SubDptSolution) =>
  projectKey(s.project?.id, s.project?.contract_no)

/** Flatten `GET /lpr/departments/{id}/overview/central/list`
 *  (`bureau → sub_department → solutions[]`) into the rows the overall table
 *  renders. Install points of the SAME project on the SAME road are gathered
 *  into one group even if the API interleaves them, so the merged cells never
 *  fragment; a row with no project identity at all is its own group (never
 *  collapsed with unrelated rows). Bureau order, and group order inside a
 *  bureau, follow the API order. */
export const groupLPRList = (list: ListData[] | undefined): LPRTableRow[] => {
  const out: LPRTableRow[] = []

  for (const dept of list ?? []) {
    for (const sub of dept?.sub_department ?? []) {
      const solutions = (sub?.solutions ?? []).filter(Boolean)
      if (solutions.length === 0) continue

      out.push({
        kind: 'bureau',
        id: `bureau-${sub.department_id}`,
        bureau: sub.department_short_name,
        count: countDistinctProjects(solutions, solutionProjectKey),
      })

      const groups = new Map<string, SubDptSolution[]>()
      for (const s of solutions) {
        const pk = solutionProjectKey(s)
        const key = pk === undefined ? `solution-${s.solution?.id}` : `${s.road?.id}|${pk}`
        const bucket = groups.get(key)
        if (bucket) bucket.push(s)
        else groups.set(key, [s])
      }

      for (const items of groups.values()) {
        items.forEach((item, i) => {
          out.push({
            kind: 'solution',
            id: `${sub.department_id}:${item.road?.id}:${item.solution?.id}`,
            item,
            groupSpan: i === 0 ? items.length : 0,
          })
        })
      }
    }
  }

  return out
}

/** Same grouping as `groupLPRList`, regrouped per bureau for the card grid —
 *  so table and grid always agree on order and on the "N โครงการ" count. */
export const groupLPRSections = (list: ListData[] | undefined): LPRSection[] => {
  const out: LPRSection[] = []
  for (const row of groupLPRList(list)) {
    if (row.kind === 'bureau') {
      out.push({ id: row.id, bureau: row.bureau, count: row.count, rows: [] })
    } else {
      out[out.length - 1].rows.push({ id: row.id, item: row.item })
    }
  }
  return out
}
