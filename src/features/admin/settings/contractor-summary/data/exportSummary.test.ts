import { beforeEach, describe, expect, it, vi } from 'vitest'
import type {
  ProjectCameraListCamera,
  ProjectDeviceStatusRow,
  ProjectLightingItem,
  ProjectVMSItem,
} from '@/types/manage/device-status-api'
import { exportSummaryExcel, exportSummaryPdf, offlineSections, type SummaryExportInput } from './exportSummary'
import { SUMMARY_SYSTEMS } from './systems'

// Capture what the page hands the export kit instead of writing files.
const calls = vi.hoisted(() => ({ pdf: [] as unknown[], excel: [] as unknown[] }))
vi.mock('@/utils/export/pdf', () => ({ exportReportPdf: async (args: unknown) => { calls.pdf.push(args) } }))
vi.mock('@/utils/export/excel', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/export/excel')>()
  return { excelSheet: actual.excelSheet, exportExcelSheets: (args: unknown) => { calls.excel.push(args) } }
})

const project = (id: number, contractNo: string | null): ProjectDeviceStatusRow => ({
  project_id: id,
  project_name: `โครงการ ${id}`,
  contract_no: contractNo,
  budget_year: 2567,
  department: { id: 1, department_short_name: 'ขทช.สิงห์บุรี' },
  contractor: { id: 'u', company_name: 'บริษัท ที ไอ เค คอร์ปอเรชั่น จำกัด', short_name: 'tik' },
  warranty_start_date: null,
  warranty_end_date: null,
  is_warranty: true,
  access_scope: 'project',
  roads: [],
  cameras: { total: 27, online: 21, offline: 6 },
  vms: { total: 5, online: 3, offline: 2 },
  lighting: { total: 0, online: 0, offline: 0 },
})

const camera = (id: string, overrides: Partial<ProjectCameraListCamera> = {}): ProjectCameraListCamera => ({
  id,
  camera_name: `กล้อง ${id}`,
  ip_address: '10.0.0.1',
  hls_url: '',
  is_online: false,
  last_updated: null,
  solution_types: [{ id: 1, name: 'CCTV' }],
  road_id: 1,
  road_code: 'สห.4014',
  sta: '16+700',
  ...overrides,
})

const cabinet = (id: number, overrides: Partial<ProjectLightingItem> = {}): ProjectLightingItem => ({
  id,
  solution_id: id,
  solution_name: `ตู้ ${id}`,
  imei: null,
  is_online: false,
  last_updated: null,
  road_id: 1,
  road_code: 'สห.4014',
  sta: '',
  ...overrides,
})

const sign = (id: number, overrides: Partial<ProjectVMSItem> = {}): ProjectVMSItem => ({
  id,
  solution_id: id,
  solution_name: `ป้าย ${id}`,
  ip_address: '',
  is_online: false,
  last_updated: null,
  desktop_screen: '',
  road_id: 1,
  road_code: 'สห.4014',
  sta: '',
  ...overrides,
})

