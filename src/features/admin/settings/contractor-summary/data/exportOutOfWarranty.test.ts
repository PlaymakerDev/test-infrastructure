import path from 'node:path'
import dayjs from 'dayjs'
import { beforeAll, describe, expect, it } from 'vitest'
import type { OutOfWarrantyProjectRow } from '@/types/manage/device-status-api'
import { excelTextPx } from '@/utils/export/excel'
import {
  exportRecords,
  outOfWarrantyPdfBlocks,
  projectCells,
  projectPdfColumns,
  projectSheetColumns,
  recordEntry,
  RECORD_COLUMNS,
  RING_SHEET_COLUMNS,
  ringCells,
  type OutOfWarrantyExportInput,
} from './exportOutOfWarranty'
import { OUT_OF_WARRANTY_TYPES } from './outOfWarranty'
import { SUMMARY_SYSTEMS } from './systems'

// แมสซีฟ's records on 2026-11-16, as GET /out-of-warranty answered.
const header = (id: number, name: string, contractNo: string, isWarranty: boolean) => ({
  project_id: id,
  project_name: name,
  contract_no: contractNo,
  budget_year: 2566,
  department: { id: 24, department_short_name: 'ขทช.นครราชสีมา' },
  contractor: { id: 'u', company_name: 'บริษัท แมสซีฟ ซิสเต็ม แอนด์ เทคโนโลยี จำกัด', short_name: 'mst' },
  warranty_start_date: '2023-02-07',
  warranty_end_date: '2025-08-28',
  is_warranty: isWarranty,
  access_scope: 'project' as const,
  roads: [],
})
const record = {
  inspection_result: 'ทดสอบ',
  offline_since: '2026-09-17T11:32:17.785352+07:00',
  created_at: '2026-11-16T15:43:39.820668+07:00',
  created_by: 'b31c',
  created_by_name: 'Domain Administrator',
  updated_at: null,
  updated_by: null,
  is_online: false,
  is_out_of_warranty: true,
}
const P931: OutOfWarrantyProjectRow = {
  ...header(931, 'จ้างก่อสร้างงานบำรุงถนนสาย นม.1001', 'ขทช.นม. 70/2566', false),
  cctv: [
    {
      ...record,
      id: 7,
      images: ['https://its.drr.go.th/its-media/images/out_of_warranty/2026/11/16/a.png', 'https://its.drr.go.th/its-media/images/out_of_warranty/2026/11/16/b.png'],
      camera_id: '63db',
      camera_name: 'DRR-KR1001-CAM07 - กม.14+400 มุ่งหน้าวัดป่าหวาย',
      sta: '14+400',
      ip_address: '10.68.10.7',
      solution_id: 4117,
      solution_name: 'นม.1001 อุโมงค์ทางลอด กม.14+400 - 15+150',
    },
  ],
  vms: [],
  lighting: [],
  traffic: [],
  crosswalk: [],
  bridge_lighting: [],
  tunnel: [],
}
const P598: OutOfWarrantyProjectRow = {
  ...header(598, 'จ้างงานบำรุงถนนสาย สห.4013', 'ขทช.สห./41/2567', true),
  cctv: [],
  vms: [],
  lighting: [{ ...record, id: 9, inspection_result: 'ตู้ระเบิด', images: [], solution_id: 4521, solution_name: 'สห.4013 ตู้ที่ 2 กม.2+400', sta: '2+400', ip_address: '', offline_since: '0001-01-01T00:00:00Z' }],
  traffic: [],
  crosswalk: [],
  bridge_lighting: [],
  tunnel: [],
}
const system = (key: string) => SUMMARY_SYSTEMS.find((item) => item.key === key)!
const TYPES = OUT_OF_WARRANTY_TYPES.filter((type) => ['cctv', 'vms', 'lighting', 'traffic'].includes(type.key))
const input: OutOfWarrantyExportInput = {
  companyName: 'บริษัท แมสซีฟ ซิสเต็ม แอนด์ เทคโนโลยี จำกัด',
  shortName: 'mst',
  rings: [
    { system: system('cctv'), raw: { total: 1124, online: 695, offline: 429 }, outOfWarranty: 2 },
    { system: system('lighting'), raw: { total: 70, online: 47, offline: 23 }, outOfWarranty: 1 },
    { system: system('lpr'), raw: { total: 4, online: 2, offline: 2 }, outOfWarranty: 0 },
  ],
  projects: [P931, P598],
  types: TYPES,
}
const now = dayjs('2026-11-16T16:00:00+07:00')

