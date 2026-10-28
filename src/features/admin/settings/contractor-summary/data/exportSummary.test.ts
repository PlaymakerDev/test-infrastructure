import { beforeEach, describe, expect, it, vi } from 'vitest'
import type {
  DeviceTotals,
  ProjectDeviceSolutionsRow,
  ProjectDeviceSummaryRow,
  SolutionCamera,
} from '@/types/manage/device-status-api'
import type { ErasedHeaderCell, ExcelLayoutSheet } from '@/utils/export/excel'
import { exportSummaryExcel, exportSummaryPdf, projectSheetProjects, summaryForProjects, type SummaryExportInput } from './exportSummary'
import { SUMMARY_SYSTEMS } from './systems'

// Capture what the page hands the export kit instead of writing files.
const calls = vi.hoisted(() => ({ pdf: [] as unknown[], excel: [] as unknown[] }))
vi.mock('@/utils/export/pdf', () => ({ exportReportPdf: async (args: unknown) => { calls.pdf.push(args) } }))
vi.mock('@/utils/export/excel', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/export/excel')>()
  return { excelSheet: actual.excelSheet, exportExcelSheets: (args: unknown) => { calls.excel.push(args) } }
})

const projectHeader = (id: number, contractNo: string | null) => ({
  project_id: id,
  project_name: `โครงการ ${id}`,
  contract_no: contractNo,
  budget_year: 2567,
  department: { id: 1, department_short_name: 'ขทช.สิงห์บุรี' },
  contractor: { id: 'u', company_name: 'บริษัท ที ไอ เค คอร์ปอเรชั่น จำกัด', short_name: 'tik' },
  warranty_start_date: null,
  warranty_end_date: null,
  is_warranty: true,
  access_scope: 'project' as const,
  roads: [],
})

const camera = (id: string, overrides: Partial<SolutionCamera> = {}): SolutionCamera => ({
  id,
  camera_name: `กล้อง ${id}`,
  sta: '16+700',
  ip_address: '10.0.0.1',
  is_online: false,
  solution_group: ['CCTV'],
  ...overrides,
})

const t = (online: number, offline: number): DeviceTotals => ({ total: online + offline, online, offline })
const none = t(0, 0)

const summaryRow = (id: number, contractNo: string | null, overrides: Partial<ProjectDeviceSummaryRow> = {}): ProjectDeviceSummaryRow => ({
  ...projectHeader(id, contractNo),
  cctv: none,
  counting: none,
  analytic: none,
  lpr: none,
  traffic: { system: none, camera: none },
  crosswalk: { system: none, camera: none },
  lighting: none,
  vms: { system: none, camera: none },
  bridge_lighting: none,
  tunnel: none,
  ...overrides,
})

const solutionsRow = (id: number, overrides: Partial<ProjectDeviceSolutionsRow> = {}): ProjectDeviceSolutionsRow => ({
  ...projectHeader(id, null),
  cctv: [],
  counting: [],
  analytic: [],
  lpr: [],
  traffic: [],
  crosswalk: [],
  vms: [],
  lighting: [],
  bridge_lighting: [],
  tunnel: [],
  ...overrides,
})

// In the backend's order, by chainage: c4 has none and no IP; c2 and c3 stand
// at 2+800 (c3 written "กม. 2+800"), c1 at 16+700 — and serves WIM too, and
// a type with no tag.
const c4 = camera('c4', { sta: '', ip_address: '' })
const c2 = camera('c2', { sta: '2+800', solution_group: ['CCTV', 'TRAFFIC'] })
const c3 = camera('c3', { sta: 'กม. 2+800', is_online: true, solution_group: ['CCTV', 'COUNTING'] })
const c1 = camera('c1', { is_online: true, solution_group: ['CCTV', 'TRAFFIC', 'TUNNEL', 'WIM'] })

const TRAFFIC = { id: 4, name: 'Traffic' }
const CCTV = { id: 1, name: 'CCTV' }