const input: SummaryExportInput = {
  companyName: 'บริษัท ที ไอ เค คอร์ปอเรชั่น จำกัด',
  shortName: 'tik',
  warrantyLabel: 'ในค้ำ',
  rings: [{ system: SUMMARY_SYSTEMS[0], totals: { total: 269, online: 230, offline: 39 } }],
  projects: [project(163, 'สทช.ที่ 2/26/2567'), project(504, null)],
  // Backend order (504 first), an online camera among the offline ones, and a
  // project the table doesn't list.
  cameraProjects: [
    {
      project_id: 504,
      project_name: 'โครงการ 504',
      contract_no: null,
      cameras: [camera('c3', { sta: 'กม. 2+000', ip_address: '', solution_types: [{ id: 7, name: 'VMS' }] })],
    },
    { project_id: 163, project_name: 'โครงการ 163', contract_no: 'สทช.ที่ 2/26/2567', cameras: [camera('c1'), camera('c2', { is_online: true })] },
    { project_id: 999, project_name: 'โครงการอื่น', contract_no: 'x', cameras: [camera('c9')] },
  ],
  // sta: empty (every cabinet today), filled, filled with a กม. prefix; an
  // online cabinet; a project the table doesn't list.
  lightingProjects: [
    {
      project_id: 163,
      project_name: 'โครงการ 163',
      contract_no: 'สทช.ที่ 2/26/2567',
      lighting: [
        cabinet(1, { solution_name: 'สห.4014 ตู้ที่ 1 กม.16+700' }),
        cabinet(2, { sta: '12+300' }),
        cabinet(3, { sta: 'กม. 13+700' }),
        cabinet(4, { is_online: true }),
      ],
    },
    { project_id: 999, project_name: 'โครงการอื่น', contract_no: 'x', lighting: [cabinet(9)] },
  ],
  // 504's signs: one with a chainage, one without; 163's only sign is online.
  vmsProjects: [
    { project_id: 504, project_name: 'โครงการ 504', contract_no: null, vms: [sign(11, { sta: '0+180' }), sign(12)] },
    { project_id: 163, project_name: 'โครงการ 163', contract_no: 'สทช.ที่ 2/26/2567', vms: [sign(13, { is_online: true })] },
  ],
}

type Table = { type: 'table'; title: string; columns: { header: string; widthPct: number }[]; rows: (string | number)[][] }
type BandedTable = Omit<Table, 'rows'> & { rows: ((string | number)[] | { group: string })[] }
type Sheet = { sheetName: string; title?: string; filterNote?: string; headers: { header: string }[]; cells: (string | number)[][] }

beforeEach(() => {
  calls.pdf.length = 0
  calls.excel.length = 0
})

describe('สรุปข้อมูลผู้รับจ้าง export', () => {
  it('PDF: เลขที่สัญญา is the third column, and the widths still fill the page', async () => {
    await exportSummaryPdf(input)
    const args = calls.pdf[0] as { subtitleNote: string; blocks: Table[] }
    const projects = args.blocks[1]
    expect(projects.columns.map((c) => c.header).slice(0, 4)).toEqual(['ลำดับ', 'ชื่อโครงการ', 'เลขที่สัญญา', 'CCTV ออนไลน์'])
    expect(projects.columns.reduce((sum, c) => sum + c.widthPct, 0)).toBe(100)
    expect(projects.rows[0].slice(0, 4)).toEqual([1, 'โครงการ 163', 'สทช.ที่ 2/26/2567', 21])
    expect(projects.rows[1][2]).toBe('-')
    // One filter for both: the rings were read under it too.
    expect(args.subtitleNote).toBe('สถานะค้ำประกัน: ในค้ำ')
    expect(args.blocks[0].rows[0]).toEqual(['CCTV', 269, 230, 39, '14%'])
  })

  it('Excel: the same third column on the projects sheet, the filter on every sheet', async () => {
    await exportSummaryExcel(input)
    const { sheets } = calls.excel[0] as { sheets: Sheet[] }
    const projects = sheets.find((s) => s.sheetName === 'โครงการ')!
    expect(projects.headers.map((h) => h.header).slice(0, 4)).toEqual(['ลำดับ', 'ชื่อโครงการ', 'เลขที่สัญญา', 'CCTV ออนไลน์'])
    expect(projects.cells[0].slice(0, 3)).toEqual([1, 'โครงการ 163', 'สทช.ที่ 2/26/2567'])
    expect(sheets.map((s) => s.sheetName)).toEqual(['ภาพรวมอุปกรณ์', 'โครงการ', 'กล้องออฟไลน์', 'Street Light ออฟไลน์', 'VMS ออฟไลน์'])
    expect(new Set(sheets.map((s) => s.filterNote))).toEqual(new Set(['สถานะค้ำประกัน: ในค้ำ']))
  })
})