describe('นำออกเอกสารนอกเหนือการรับประกัน', () => {
  it('rings: as read, with the recorded share of the offline as the tab writes it — a decimal under 1% only', () => {
    expect(input.rings.map(ringCells)).toEqual([
      ['CCTV', 1124, 429, 2, '0.5%'],
      ['Street Light', 70, 23, 1, '4%'],
      ['LPR', 4, 2, 0, '0%'],
    ])
  })

  it('Crosswalk and Tunnel (BE 2026-11-17): their records, counts, cards and badges as the other systems', () => {
    const P1275: OutOfWarrantyProjectRow = {
      ...header(1275, 'โครงการอุโมงค์ทางลอด', 'ขทช.1/2569', true),
      cctv: [],
      vms: [],
      lighting: [],
      traffic: [],
      crosswalk: [{ ...record, id: 21, images: [], solution_id: 7012, solution_name: 'Crosswalk >> หน้าโรงเรียน', sta: '1+200', ip_address: '10.1.2.3' }],
      bridge_lighting: [],
      tunnel: [{ ...record, id: 22, images: [], solution_id: 5120, solution_name: 'อุโมงค์ทางลอด กม.3+000', sta: '3+000', ip_address: '' }],
    }
    const types = OUT_OF_WARRANTY_TYPES.filter((type) => ['cctv', 'crosswalk', 'tunnel'].includes(type.key))
    expect(projectCells(P1275, 0, types).slice(4)).toEqual(['ในค้ำ', 0, 1, 1, 2])
    const records = exportRecords([P1275], now)
    expect(records.map((item) => [item.type.label, item.deviceName, item.point, item.sta])).toEqual([
      ['Crosswalk', 'Crosswalk >> หน้าโรงเรียน', '-', '1+200'],
      ['Tunnel', 'อุโมงค์ทางลอด กม.3+000', '-', '3+000'],
    ])
    expect(records.map((item) => recordEntry(item, [])).map((card) => [card.badge, card.badgeColor])).toEqual([
      ['Crosswalk', '#4338ca'],
      ['Tunnel', '#6d28d9'],
    ])
  })

  it('สรุป: each project, how many of each type it recorded, and the sum', () => {
    expect(projectCells(P931, 0, TYPES)).toEqual([1, 'จ้างก่อสร้างงานบำรุงถนนสาย นม.1001', 'ขทช.นม. 70/2566', 'ขทช.นครราชสีมา', 'หมดค้ำ', 1, 0, 0, 0, 1])
    expect(projectCells(P598, 1, TYPES).slice(4)).toEqual(['ในค้ำ', 0, 0, 1, 0, 1])
  })

  it('the records, project by project: device, install point, dates, cause, photos, who', () => {
    const records = exportRecords(input.projects, now)
    expect(records.map((item) => [item.type.key, item.deviceName])).toEqual([
      ['cctv', 'DRR-KR1001-CAM07 - กม.14+400 มุ่งหน้าวัดป่าหวาย'],
      ['lighting', 'สห.4013 ตู้ที่ 2 กม.2+400'],
    ])
    expect(records[0]).toMatchObject({
      point: 'นม.1001 อุโมงค์ทางลอด กม.14+400 - 15+150',
      sta: '14+400',
      ip: '10.68.10.7',
      offlineSince: '17 ก.ย. 2569',
      offlineDays: 60,
      cause: 'ทดสอบ',
      createdBy: 'Domain Administrator',
      createdAt: '16 พ.ย. 2569 15:43 น.',
    })
    expect(records[0].images).toHaveLength(2)
    // A cabinet is its own install point; Go's zero time is no date; no IP.
    expect(records[1]).toMatchObject({ point: '-', ip: '-', offlineSince: '-', offlineDays: null })
    const row = RECORD_COLUMNS.map((column) => column.value(records[0], 0))
    expect(row).toEqual([
      1,
      'จ้างก่อสร้างงานบำรุงถนนสาย นม.1001',
      'ขทช.นม. 70/2566',
      'CCTV',
      'DRR-KR1001-CAM07 - กม.14+400 มุ่งหน้าวัดป่าหวาย',
      'นม.1001 อุโมงค์ทางลอด กม.14+400 - 15+150',
      '14+400',
      '10.68.10.7',
      '17 ก.ย. 2569',
      '60 วัน',
      'ทดสอบ',
      'https://its.drr.go.th/its-media/images/out_of_warranty/2026/11/16/a.png',
      'https://its.drr.go.th/its-media/images/out_of_warranty/2026/11/16/b.png',
      'Domain Administrator',
      '16 พ.ย. 2569 15:43 น.',
    ])
    expect(RECORD_COLUMNS.map((column) => column.value(records[1], 1)).slice(11, 13)).toEqual(['-', '-'])
  })

  it('PDF: the rings, the projects, then a photo card per record', () => {
    const records = exportRecords(input.projects, now)
    const photos = [
      { dataUrl: 'data:image/jpeg;base64,AA', width: 640, height: 480 },
      { dataUrl: 'data:image/jpeg;base64,BB', width: 480, height: 640 },
    ]
    const blocks = outOfWarrantyPdfBlocks(input, records, [photos])
    expect(blocks.map((block) => [block.type, block.title])).toEqual([
      ['table', 'ภาพรวมอุปกรณ์นอกเหนือการรับประกันทุกโครงการ'],
      ['table', 'ตารางสรุปโครงการที่มีอุปกรณ์นอกเหนือการรับประกัน (2 โครงการ)'],
      ['entries', 'รายการอุปกรณ์นอกเหนือการรับประกัน (2 รายการ)'],
    ])
    const projects = blocks[1] as Extract<(typeof blocks)[number], { type: 'table' }>
    const widths = projects.columns.reduce((sum, column) => sum + ('widthPct' in column ? column.widthPct : 0), 0)
    expect(Math.round(widths)).toBe(100)
    const cards = blocks[2] as Extract<(typeof blocks)[number], { type: 'entries' }>
    expect(cards.items[0]).toEqual(recordEntry(records[0], photos))
    expect(cards.items[0]).toMatchObject({ heading: 'DRR-KR1001-CAM07 - กม.14+400 มุ่งหน้าวัดป่าหวาย', badge: 'CCTV' })
    // Each photo on its own beside the fields — no thumbnail combining them,
    // no "รูปภาพ 2 รูป" line (user 2026-11-17).
    expect(cards.items[0].photos).toEqual(photos)
    expect(cards.items[0].image).toBeUndefined()
    expect(cards.items[0].fields.map((field) => field.label)).toEqual(['จุดติดตั้ง', 'กม.ที่', 'IP Address', 'วันที่เริ่มออฟไลน์', 'ผลการตรวจสอบ / สาเหตุ', 'ผู้บันทึก'])
    expect(cards.items[0].fields.find((field) => field.label === 'วันที่เริ่มออฟไลน์')?.value).toBe('17 ก.ย. 2569 (60 วัน)')
    // A cabinet: no install-point line; no photo, no line for it either.
    expect(cards.items[1].photos).toEqual([])
    expect(cards.items[1].fields.map((field) => field.label)).toEqual(['กม.ที่', 'IP Address', 'วันที่เริ่มออฟไลน์', 'ผลการตรวจสอบ / สาเหตุ', 'ผู้บันทึก'])
  })

  it('Excel: every header on one line, bold as the sheets draw them — the five types too (2026-11-17)', () => {
    // Width w draws trunc(7 × (w + 5/6) + 0.49) px; less 6 of padding. Bold
    // draws ~8% wider than excelTextPx's regular weight.
    const room = (width: number) => Math.trunc(7 * (width + 5 / 6) + 0.49) - 6
    const columns = [...RING_SHEET_COLUMNS, ...projectSheetColumns(OUT_OF_WARRANTY_TYPES), ...RECORD_COLUMNS]
    const tight = columns
      .filter((column) => excelTextPx(column.header) * 1.08 > room(column.width ?? 16))
      .map((column) => `${column.header}: ${Math.ceil(excelTextPx(column.header) * 1.08)} > ${room(column.width ?? 16)}`)
    expect(tight).toEqual([])
    expect(RING_SHEET_COLUMNS.map((column) => column.header)).toEqual(['ระบบ', 'ทั้งหมด', 'ออฟไลน์', 'นอกเหนือการรับประกัน', 'นอกเหนือการรับประกัน (% ของออฟไลน์)'])
  })

  it('a search: the rings say they don’t follow it', () => {
    const blocks = outOfWarrantyPdfBlocks({ ...input, search: 'นม.1001' }, [], [])
    expect(blocks[0].title).toBe('ภาพรวมอุปกรณ์นอกเหนือการรับประกันทุกโครงการ (ไม่กรองตามคำค้นหา)')
  })
})

