import { describe, expect, it } from 'vitest'
import type { ListData, SubDptSolution } from '@/types/lpr/new-lpr-api'
import { filterLPRList } from './filterLPRList'
import { LPR_EXPORT_COLUMNS, toLPRExportRows } from './lprExport'

const sol = (id: number, projectId: number, over: Partial<SubDptSolution> = {}): SubDptSolution => ({
  road: { id: projectId, code_name: `สห.${projectId}` },
  project: { id: projectId, project_name: `โครงการ ${projectId}`, budget_year: 2569, contract_no: `คค ${projectId}` },
  solution: { id, solution_name: `จุด ${id}` },
  lpr: { total_camera: 2, total_online: 2, total_offline: 0 },
  is_online: true,
  is_warranty: true,
  plates: { today: 0, yesterday: 0 },
  ...over,
})

const data: ListData[] = [
  {
    department_id: 1,
    department_short_name: 'สทช.2',
    sub_department: [
      { department_id: 21, department_short_name: 'สทช.2 สระบุรี', solutions: [sol(1, 10), sol(2, 10, { is_online: false }), sol(3, 20)] },
      { department_id: 22, department_short_name: 'สทช.2 ลพบุรี', solutions: [sol(4, 30, { is_warranty: false })] },
    ],
  },
]

describe('toLPRExportRows', () => {
  it('flattens bureau dividers into a bureau on each install-point row, in table order', () => {
    const rows = toLPRExportRows(data)
    expect(rows.map((r) => [r.bureau, r.item.solution.id])).toEqual([
      ['สทช.2 สระบุรี', 1],
      ['สทช.2 สระบุรี', 2],
      ['สทช.2 สระบุรี', 3],
      ['สทช.2 ลพบุรี', 4],
    ])
  })

  it('exports exactly the filtered rows', () => {
    const rows = toLPRExportRows(filterLPRList(data, 'offline'))
    expect(rows.map((r) => r.item.solution.id)).toEqual([2])
  })

  it('handles empty / undefined input', () => {
    expect(toLPRExportRows(undefined)).toEqual([])
    expect(toLPRExportRows([])).toEqual([])
  })
})

describe('LPR_EXPORT_COLUMNS', () => {
  it('PDF widthPct sums to 100', () => {
    expect(LPR_EXPORT_COLUMNS.reduce((n, c) => n + c.widthPct, 0)).toBe(100)
  })

  it('renders the same values the table shows', () => {
    const [offlineRow] = toLPRExportRows(filterLPRList(data, 'offline'))
    const cells = Object.fromEntries(LPR_EXPORT_COLUMNS.map((c) => [c.header, c.value(offlineRow, 0)]))
    expect(cells).toMatchObject({
      ลำดับ: 1,
      หน่วยงาน: 'สทช.2 สระบุรี',
      รหัสสายทาง: 'สห.10',
      ชื่อโครงการ: 'โครงการ 10',
      เลขที่สัญญา: 'คค 10',
      การค้ำประกัน: 'ในค้ำ',
      จุดติดตั้ง: 'จุด 2',
      กล้องตรวจจับป้ายทะเบียน: 2,
      สถานะ: 'ออฟไลน์',
    })
    const [expired] = toLPRExportRows(filterLPRList(data, 'expired'))
    expect(LPR_EXPORT_COLUMNS.find((c) => c.header === 'การค้ำประกัน')!.value(expired, 0)).toBe('หมดค้ำ')
  })

  it('falls back to ปีงบประมาณ when the project has no contract number, then to -', () => {
    const col = LPR_EXPORT_COLUMNS.find((c) => c.header === 'เลขที่สัญญา')!
    const noContract = sol(9, 90, { project: { id: 90, project_name: 'x', budget_year: 2568, contract_no: '  ' } })
    expect(col.value({ bureau: 'b', item: noContract }, 0)).toBe('ปีงบประมาณ 2568')
    const nothing = sol(9, 90, { project: { id: 90, project_name: 'x', budget_year: 0, contract_no: '' } })
    expect(col.value({ bureau: 'b', item: nothing }, 0)).toBe('-')
  })
})
