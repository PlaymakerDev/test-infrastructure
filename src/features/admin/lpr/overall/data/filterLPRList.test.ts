import { describe, expect, it } from 'vitest'
import type { ListData, SubDptSolution } from '@/types/lpr/new-lpr-api'
import { filterLPRList, searchLPRList } from './filterLPRList'
import { groupLPRList } from './groupLPRList'

const sol = (id: number, projectId: number, isOnline: boolean, isWarranty: boolean): SubDptSolution => ({
  road: { id: projectId, code_name: `สห.${projectId}` },
  project: { id: projectId, project_name: `โครงการ ${projectId}`, budget_year: 2569, contract_no: `คค ${projectId}` },
  solution: { id, solution_name: `จุด ${id}` },
  lpr: { total_camera: 2, total_online: isOnline ? 2 : 0, total_offline: isOnline ? 0 : 2 },
  is_online: isOnline,
  is_warranty: isWarranty,
  plates: { today: 0, yesterday: 0 },
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

describe('searchLPRList', () => {
  const named = (id: number, code: string, projectName: string, isOnline = true): SubDptSolution => ({
    ...sol(id, id, isOnline, true),
    road: { id, code_name: code },
    project: { id, project_name: projectName, budget_year: 2569, contract_no: `คค ${id}` },
  })

  const tree: ListData[] = [
    {
      department_id: 1,
      department_short_name: 'ขทช.1',
      sub_department: [
        { department_id: 11, department_short_name: 'ขทช.ลพบุรี', solutions: [named(1, 'ลบ.2006', 'ก่อสร้างถนนสาย ก'), named(2, 'ลบ.3032', 'ปรับปรุงสะพาน')] },
        { department_id: 12, department_short_name: 'ขทช.ลำพูน', solutions: [named(3, 'ลพ.3083', 'ก่อสร้างถนนสาย ข')] },
      ],
    },
  ]

  it('returns the input untouched for an empty / blank term', () => {
    expect(searchLPRList(tree, '')).toBe(tree)
    expect(searchLPRList(tree, '   ')).toBe(tree)
    expect(searchLPRList(undefined, 'x')).toBeUndefined()
  })

  it('searches รหัสสายทาง', () => {
    expect(solutionIds(searchLPRList(tree, 'ลบ.3032'))).toEqual([2])
    expect(solutionIds(searchLPRList(tree, '3083'))).toEqual([3])
  })

  it('searches ชื่อโครงการ', () => {
    expect(solutionIds(searchLPRList(tree, 'ปรับปรุง'))).toEqual([2])
    expect(solutionIds(searchLPRList(tree, 'ก่อสร้าง'))).toEqual([1, 3])
  })

  it('searches หน่วยงาน and keeps that whole bureau', () => {
    expect(solutionIds(searchLPRList(tree, 'ลพบุรี'))).toEqual([1, 2])
    expect(searchLPRList(tree, 'ลำพูน')![0].sub_department.map((s) => s.department_id)).toEqual([12])
  })

  it('treats a road-code-shaped term as a code prefix, not a bureau-name substring', () => {
    // "ลพ" is a road prefix (ลำพูน's ลพ.xxxx) — it must NOT match ขทช.ลพบุรี by name
    expect(solutionIds(searchLPRList(tree, 'ลพ'))).toEqual([3])
  })

  it('returns nothing for a term that matches nothing, and composes with the status filter', () => {
    expect(searchLPRList(tree, 'ไม่มีแน่นอน')).toEqual([])
    const offlineTree: ListData[] = [{ ...tree[0], sub_department: [{ ...tree[0].sub_department[0], solutions: [named(1, 'ลบ.2006', 'ก', true), named(2, 'ลบ.3032', 'ก', false)] }] }]
    expect(solutionIds(filterLPRList(searchLPRList(offlineTree, 'ลบ'), 'offline'))).toEqual([2])
  })
})
