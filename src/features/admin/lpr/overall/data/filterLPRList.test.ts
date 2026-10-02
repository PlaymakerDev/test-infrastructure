import { describe, expect, it } from 'vitest'
import type { ListData, SubDptSolution } from '@/types/lpr/new-lpr-api'
import { filterLPRList } from './filterLPRList'
import { groupLPRList } from './groupLPRList'

const sol = (id: number, projectId: number, isOnline: boolean, isWarranty: boolean): SubDptSolution => ({
  road: { id: projectId, code_name: `สห.${projectId}` },
  project: { id: projectId, project_name: `โครงการ ${projectId}`, budget_year: 2569, contract_no: `คค ${projectId}` },
  solution: { id, solution_name: `จุด ${id}` },
  lpr: { total_camera: 2, total_online: isOnline ? 2 : 0, total_offline: isOnline ? 0 : 2 },
  is_online: isOnline,
  is_warranty: isWarranty,
})

const dept = (id: number, ...solutions: SubDptSolution[]): ListData => ({
  department_id: id,
  department_short_name: `สำนัก ${id}`,
  sub_department: [{ department_id: id * 10, department_short_name: `แขวง ${id}`, solutions }],
})

const data: ListData[] = [
  dept(1, sol(1, 10, true, true), sol(2, 10, false, true), sol(3, 20, true, false)),
  dept(2, sol(4, 30, false, false)),
]

const solutionIds = (list: ListData[] | undefined) =>
  groupLPRList(list).flatMap((r) => (r.kind === 'solution' ? [r.item.solution.id] : []))

describe('filterLPRList', () => {
  it("returns the input untouched for 'all' and unknown keys", () => {
    expect(filterLPRList(data, 'all')).toBe(data)
    expect(filterLPRList(data, 'nope')).toBe(data)
    expect(filterLPRList(undefined, 'online')).toBeUndefined()
  })

  it('filters by online / offline', () => {
    expect(solutionIds(filterLPRList(data, 'online'))).toEqual([1, 3])
    expect(solutionIds(filterLPRList(data, 'offline'))).toEqual([2, 4])
  })

  it('filters by warranty / expired', () => {
    expect(solutionIds(filterLPRList(data, 'warranty'))).toEqual([1, 2])
    expect(solutionIds(filterLPRList(data, 'expired'))).toEqual([3, 4])
  })

  it('drops bureaus left empty and recounts distinct projects from the filtered rows', () => {
    const offline = filterLPRList(data, 'offline')!
    expect(offline.map((d) => d.department_id)).toEqual([1, 2]) // both still have an offline point

    const online = filterLPRList(data, 'online')!
    expect(online.map((d) => d.department_id)).toEqual([1]) // สำนัก 2 has no online point → gone
    // สำนัก 1 online = จุด 1 (โครงการ 10) + จุด 3 (โครงการ 20) → 2 projects
    expect(groupLPRList(online)[0]).toMatchObject({ kind: 'bureau', count: 2 })
  })

  it('shrinks a merged project group to the matching install points only', () => {
    // โครงการ 10 has จุด 1 (online) + จุด 2 (offline); under "online" it keeps one row
    const rows = groupLPRList(filterLPRList(data, 'online'))
    expect(rows.flatMap((r) => (r.kind === 'solution' ? [r.groupSpan] : []))).toEqual([1, 1])
  })

  it('does not mutate the source tree', () => {
    filterLPRList(data, 'online')
    expect(data[0].sub_department[0].solutions).toHaveLength(3)
  })

  it('tolerates null sub_department / solutions', () => {
    const broken = [
      { department_id: 1, department_short_name: 'x', sub_department: null },
      { department_id: 2, department_short_name: 'y', sub_department: [{ department_id: 3, department_short_name: 'z', solutions: null }] },
    ] as unknown as ListData[]
    expect(filterLPRList(broken, 'online')).toEqual([])
  })
})
