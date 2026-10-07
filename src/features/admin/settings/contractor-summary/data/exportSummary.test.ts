import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProjectDeviceStatusRow } from '@/types/manage/device-status-api'
import { exportSummaryExcel, exportSummaryPdf, type SummaryExportInput } from './exportSummary'
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

const input: SummaryExportInput = {
  companyName: 'บริษัท ที ไอ เค คอร์ปอเรชั่น จำกัด',
  shortName: 'tik',
  warrantyLabel: 'ในค้ำ',
  rings: [{ system: SUMMARY_SYSTEMS[0], totals: { total: 269, online: 230, offline: 39 } }],
  projects: [project(163, 'สทช.ที่ 2/26/2567'), project(504, null)],
}

type Table = { type: 'table'; title: string; columns: { header: string; widthPct: number }[]; rows: (string | number)[][] }

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

  it('Excel: the same third column on the projects sheet, the filter on both sheets', async () => {
    await exportSummaryExcel(input)
    const { sheets } = calls.excel[0] as { sheets: { sheetName: string; filterNote?: string; headers: { header: string }[]; cells: (string | number)[][] }[] }
    const projects = sheets.find((s) => s.sheetName === 'โครงการ')!
    expect(projects.headers.map((h) => h.header).slice(0, 4)).toEqual(['ลำดับ', 'ชื่อโครงการ', 'เลขที่สัญญา', 'CCTV ออนไลน์'])
    expect(projects.cells[0].slice(0, 3)).toEqual([1, 'โครงการ 163', 'สทช.ที่ 2/26/2567'])
    expect(sheets.map((s) => s.filterNote)).toEqual(['สถานะค้ำประกัน: ในค้ำ', 'สถานะค้ำประกัน: ในค้ำ'])
  })
})