describe('สรุปข้อมูลผู้รับจ้าง export — offline cameras (user 2026-10-08)', () => {
  it('keeps the table’s projects in the table’s order, offline cameras only', () => {
    const sections = offlineSections(input.projects, input.cameraProjects, (list) => list.cameras)
    expect(sections.map((s) => [s.project.project_id, s.items.map((c) => c.id)])).toEqual([[163, ['c1']], [504, ['c3']]])
  })

  it('drops a project with no offline camera', () => {
    const sections = offlineSections(input.projects, [{ ...input.cameraProjects[1], cameras: [camera('c2', { is_online: true })] }], (list) => list.cameras)
    expect(sections).toEqual([])
  })

  it('PDF: after the project table, a band per project with its contract, then its cameras', async () => {
    await exportSummaryPdf(input)
    const { blocks } = calls.pdf[0] as { blocks: BandedTable[] }
    expect(blocks).toHaveLength(5)
    const offline = blocks[2]
    expect(offline.title).toBe('รายการกล้องออฟไลน์แยกตามโครงการ (2 โครงการ, กล้อง 2 ตัว)')
    expect(offline.columns.map((c) => c.header)).toEqual(['ลำดับ', 'ชื่อกล้อง', 'กม.ที่', 'การทำงาน', 'IP Address'])
    expect(offline.columns.reduce((sum, c) => sum + c.widthPct, 0)).toBe(100)
    expect(offline.rows).toEqual([
      { group: 'โครงการ 163\nเลขที่สัญญา สทช.ที่ 2/26/2567 · ออฟไลน์ 1 ตัว' },
      [1, 'กล้อง c1', '16+700', 'CCTV', '10.0.0.1'],
      // กม. the backend may prefix is dropped; no IP → '-'; tags as on the Live cards.
      { group: 'โครงการ 504\nเลขที่สัญญา - · ออฟไลน์ 1 ตัว' },
      [1, 'กล้อง c3', '2+000', 'CCTV, VMS', '-'],
    ])
  })

  it('PDF: says so when no project has an offline camera', async () => {
    await exportSummaryPdf({ ...input, cameraProjects: [] })
    const offline = (calls.pdf[0] as { blocks: BandedTable[] }).blocks[2]
    expect(offline.title).toBe('รายการกล้องออฟไลน์แยกตามโครงการ (0 โครงการ, กล้อง 0 ตัว)')
    expect(offline.rows).toEqual([{ group: 'ไม่มีกล้องออฟไลน์' }])
  })

  it('Excel: one sheet, the project leading every row, numbered straight through', async () => {
    await exportSummaryExcel(input)
    const { sheets } = calls.excel[0] as { sheets: Sheet[] }
    const offline = sheets.find((s) => s.sheetName === 'กล้องออฟไลน์')!
    expect(offline.title).toBe('สรุปข้อมูลผู้รับจ้าง — บริษัท ที ไอ เค คอร์ปอเรชั่น จำกัด · รายการกล้องออฟไลน์แยกตามโครงการ (2 โครงการ, กล้อง 2 ตัว)')
    expect(offline.headers.map((h) => h.header)).toEqual(['ลำดับ', 'ชื่อโครงการ', 'เลขที่สัญญา', 'ชื่อกล้อง', 'กม.ที่', 'การทำงาน', 'IP Address'])
    expect(offline.cells).toEqual([
      [1, 'โครงการ 163', 'สทช.ที่ 2/26/2567', 'กล้อง c1', '16+700', 'CCTV', '10.0.0.1'],
      [2, 'โครงการ 504', '-', 'กล้อง c3', '2+000', 'CCTV, VMS', '-'],
    ])
  })
})

