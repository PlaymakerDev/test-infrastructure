import { describe, expect, it } from 'vitest'
import type { ListData, SubDptSolution } from '@/types/lpr/new-lpr-api'
import { groupLPRList, groupLPRSections } from './groupLPRList'

const sol = (
  solutionId: number,
  roadId: number,
  projectId: number,
  contractNo = '',
): SubDptSolution => ({
  road: { id: roadId, code_name: `สห.${roadId}` },
  project: { id: projectId, project_name: `โครงการ ${projectId}`, budget_year: 2569, contract_no: contractNo },
  solution: { id: solutionId, solution_name: `จุด ${solutionId}` },
  lpr: { total_camera: 2, total_online: 2, total_offline: 0 },
  is_online: true,
  is_warranty: true,
  plates: { today: 0, yesterday: 0 },
})

const list = (...solutions: SubDptSolution[]): ListData[] => [
  {
    department_id: 1,
    department_short_name: 'สทช.2',
    sub_department: [{ department_id: 21, department_short_name: 'สทช.2 สระบุรี', solutions }],
  },
]

describe('groupLPRList', () => {
  it('merges install points of one project into a single rowSpan group', () => {
    // สห.2006 has two install points, สห.3032 has two → 2 projects, 4 rows
    const rows = groupLPRList(list(sol(1, 2006, 10), sol(2, 2006, 10), sol(3, 3032, 20), sol(4, 3032, 20)))

    expect(rows[0]).toMatchObject({ kind: 'bureau', bureau: 'สทช.2 สระบุรี', count: 2 })
    expect(rows.slice(1).map((r) => (r.kind === 'solution' ? r.groupSpan : null))).toEqual([2, 0, 2, 0])
  })

  it('counts the bureau badge by distinct project, not by install-point row', () => {
    const rows = groupLPRList(list(sol(1, 2006, 10), sol(2, 2006, 10), sol(3, 2006, 10)))
    expect(rows[0]).toMatchObject({ kind: 'bureau', count: 1 })
  })

  it('gathers a project\'s install points even when the API interleaves them', () => {
    const rows = groupLPRList(list(sol(1, 2006, 10), sol(3, 3032, 20), sol(2, 2006, 10)))
    const solutionIds = rows.flatMap((r) => (r.kind === 'solution' ? [r.item.solution.id] : []))
    expect(solutionIds).toEqual([1, 2, 3])
  })

  it('keeps two projects on the same road in separate groups', () => {
    const rows = groupLPRList(list(sol(1, 2006, 10), sol(2, 2006, 11)))
    expect(rows.slice(1).map((r) => (r.kind === 'solution' ? r.groupSpan : null))).toEqual([1, 1])
    expect(rows[0]).toMatchObject({ count: 2 })
  })

  it('never collapses rows that have no project identity', () => {
    const noIdentity = (id: number): SubDptSolution => {
      const s = sol(id, 2006, 0)
      return { ...s, project: { ...s.project, id: undefined as unknown as number, contract_no: '  ' } }
    }
    const rows = groupLPRList(list(noIdentity(1), noIdentity(2)))
    expect(rows[0]).toMatchObject({ count: 2 })
    expect(rows.slice(1).map((r) => (r.kind === 'solution' ? r.groupSpan : null))).toEqual([1, 1])
  })

  it('skips empty sub-departments and tolerates null / undefined input', () => {
    expect(groupLPRList(undefined)).toEqual([])
    expect(groupLPRList(list())).toEqual([])
    expect(groupLPRList([{ department_id: 1, department_short_name: 'x', sub_department: null as never }])).toEqual([])
  })

  it('produces unique row ids', () => {
    const rows = groupLPRList(list(sol(1, 2006, 10), sol(2, 2006, 10), sol(3, 3032, 20)))
    const ids = rows.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('groupLPRSections', () => {
  const twoBureaus: ListData[] = [
    {
      department_id: 1,
      department_short_name: 'สทช.2',
      sub_department: [
        { department_id: 21, department_short_name: 'สทช.2 สระบุรี', solutions: [sol(1, 2006, 10), sol(2, 3032, 20), sol(3, 2006, 10)] },
        { department_id: 22, department_short_name: 'สทช.2 ลพบุรี', solutions: [sol(4, 4001, 30)] },
      ],
    },
  ]

  it('regroups the table rows into one section per bureau, same order and count', () => {
    const sections = groupLPRSections(twoBureaus)
    expect(sections.map((s) => [s.bureau, s.count, s.rows.map((r) => r.item.solution.id)])).toEqual([
      ['สทช.2 สระบุรี', 2, [1, 3, 2]], // โครงการ 10's two points stay adjacent
      ['สทช.2 ลพบุรี', 1, [4]],
    ])
  })

  it('gives every card a unique id and handles empty input', () => {
    const ids = groupLPRSections(twoBureaus).flatMap((s) => s.rows.map((r) => r.id))
    expect(new Set(ids).size).toBe(ids.length)
    expect(groupLPRSections(undefined)).toEqual([])
  })
})