const input: SummaryExportInput = {
  companyName: 'บริษัท ที ไอ เค คอร์ปอเรชั่น จำกัด',
  shortName: 'tik',
  warrantyLabel: 'ในค้ำ',
  rings: [{ system: SUMMARY_SYSTEMS[0], totals: { total: 269, online: 230, offline: 39 } }],
  // Every system's counts distinct, so a column swap shows; 246 is a project
  // the page's table doesn't list (traffic controllers only).
  summary: [
    summaryRow(163, ' สทช.ที่ 2/26/2567 ', {
      cctv: t(1, 2),
      counting: t(3, 4),
      analytic: t(5, 6),
      lpr: t(7, 8),
      traffic: { system: t(9, 10), camera: t(11, 12) },
      crosswalk: { system: t(13, 14), camera: t(15, 16) },
      lighting: t(17, 18),
      vms: { system: t(19, 20), camera: t(21, 22) },
      bridge_lighting: t(23, 24),
      tunnel: t(25, 26),
    }),
    summaryRow(246, null, { traffic: { system: t(2, 0), camera: none } }),
  ],
  // 163: two CCTV install points with every camera — those the counting
  // point, the traffic controllers (one down) and WIM use too; an LPR camera
  // registered under another project's CCTV install point; two cabinets, a
  // bridge, a tunnel with a device and one without.
  solutions: [
    solutionsRow(163, {
      cctv: [
        { solution_id: 1, solution_name: 'ชน.3018 จุดติดตั้งที่ 1', cameras: [c4] },
        { solution_id: 11, solution_name: 'สห.4014 กม.2+800 - 16+700', cameras: [c2, c3, c1] },
      ],
      counting: [{ solution_id: 2, solution_name: 'สห.4014 กม.2+800', cameras: [c3] }],
      traffic: [
        { id: 117, solution_id: 3, solution_name: 'สห.4014 กม.2+800 จราจรจุด1', is_online: true, cameras: [c2] },
        { id: 118, solution_id: 4, solution_name: 'สห.4014 กม.16+700 จราจรจุด2', is_online: false, cameras: [c1] },
      ],
      lpr: [{ solution_id: 5, solution_name: 'สห.4014 กม. 16+700', cameras: [camera('c5', { is_online: true, ip_address: '10.0.0.5', solution_group: ['CCTV', 'LPR'] })] }],
      lighting: [
        {
          id: 1,
          solution_id: 6,
          solution_name: 'สห.4014 ตู้ที่ 1 กม.22+280',
          sta: '22+280',
          is_online: false,
          has_broken_wire: false,
          lamps: [{ id: 4991, name: 'โคมที่ 1', pole_number: 1, sta: '', is_online: true, last_connectd: null }],
        },
        { id: 2, solution_id: 7, solution_name: 'สห.4014 ตู้ที่ 2', sta: '', is_online: true, has_broken_wire: true, lamps: [] },
      ],
      bridge_lighting: [{ id: 10, solution_id: 8, solution_name: 'ไฟประดับ : สะพานปิ่นเกล้า', is_online: true }],
      tunnel: [
        { solution_id: 9, solution_name: 'อุโมงค์ทางลอด A', devices: [{ id: 'x1', device_name: 'Lux Sensor1', is_online: false, last_update: null }] },
        { solution_id: 10, solution_name: 'อุโมงค์ทางลอด B', devices: [] },
      ],
    }),
    // 246: a sign with a camera and one without.
    solutionsRow(246, {
      vms: [
        { id: 11, solution_id: 12, solution_name: 'ป้าย 11', is_online: true, cameras: [camera('c6', { sta: '', ip_address: '10.1.1.2', solution_group: ['VMS'] })] },
        { id: 12, solution_id: 13, solution_name: 'ป้าย 12', is_online: false, cameras: [] },
      ],
    }),
  ],
  projectSolutions: [
    { id: 163, solution_group: [CCTV, TRAFFIC, { id: 6, name: 'Lighting' }] },
    { id: 246, solution_group: [TRAFFIC] },
  ],
}