describe('สรุปข้อมูลผู้รับจ้าง export — offline Street Light and VMS (user 2026-10-09)', () => {
  it('PDF: Street Light after the cameras — install point and กม.ที่', async () => {
    await exportSummaryPdf(input)
    const lighting = (calls.pdf[0] as { blocks: BandedTable[] }).blocks[3]
    expect(lighting.title).toBe('รายการ Street Light ออฟไลน์แยกตามโครงการ (1 โครงการ, ตู้ป้องกันโจรกรรม 3 ตู้)')
    expect(lighting.columns.map((c) => c.header)).toEqual(['ลำดับ', 'จุดติดตั้งตู้ป้องกันโจรกรรม', 'กม.ที่'])
    expect(lighting.columns.reduce((sum, c) => sum + c.widthPct, 0)).toBe(100)
    expect(lighting.rows).toEqual([
      { group: 'โครงการ 163\nเลขที่สัญญา สทช.ที่ 2/26/2567 · ออฟไลน์ 3 ตู้' },
      // No sta yet → '-'; a กม. prefix from the backend is dropped.
      [1, 'สห.4014 ตู้ที่ 1 กม.16+700', '-'],
      [2, 'ตู้ 2', '12+300'],
      [3, 'ตู้ 3', '13+700'],
    ])
  })

  it('PDF: VMS last — install point and กม.ที่', async () => {
    await exportSummaryPdf(input)
    const vms = (calls.pdf[0] as { blocks: BandedTable[] }).blocks[4]
    expect(vms.title).toBe('รายการ VMS ออฟไลน์แยกตามโครงการ (1 โครงการ, ป้าย VMS 2 ป้าย)')
    expect(vms.columns.map((c) => c.header)).toEqual(['ลำดับ', 'จุดติดตั้งป้าย VMS', 'กม.ที่'])
    expect(vms.columns.reduce((sum, c) => sum + c.widthPct, 0)).toBe(100)
    expect(vms.rows).toEqual([
      { group: 'โครงการ 504\nเลขที่สัญญา - · ออฟไลน์ 2 ป้าย' },
      [1, 'ป้าย 11', '0+180'],
      [2, 'ป้าย 12', '-'],
    ])
  })

  it('PDF: says so when nothing is offline', async () => {
    await exportSummaryPdf({ ...input, lightingProjects: [], vmsProjects: [] })
    const { blocks } = calls.pdf[0] as { blocks: BandedTable[] }
    expect(blocks[3].rows).toEqual([{ group: 'ไม่มี Street Light ออฟไลน์' }])
    expect(blocks[4].rows).toEqual([{ group: 'ไม่มี VMS ออฟไลน์' }])
  })

  it('Excel: a sheet each, the project leading every row', async () => {
    await exportSummaryExcel(input)
    const { sheets } = calls.excel[0] as { sheets: Sheet[] }
    const lighting = sheets.find((s) => s.sheetName === 'Street Light ออฟไลน์')!
    expect(lighting.headers.map((h) => h.header)).toEqual(['ลำดับ', 'ชื่อโครงการ', 'เลขที่สัญญา', 'จุดติดตั้งตู้ป้องกันโจรกรรม', 'กม.ที่'])
    expect(lighting.cells).toEqual([
      [1, 'โครงการ 163', 'สทช.ที่ 2/26/2567', 'สห.4014 ตู้ที่ 1 กม.16+700', '-'],
      [2, 'โครงการ 163', 'สทช.ที่ 2/26/2567', 'ตู้ 2', '12+300'],
      [3, 'โครงการ 163', 'สทช.ที่ 2/26/2567', 'ตู้ 3', '13+700'],
    ])
    const vms = sheets.find((s) => s.sheetName === 'VMS ออฟไลน์')!
    expect(vms.headers.map((h) => h.header)).toEqual(['ลำดับ', 'ชื่อโครงการ', 'เลขที่สัญญา', 'จุดติดตั้งป้าย VMS', 'กม.ที่'])
    expect(vms.cells).toEqual([
      [1, 'โครงการ 504', '-', 'ป้าย 11', '0+180'],
      [2, 'โครงการ 504', '-', 'ป้าย 12', '-'],
    ])
  })
})