describe('PDF สรุป with all seven types (Crosswalk and Tunnel since 2026-11-17)', () => {
  // pdf.tsx reads its font from NEXT_PUBLIC_BASE_PATH as it loads — point it
  // at public/ first, as pdf.test.ts does.
  let kit: typeof import('@/utils/export/pdf')
  let face: import('@/utils/export/pdf').FontLike
  beforeAll(async () => {
    process.env.NEXT_PUBLIC_BASE_PATH = path.resolve('public')
    kit = await import('@/utils/export/pdf')
    face = (await kit.loadMeasureFont('NotoSansThai__measure'))!
  }, 60_000)

  it('no header word split at 8pt — "Crosswalk" whole, the Thai headers on one line — and the name keeps 29.5%', () => {
    const columns = projectPdfColumns(OUT_OF_WARRANTY_TYPES)
    const widths = columns.map((column) => ('widthPct' in column ? column.widthPct : 0))
    expect(widths.reduce((sum, width) => sum + width, 0)).toBeCloseTo(100)
    expect(widths[1]).toBeCloseTo(29.5)
    // As prewrapReportArgs measures a cell at 8pt, padding 3: the landscape
    // page's 781.89pt × width, less 3 × 2 + 3 and a space.
    const space = face.layout(' ').advanceWidth * (8 / face.unitsPerEm)
    const linesOf = (column: (typeof columns)[number]) =>
      kit.wrapPdfText(face, column.header, (781.89 * (column as { widthPct: number }).widthPct) / 100 - 9 - space, 8).split(' \n').map((line) => line.trim())
    // The Thai ones: ICU would break "รับผิด|ชอบ", "ค้ำ|ประกัน" — none at all.
    for (const column of [columns[0], ...columns.slice(2, 5)]) expect(linesOf(column)).toEqual([column.header])
    // The rest break between words only: "Bridge / Lighting".
    for (const column of columns.slice(5)) {
      const lines = linesOf(column)
      expect(lines.join(' ')).toBe(column.header)
      expect(lines.every((line) => column.header.split(' ').some((word) => line.split(' ').includes(word)))).toBe(true)
    }
  })
})