type Column = { header: string; widthPct?: number; headerColor?: string; children?: Column[] }
type Table = { type: 'table'; title: string; columns: Column[]; rows: (string | number)[][]; fontSize?: number }
type BandedTable = Omit<Table, 'columns' | 'rows'> & {
  columns: { header: string; widthPct: number }[]
  rows: ((string | number)[] | { group: string; tone?: string } | { cells: (string | number)[]; emphasis?: boolean })[]
}
type Sheet = {
  sheetName: string
  title?: string
  filterNote?: string
  headers: { header: string; width?: number; headerColor?: string; align?: string; wrap?: boolean }[]
  headerGrid?: { rows: number; cells: ErasedHeaderCell[] }
  cells: (string | number)[][]
}

const leaves = (columns: Column[]): Column[] => columns.flatMap((c) => (c.children ? leaves(c.children) : [c]))

beforeEach(() => {
  calls.pdf.length = 0
  calls.excel.length = 0
})

describe('สรุปข้อมูลผู้รับจ้าง export', () => {
  it('PDF: the rings, then สรุป as one table — a column a part, "On / Off", each cell "1 / 0" in blue and red', async () => {
    await exportSummaryPdf(input)
    const args = calls.pdf[0] as { subtitleNote: string; blocks: Table[] }
    // One filter for all: the rings were read under it too.
    expect(args.subtitleNote).toBe('สถานะค้ำประกัน: ในค้ำ')
    expect(args.blocks[0].rows[0]).toEqual(['CCTV', 269, 230, 39, '14%'])

    const summary = args.blocks[1]
    expect(summary.title).toBe('ตารางสรุปโครงการและสถานะการทำงานของอุปกรณ์ทุกโครงการ')
    // The sample's three header rows: system → part → On / Off.
    expect(summary.columns.map((c) => [c.header, c.children?.map((part) => part.header)])).toEqual([
      ['ลำดับ', undefined],
      ['ชื่อโครงการ', undefined],
      ['เลขที่สัญญา', undefined],
      ['CCTV (กล้อง)', ['CCTV', 'Traffic Volume', 'Incident Detection', 'LPR']],
      ['Traffic Signal', ['System', 'CCTV']],
      ['Crosswalk', ['System', 'CCTV']],
      ['Street Light', ['System']],
      ['VMS', ['System', 'CCTV']],
      ['Bridge Lighting', ['System']],
      ['Tunnel', ['Sensor']],
    ])
    const columns = leaves(summary.columns)
    expect(columns).toHaveLength(3 + 13)
    expect(columns[3]).toEqual({
      header: 'On / Off',
      headerRuns: [{ text: 'On', color: '#4E95D9' }, { text: ' / ' }, { text: 'Off', color: '#FF0000' }],
      widthPct: 5.2,
    })
    expect(columns.reduce((sum, c) => sum + c.widthPct!, 0)).toBeCloseTo(100)
    expect(summary.fontSize).toBe(7)
    // Contract trimmed; each part's online/offline, in system order.
    const count = (online: number, offline: number) => [{ text: String(online), color: '#4E95D9' }, { text: ' / ' }, { text: String(offline), color: '#FF0000' }]
    expect(summary.rows[0]).toEqual([1, 'โครงการ 163', 'สทช.ที่ 2/26/2567', ...Array.from({ length: 13 }, (_, i) => count(2 * i + 1, 2 * i + 2))])
    expect(summary.rows[1].slice(0, 3)).toEqual([2, 'โครงการ 246', '-'])
    expect(summary.rows[1][7]).toEqual(count(2, 0))
  })

  it('Excel: สรุป follows the sample — three header rows, merged, all 26 counts', async () => {
    await exportSummaryExcel(input)
    const { sheets } = calls.excel[0] as { sheets: Sheet[] }
    expect(sheets.map((s) => s.sheetName)).toEqual(['ภาพรวมอุปกรณ์', 'สรุป', 'โครงการ'])
    expect(new Set(sheets.map((s) => s.filterNote))).toEqual(new Set(['สถานะค้ำประกัน: ในค้ำ']))

    const summary = sheets.find((s) => s.sheetName === 'สรุป')!
    expect(summary.title).toBe('สรุปข้อมูลผู้รับจ้าง — บริษัท ที ไอ เค คอร์ปอเรชั่น จำกัด · ตารางสรุปโครงการและสถานะการทำงานของอุปกรณ์ทุกโครงการ')
    expect(summary.headers).toHaveLength(29)
    expect(summary.headers.slice(0, 4)).toEqual([
      { header: 'ลำดับ', width: 8 },
      { header: 'ชื่อโครงการ', width: 46, wrap: true },
      { header: 'เลขที่สัญญา', width: 20, wrap: true },
      { header: 'ออนไลน์', width: 9, align: 'center', headerColor: '4E95D9' },
    ])
    expect(summary.headers[4]).toEqual({ header: 'ออฟไลน์', width: 9, align: 'center', headerColor: 'FF0000' })
    // The sample's merges: A5:A7, D5:K5, D6:E6, L5:O5, AB6:AC6 …
    const cell = (header: string, r: number) => summary.headerGrid!.cells.find((c) => c.header === header && c.r === r)
    expect(summary.headerGrid!.rows).toBe(3)
    expect(cell('ลำดับ', 0)).toMatchObject({ c: 0, rowSpan: 3, colSpan: 1 })
    expect(cell('CCTV (กล้อง)', 0)).toMatchObject({ c: 3, rowSpan: 1, colSpan: 8 })
    expect(cell('CCTV', 1)).toMatchObject({ c: 3, colSpan: 2 })
    expect(cell('Traffic Signal', 0)).toMatchObject({ c: 11, colSpan: 4 })
    expect(cell('Street Light', 0)).toMatchObject({ c: 19, colSpan: 2 })
    expect(cell('Tunnel', 0)).toMatchObject({ c: 27, colSpan: 2 })
    expect(cell('Sensor', 1)).toMatchObject({ c: 27, colSpan: 2 })
    expect(summary.cells[0]).toEqual([1, 'โครงการ 163', 'สทช.ที่ 2/26/2567', ...Array.from({ length: 26 }, (_, i) => i + 1)])
    expect(summary.cells[1].slice(0, 3)).toEqual([2, 'โครงการ 246', '-'])
  })

  it('หน้าปัจจุบัน: the summary of the page’s projects only, in the page’s order', () => {
    const page = [{ project_id: 504 }, { project_id: 163 }]
    // 504 has no summary row (nothing counted) — it's simply not there.
    expect(summaryForProjects(input.summary, page).map((row) => row.project_id)).toEqual([163])
    expect(summaryForProjects(input.summary, [{ project_id: 246 }, { project_id: 163 }]).map((row) => row.project_id)).toEqual([246, 163])
  })
})

