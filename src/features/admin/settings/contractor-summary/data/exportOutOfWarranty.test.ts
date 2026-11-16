import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import type { OutOfWarrantyProjectRow } from '@/types/manage/device-status-api'
import {
  excludedShare,
  exportRecords,
  outOfWarrantyPdfBlocks,
  projectCells,
  recordEntry,
  RECORD_COLUMNS,
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
  bridge_lighting: [],
}
const P598: OutOfWarrantyProjectRow = {
  ...header(598, 'จ้างงานบำรุงถนนสาย สห.4013', 'ขทช.สห./41/2567', true),
  cctv: [],
  vms: [],
  lighting: [{ ...record, id: 9, inspection_result: 'ตู้ระเบิด', images: [], solution_id: 4521, solution_name: 'สห.4013 ตู้ที่ 2 กม.2+400', sta: '2+400', ip_address: '', offline_since: '0001-01-01T00:00:00Z' }],
  traffic: [],
  bridge_lighting: [],
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

describe('นำออกเอกสารนอกเหนือการประกัน', () => {
  it('rings: as read, with the recorded share of the offline — "<1%" when it rounds to nothing', () => {
    expect(input.rings.map(ringCells)).toEqual([
      ['CCTV', 1124, 429, 2, '<1%'],
      ['Street Light', 70, 23, 1, '4%'],
      ['LPR', 4, 2, 0, '0%'],
    ])
    expect(excludedShare({ ...input.rings[0], outOfWarranty: 0 })).toBe('0%')
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
    const picture = { dataUrl: 'data:image/jpeg;base64,AA', width: 640, height: 360 }
    const blocks = outOfWarrantyPdfBlocks(input, records, [picture, null])
    expect(blocks.map((block) => [block.type, block.title])).toEqual([
      ['table', 'ภาพรวมอุปกรณ์นอกเหนือการประกันทุกโครงการ'],
      ['table', 'ตารางสรุปโครงการที่มีอุปกรณ์นอกเหนือการประกัน (2 โครงการ)'],
      ['entries', 'รายการอุปกรณ์นอกเหนือการประกัน (2 รายการ)'],
    ])
    const projects = blocks[1] as Extract<(typeof blocks)[number], { type: 'table' }>
    const widths = projects.columns.reduce((sum, column) => sum + ('widthPct' in column ? column.widthPct : 0), 0)
    expect(Math.round(widths)).toBe(100)
    const cards = blocks[2] as Extract<(typeof blocks)[number], { type: 'entries' }>
    expect(cards.items[0]).toEqual(recordEntry(records[0], picture))
    expect(cards.items[0]).toMatchObject({ heading: 'DRR-KR1001-CAM07 - กม.14+400 มุ่งหน้าวัดป่าหวาย', badge: 'CCTV' })
    expect(cards.items[0].fields.map((field) => field.label)).toEqual(['จุดติดตั้ง', 'กม.ที่', 'IP Address', 'วันที่เริ่มออฟไลน์', 'ผลการตรวจสอบ / สาเหตุ', 'ผู้บันทึก', 'รูปภาพ'])
    expect(cards.items[0].fields.find((field) => field.label === 'วันที่เริ่มออฟไลน์')?.value).toBe('17 ก.ย. 2569 (60 วัน)')
    // A cabinet: no install-point line, no photo, says so.
    expect(cards.items[1].image).toBeNull()
    expect(cards.items[1].fields.map((field) => field.label)).not.toContain('จุดติดตั้ง')
    expect(cards.items[1].fields.find((field) => field.label === 'รูปภาพ')?.value).toBe('ไม่มีรูป')
  })

  it('a search: the rings say they don’t follow it', () => {
    const blocks = outOfWarrantyPdfBlocks({ ...input, search: 'นม.1001' }, [], [])
    expect(blocks[0].title).toBe('ภาพรวมอุปกรณ์นอกเหนือการประกันทุกโครงการ (ไม่กรองตามคำค้นหา)')
  })
})