describe('สรุปข้อมูลผู้รับจ้าง export — every device, project by project (user 2026-10-27)', () => {
  const [p163, p246] = projectSheetProjects(input)
  const section = (project: typeof p163, solution: string) => project.sections.find((s) => s.solution === solution)!

  it('the summary’s projects, in its order', () => {
    expect(projectSheetProjects(input).map((project) => project.name)).toEqual(['โครงการ 163', 'โครงการ 246'])
    expect([p163.contractNo, p246.contractNo]).toEqual(['สทช.ที่ 2/26/2567', '-'])
  })

  it('ticks what the project is set up with and what it has devices of', () => {
    expect(p163.solutions).toEqual(['CCTV', 'Traffic Volume', 'Traffic Signal', 'Street Light', 'Bridge Lighting', 'Tunnel', 'WIM', 'LPR'])
    expect(p246.solutions).toEqual(['Traffic Signal', 'VMS'])
    expect(p163.sections.map((s) => s.solution)).toEqual(['CCTV', 'Traffic Volume', 'Traffic Signal', 'Street Light', 'Bridge Lighting', 'Tunnel', 'WIM', 'LPR'])
  })

  it('CCTV: each CCTV install point with every camera — tagged with all it serves', () => {
    const cctv = section(p163, 'CCTV')
    expect(cctv.points.map((point) => point.label)).toEqual(['ชน.3018 จุดติดตั้งที่ 1', 'สห.4014 กม.2+800 - 16+700'])
    expect(cctv.points[0].rows).toEqual([['กล้อง c4', '-', 'CCTV', 'Disconnect', '-']])
    expect(cctv.points[1].rows).toEqual([
      ['กล้อง c2', '2+800', 'CCTV, Traffic', 'Disconnect', '10.0.0.1'],
      ['กล้อง c3', '2+800', 'CCTV, Volume', 'Connect', '10.0.0.1'],
      ['กล้อง c1', '16+700', 'CCTV, Traffic, Truck Tracking', 'Connect', '10.0.0.1'],
    ])
  })

  it('each system by its own install points; a controller with its state after its name', () => {
    expect(section(p163, 'Traffic Volume').points).toEqual([{ label: 'สห.4014 กม.2+800', rows: [['กล้อง c3', '2+800', 'CCTV, Volume', 'Connect', '10.0.0.1']] }])
    expect(section(p163, 'Traffic Signal').points.map((point) => [point.label, point.online, point.rows.map((row) => row[0])])).toEqual([
      ['สห.4014 กม.2+800 จราจรจุด1', true, ['กล้อง c2']],
      ['สห.4014 กม.16+700 จราจรจุด2', false, ['กล้อง c1']],
    ])
    // A camera under another project's CCTV install point: here under LPR only.
    expect(section(p163, 'LPR').points).toEqual([{ label: 'สห.4014 กม. 16+700', rows: [['กล้อง c5', '16+700', 'CCTV, LPR', 'Connect', '10.0.0.5']] }])
  })

  it('WIM: its cameras by the CCTV install point they stand at', () => {
    expect(section(p163, 'WIM').points).toEqual([
      { label: 'สห.4014 กม.2+800 - 16+700', rows: [['กล้อง c1', '16+700', 'CCTV, Traffic, Truck Tracking', 'Connect', '10.0.0.1']] },
    ])
  })

  it('Street Light: the cabinets (not their lamps) with chainage and wire', () => {
    expect(section(p163, 'Street Light')).toEqual({
      solution: 'Street Light',
      columns: ['ชื่อจุดติดตั้ง', 'กม.ที่', 'การทำงาน', 'การเชื่อมต่อ', 'สถานะสาย'],
      points: [{ rows: [['สห.4014 ตู้ที่ 1 กม.22+280', '22+280', 'Street Light', 'Disconnect', 'Connect'], ['สห.4014 ตู้ที่ 2', '-', 'Street Light', 'Connect', 'Disconnect']] }],
    })
  })

  it('VMS: as Traffic Signal lists its controllers — each sign with its state and its cameras, a sign without one too', () => {
    expect(p246.sections).toEqual([
      {
        solution: 'VMS',
        columns: ['ชื่อกล้อง', 'กม.ที่', 'การทำงาน', 'สถานะ', 'IP Address'],
        points: [
          { label: 'ป้าย 11', online: true, rows: [['กล้อง c6', '-', 'CCTV, VMS', 'Disconnect', '10.1.1.2']] },
          { label: 'ป้าย 12', online: false, rows: [] },
        ],
      },
    ])
  })

  it('Bridge Lighting and Tunnel: four columns; a tunnel without devices says so', () => {
    expect(section(p163, 'Bridge Lighting').points).toEqual([{ rows: [['ไฟประดับ : สะพานปิ่นเกล้า', '-', 'Bridge Lighting', 'Connect']] }])
    expect(section(p163, 'Tunnel')).toEqual({
      solution: 'Tunnel',
      columns: ['ชื่ออุปกรณ์', 'กม.ที่', 'การทำงาน', 'การเชื่อมต่อ'],
      points: [
        { label: 'อุโมงค์ทางลอด A', rows: [['Lux Sensor1', '-', 'Tunnel', 'Disconnect']] },
        { label: 'อุโมงค์ทางลอด B (ไม่มีข้อมูลอุปกรณ์)', rows: [] },
      ],
    })
  })

  it('without a /solutions row a project keeps its name and the Solutions it is set up with', () => {
    const [bare] = projectSheetProjects({ ...input, solutions: [] })
    expect(bare.sections).toEqual([])
    expect(bare.solutions).toEqual(['CCTV', 'Traffic Signal', 'Street Light'])
  })

  it('Excel: the โครงการ sheet after สรุป, every project folding under its name', async () => {
    await exportSummaryExcel(input)
    const sheet = (calls.excel[0] as { sheets: ExcelLayoutSheet[] }).sheets[2]
    expect(sheet.sheetName).toBe('โครงการ')
    expect(sheet.title).toBe('สรุปข้อมูลผู้รับจ้าง — บริษัท ที ไอ เค คอร์ปอเรชั่น จำกัด · รายการอุปกรณ์ทั้งหมดแยกตามโครงการ')
    expect(sheet.filterNote).toBe('สถานะค้ำประกัน: ในค้ำ')
    const heads = sheet.rows.filter((row) => !row.level).map((row) => row.cells[0].value)
    expect(heads).toEqual(['โครงการที่ 1 :', 'โครงการที่ 2 :'])
  })

  it('PDF: one table after the สรุป ones — a band per project, a lighter one per install point', async () => {
    await exportSummaryPdf(input)
    const { blocks } = calls.pdf[0] as { blocks: BandedTable[] }
    expect(blocks).toHaveLength(3)
    const devices = blocks[2]
    expect(devices.title).toBe('รายการอุปกรณ์ทั้งหมดแยกตามโครงการ (2 โครงการ)')
    expect(devices.columns.map((c) => c.header)).toEqual(['ลำดับ', 'ชื่อกล้อง', 'กม.ที่', 'การทำงาน', 'สถานะ', 'IP Address'])
    expect(devices.columns.reduce((sum, c) => sum + c.widthPct, 0)).toBe(100)
    expect(devices.rows.slice(0, 4)).toEqual([
      { group: 'โครงการที่ 1 : โครงการ 163\nเลขที่สัญญา : สทช.ที่ 2/26/2567 · Solution : CCTV, Traffic Volume, Traffic Signal, Street Light, Bridge Lighting, Tunnel, WIM, LPR' },
      { group: 'CCTV · จุดติดตั้ง : ชน.3018 จุดติดตั้งที่ 1', tone: 'soft' },
      [1, 'กล้อง c4', '-', 'CCTV', 'Disconnect', '-'],
      { group: 'CCTV · จุดติดตั้ง : สห.4014 กม.2+800 - 16+700', tone: 'soft' },
    ])
    // Numbered from 1 at each install point.
    expect(devices.rows.slice(4, 7)).toEqual([
      [1, 'กล้อง c2', '2+800', 'CCTV, Traffic', 'Disconnect', '10.0.0.1'],
      [2, 'กล้อง c3', '2+800', 'CCTV, Volume', 'Connect', '10.0.0.1'],
      [3, 'กล้อง c1', '16+700', 'CCTV, Traffic, Truck Tracking', 'Connect', '10.0.0.1'],
    ])
    // A controller's state coloured as on the sheet.
    expect(devices.rows).toContainEqual({
      group: 'Traffic Signal · จุดติดตั้ง : สห.4014 กม.16+700 จราจรจุด2 (ระบบ : ออฟไลน์)',
      tone: 'soft',
      runs: [{ text: 'Traffic Signal · จุดติดตั้ง : สห.4014 กม.16+700 จราจรจุด2 (ระบบ : ' }, { text: 'ออฟไลน์', color: '#FF0000' }, { text: ')' }],
    })
    // A section with columns of its own repeats them under its band; a
    // four-column one leaves the last cell empty.
    const at = (group: string) => devices.rows.findIndex((row) => !Array.isArray(row) && 'group' in row && row.group === group)
    const cameraHeader = { cells: ['ลำดับ', 'ชื่อกล้อง', 'กม.ที่', 'การทำงาน', 'สถานะ', 'IP Address'], emphasis: true }
    expect(devices.rows[at('Street Light') + 1]).toEqual({ cells: ['ลำดับ', 'ชื่อจุดติดตั้ง', 'กม.ที่', 'การทำงาน', 'การเชื่อมต่อ', 'สถานะสาย'], emphasis: true })
    expect(devices.rows[at('Street Light') + 3]).toEqual([2, 'สห.4014 ตู้ที่ 2', '-', 'Street Light', 'Connect', 'Disconnect'])
    expect(devices.rows[at('Bridge Lighting') + 1]).toEqual({ cells: ['ลำดับ', 'ชื่อจุดติดตั้ง', 'กม.ที่', 'การทำงาน', 'การเชื่อมต่อ'], emphasis: true })
    expect(devices.rows[at('Bridge Lighting') + 2]).toEqual([1, 'ไฟประดับ : สะพานปิ่นเกล้า', '-', 'Bridge Lighting', 'Connect'])
    // After Tunnel's header, WIM brings the camera one back; LPR after it needs none.
    expect(devices.rows[at('WIM · จุดติดตั้ง : สห.4014 กม.2+800 - 16+700') + 1]).toEqual(cameraHeader)
    expect(devices.rows[at('LPR · จุดติดตั้ง : สห.4014 กม. 16+700') + 1]).toEqual([1, 'กล้อง c5', '16+700', 'CCTV, LPR', 'Connect', '10.0.0.5'])
    // VMS, project 2's only section: a band per sign; the camera header is
    // already in view after project 1's LPR.
    expect(devices.rows.slice(at('VMS · จุดติดตั้ง : ป้าย 11 (ระบบ : ออนไลน์)') - 1)).toEqual([
      expect.objectContaining({ group: expect.stringMatching(/^โครงการที่ 2 :/) }),
      { group: 'VMS · จุดติดตั้ง : ป้าย 11 (ระบบ : ออนไลน์)', tone: 'soft', runs: [{ text: 'VMS · จุดติดตั้ง : ป้าย 11 (ระบบ : ' }, { text: 'ออนไลน์', color: '#00B050' }, { text: ')' }] },
      [1, 'กล้อง c6', '-', 'CCTV, VMS', 'Disconnect', '10.1.1.2'],
      { group: 'VMS · จุดติดตั้ง : ป้าย 12 (ระบบ : ออฟไลน์)', tone: 'soft', runs: [{ text: 'VMS · จุดติดตั้ง : ป้าย 12 (ระบบ : ' }, { text: 'ออฟไลน์', color: '#FF0000' }, { text: ')' }] },
    ])
  })

  it('PDF: says so when there is no project', async () => {
    await exportSummaryPdf({ ...input, summary: [] })
    const devices = (calls.pdf[0] as { blocks: BandedTable[] }).blocks[2]
    expect(devices.title).toBe('รายการอุปกรณ์ทั้งหมดแยกตามโครงการ (0 โครงการ)')
    expect(devices.rows).toEqual([{ group: 'ไม่มีโครงการ' }])
  })
})
