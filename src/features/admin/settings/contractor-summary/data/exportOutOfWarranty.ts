import dayjs, { type Dayjs } from 'dayjs'
import type {
  DeviceTotals,
  OutOfWarrantyCameraItem,
  OutOfWarrantyDeviceType,
  OutOfWarrantyProjectRow,
} from '@/types/manage/device-status-api'
import type { ExportColumn } from '@/utils/export/excel'
import type { FetchedImage } from '@/utils/export/image'
import type { PdfEntryItem, PdfReportBlock, PdfTableColumn } from '@/utils/export/pdf'
import { thaiDateBE, thaiDateTimeBE } from '@/utils/thaiDate'
import { outOfWarrantyPercent } from './deviceStatus'
import { summaryReportTitle } from './exportSummary'
import { OUT_OF_WARRANTY_TYPES, type OutOfWarrantyType } from './outOfWarranty'
import { OUT_OF_WARRANTY_LABEL } from './projectSheet'
import type { SummarySystem } from './systems'

/** นำออกเอกสารนอกเหนือการประกัน (user 2026-11-16) — the นอกเหนือการประกัน
 *  tab's report: its rings (each system's recorded share of the offline), the
 *  projects with records and how many of each type (สรุป), then every record —
 *  the device, what the inspection found, its photos, who recorded it and
 *  when. From GET /manage/project/device-status/out-of-warranty (every page)
 *  and the tab's rings. Excel and PDF hold the same; the PDF shows the photos,
 *  the Excel their links. */
export interface OutOfWarrantyExportInput {
  companyName: string
  shortName: string
  /** The table's ค้นหาโครงการ, when one is on — the rings don't follow it. */
  search?: string
  rings: { system: SummarySystem; raw: DeviceTotals; outOfWarranty: number }[]
  /** The projects with records, each with its recorded devices. */
  projects: OutOfWarrantyProjectRow[]
  /** The types the tab's table shows — a count column each. */
  types: readonly OutOfWarrantyType[]
}

export const OUT_OF_WARRANTY_RINGS_TITLE = 'ภาพรวมอุปกรณ์นอกเหนือการประกันทุกโครงการ'
export const OUT_OF_WARRANTY_PROJECTS_TITLE = 'ตารางสรุปโครงการที่มีอุปกรณ์นอกเหนือการประกัน'
export const OUT_OF_WARRANTY_RECORDS_TITLE = 'รายการอุปกรณ์นอกเหนือการประกัน'

const filenameBase = (input: OutOfWarrantyExportInput) => `สรุปข้อมูลผู้รับจ้าง_${input.shortName || 'ผู้รับจ้าง'}_นอกเหนือการประกัน`
const filterNote = (input: OutOfWarrantyExportInput) =>
  `สถานะค้ำประกัน: ${OUT_OF_WARRANTY_LABEL}${input.search ? ` · ค้นหาโครงการ: "${input.search}"` : ''}`
const ringsTitle = (input: OutOfWarrantyExportInput) =>
  input.search ? `${OUT_OF_WARRANTY_RINGS_TITLE} (ไม่กรองตามคำค้นหา)` : OUT_OF_WARRANTY_RINGS_TITLE

// ── the rings ──

const RING_HEADERS = ['ระบบ', 'ทั้งหมด', 'ออฟไลน์', OUT_OF_WARRANTY_LABEL, `${OUT_OF_WARRANTY_LABEL} (% ของออฟไลน์)`]

/** As the tab's ring says it: "<1%" when a record or two rounds to nothing. */
export const excludedShare = (ring: OutOfWarrantyExportInput['rings'][number]): string => {
  const percent = outOfWarrantyPercent(ring)
  return ring.outOfWarranty > 0 && percent === 0 ? '<1%' : `${percent}%`
}

export const ringCells = (ring: OutOfWarrantyExportInput['rings'][number]): (string | number)[] => [
  ring.system.label,
  ring.raw.total,
  ring.raw.offline,
  ring.outOfWarranty,
  excludedShare(ring),
]

// ── สรุป: the projects ──

const warrantyText = (row: OutOfWarrantyProjectRow) => (row.is_warranty ? 'ในค้ำ' : 'หมดค้ำ')

/** How many devices of the type the project has recorded. */
export const recordedCount = (row: OutOfWarrantyProjectRow, type: OutOfWarrantyDeviceType): number => row[type]?.length ?? 0

const recordedTotal = (row: OutOfWarrantyProjectRow) => OUT_OF_WARRANTY_TYPES.reduce((sum, type) => sum + recordedCount(row, type.key), 0)

export const projectCells = (row: OutOfWarrantyProjectRow, index: number, types: readonly OutOfWarrantyType[]): (string | number)[] => [
  index + 1,
  row.project_name || '-',
  row.contract_no?.trim() || '-',
  row.department?.department_short_name?.trim() || '-',
  warrantyText(row),
  ...types.map((type) => recordedCount(row, type.key)),
  recordedTotal(row),
]

const projectHeaders = (types: readonly OutOfWarrantyType[]) => [
  'ลำดับ',
  'ชื่อโครงการ',
  'เลขที่สัญญา',
  'หน่วยงานรับผิดชอบ',
  'สถานะค้ำประกัน',
  ...types.map((type) => type.label),
  'รวม',
]

// ── the records ──

/** One recorded device as the report lists it. */
export interface OutOfWarrantyExportRecord {
  projectName: string
  contractNo: string
  type: OutOfWarrantyType
  deviceName: string
  /** A camera's CCTV install point; '-' for the rest (they are their own). */
  point: string
  sta: string
  ip: string
  offlineSince: string
  offlineDays: number | null
  cause: string
  images: string[]
  createdBy: string
  createdAt: string
}

const km = (sta: string | null | undefined) => (sta ?? '').trim().replace(/^กม\.?\s*/, '') || '-'
const realDate = (iso: string | null | undefined) => (iso && !iso.startsWith('0001-01-01') && dayjs(iso).isValid() ? iso : null)

/** Every record, project by project, each project's in the dropdown's order
 *  (CCTV, VMS, Street Light, Traffic Signal, Bridge Lighting). */
export const exportRecords = (projects: OutOfWarrantyProjectRow[], now: Dayjs = dayjs()): OutOfWarrantyExportRecord[] =>
  projects.flatMap((project) =>
    OUT_OF_WARRANTY_TYPES.flatMap((type) =>
      (project[type.key] ?? []).map((item): OutOfWarrantyExportRecord => {
        const camera = type.key === 'cctv' ? (item as OutOfWarrantyCameraItem) : null
        const since = realDate(item.offline_since)
        return {
          projectName: project.project_name || '-',
          contractNo: project.contract_no?.trim() || '-',
          type,
          deviceName: (camera ? camera.camera_name : item.solution_name)?.trim() || '-',
          point: camera ? item.solution_name?.trim() || '-' : '-',
          sta: km(item.sta),
          ip: item.ip_address?.trim() || '-',
          offlineSince: since ? thaiDateBE(since) : '-',
          offlineDays: since ? Math.max(0, now.diff(dayjs(since), 'day')) : null,
          cause: item.inspection_result?.trim() || '-',
          images: (item.images ?? []).filter(Boolean),
          createdBy: item.created_by_name?.trim() || '-',
          createdAt: realDate(item.created_at) ? thaiDateTimeBE(item.created_at) : '-',
        }
      }),
    ),
  )

const daysText = (record: OutOfWarrantyExportRecord) => (record.offlineDays != null ? `${record.offlineDays} วัน` : '-')

export const RECORD_COLUMNS: ExportColumn<OutOfWarrantyExportRecord>[] = [
  { header: 'ลำดับ', width: 8, align: 'center', value: (_record, index) => index + 1 },
  { header: 'ชื่อโครงการ', width: 40, wrap: true, value: (record) => record.projectName },
  { header: 'เลขที่สัญญา', width: 18, wrap: true, value: (record) => record.contractNo },
  { header: 'ประเภท', width: 14, value: (record) => record.type.label },
  { header: 'ชื่ออุปกรณ์', width: 36, wrap: true, value: (record) => record.deviceName },
  { header: 'จุดติดตั้ง', width: 28, wrap: true, value: (record) => record.point },
  { header: 'กม.ที่', width: 10, align: 'center', value: (record) => record.sta },
  { header: 'IP Address', width: 16, align: 'center', value: (record) => record.ip },
  { header: 'วันที่เริ่มออฟไลน์', width: 16, align: 'center', value: (record) => record.offlineSince },
  { header: 'จำนวนวันออฟไลน์', width: 15, align: 'center', value: daysText },
  { header: 'ผลการตรวจสอบ / สาเหตุ', width: 40, wrap: true, value: (record) => record.cause },
  { header: 'รูปภาพ 1', width: 30, value: (record) => record.images[0] ?? '-' },
  { header: 'รูปภาพ 2', width: 30, value: (record) => record.images[1] ?? '-' },
  { header: 'ผู้บันทึก', width: 24, wrap: true, value: (record) => record.createdBy },
  { header: 'วันที่บันทึก', width: 20, align: 'center', value: (record) => record.createdAt },
]

// Printable dark tones for the PDF cards' type badge.
const BADGE_COLOR: Record<OutOfWarrantyDeviceType, string> = {
  cctv: '#1d4ed8',
  vms: '#c2410c',
  lighting: '#4d7c0f',
  traffic: '#15803d',
  bridge_lighting: '#b91c1c',
}

/** A record as a PDF photo card: its photos, the device, then the fields. */
export const recordEntry = (record: OutOfWarrantyExportRecord, image: PdfEntryItem['image']): PdfEntryItem => ({
  image,
  heading: record.deviceName,
  subheading: `${record.projectName} · เลขที่สัญญา ${record.contractNo}`,
  badge: record.type.label,
  badgeColor: BADGE_COLOR[record.type.key],
  fields: [
    ...(record.point !== '-' ? [{ label: 'จุดติดตั้ง', value: record.point }] : []),
    { label: 'กม.ที่', value: record.sta },
    { label: 'IP Address', value: record.ip },
    { label: 'วันที่เริ่มออฟไลน์', value: record.offlineDays != null ? `${record.offlineSince} (${daysText(record)})` : '-' },
    { label: 'ผลการตรวจสอบ / สาเหตุ', value: record.cause },
    { label: 'ผู้บันทึก', value: `${record.createdBy} · ${record.createdAt}` },
    { label: 'รูปภาพ', value: record.images.length ? `${record.images.length} รูป` : 'ไม่มีรูป' },
  ],
})

// ── photos for the PDF (browser only) ──

const FRAME_W = 640
const FRAME_H = 360

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })

/** A record's photos as the card's one picture: the photo, or both side by
 *  side — each whole in its half of a 16:9 frame, which the card shows
 *  uncropped. Fetched through the app's proxy (its-media sends no CORS);
 *  null when none comes back. */
const recordPicture = async (images: string[]): Promise<PdfEntryItem['image']> => {
  const { fetchImageAsDataUrl } = await import('@/utils/export/image')
  const shots = (await Promise.all(images.slice(0, 2).map((url) => fetchImageAsDataUrl(url, FRAME_W)))).filter((shot): shot is FetchedImage => shot !== null)
  if (shots.length === 0) return null
  const canvas = document.createElement('canvas')
  canvas.width = FRAME_W
  canvas.height = FRAME_H
  const ctx = canvas.getContext('2d')
  if (!ctx) return shots[0]
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, FRAME_W, FRAME_H)
  const slot = FRAME_W / shots.length
  for (const [index, shot] of shots.entries()) {
    const img = await loadImage(shot.dataUrl)
    const scale = Math.min(slot / img.width, FRAME_H / img.height)
    const w = img.width * scale
    const h = img.height * scale
    ctx.drawImage(img, index * slot + (slot - w) / 2, (FRAME_H - h) / 2, w, h)
  }
  return { dataUrl: canvas.toDataURL('image/jpeg', 0.85), width: FRAME_W, height: FRAME_H }
}

/** Every card's picture, a few records at a time. */
const recordPictures = async (records: OutOfWarrantyExportRecord[]): Promise<PdfEntryItem['image'][]> => {
  const pictures: PdfEntryItem['image'][] = []
  for (let i = 0; i < records.length; i += 4) {
    pictures.push(...(await Promise.all(records.slice(i, i + 4).map((record) => recordPicture(record.images).catch(() => null)))))
  }
  return pictures
}

// ── the files ──

const projectPdfColumns = (types: readonly OutOfWarrantyType[]): PdfTableColumn[] => {
  // ลำดับ 5, name 27, contract 12, department 11, warranty 7 = 62; the counts
  // share 38 — room for "Lighting", the widest header word, whole (5% split
  // "Stree t Light").
  const each = 38 / (types.length + 1)
  return [
    { header: 'ลำดับ', widthPct: 5 },
    { header: 'ชื่อโครงการ', widthPct: 27, align: 'left' },
    { header: 'เลขที่สัญญา', widthPct: 12 },
    { header: 'หน่วยงานรับผิดชอบ', widthPct: 11 },
    { header: 'สถานะค้ำประกัน', widthPct: 7 },
    ...types.map((type): PdfTableColumn => ({ header: type.label, widthPct: each })),
    { header: 'รวม', widthPct: each },
  ]
}

export const outOfWarrantyPdfBlocks = (
  input: OutOfWarrantyExportInput,
  records: OutOfWarrantyExportRecord[],
  pictures: PdfEntryItem['image'][],
): PdfReportBlock[] => [
  {
    type: 'table',
    title: ringsTitle(input),
    columns: [
      { header: RING_HEADERS[0], widthPct: 28 },
      { header: RING_HEADERS[1], widthPct: 15, align: 'right' },
      { header: RING_HEADERS[2], widthPct: 15, align: 'right' },
      { header: RING_HEADERS[3], widthPct: 18, align: 'right' },
      { header: RING_HEADERS[4], widthPct: 24, align: 'right' },
    ],
    rows: input.rings.map(ringCells),
  },
  {
    type: 'table',
    title: `${OUT_OF_WARRANTY_PROJECTS_TITLE} (${input.projects.length} โครงการ)`,
    columns: projectPdfColumns(input.types),
    rows: input.projects.length
      ? input.projects.map((row, index) => projectCells(row, index, input.types))
      : [{ group: 'ไม่มีโครงการ' }],
  },
  {
    type: 'entries',
    title: `${OUT_OF_WARRANTY_RECORDS_TITLE} (${records.length} รายการ)`,
    items: records.map((record, index) => recordEntry(record, pictures[index] ?? null)),
  },
]

export const exportOutOfWarrantyPdf = async (input: OutOfWarrantyExportInput) => {
  const { exportReportPdf } = await import('@/utils/export/pdf')
  const records = exportRecords(input.projects)
  const pictures = await recordPictures(records)
  await exportReportPdf({
    filenameBase: filenameBase(input),
    title: summaryReportTitle(input.companyName),
    subtitleNote: filterNote(input),
    orientation: 'landscape',
    blocks: outOfWarrantyPdfBlocks(input, records, pictures),
  })
}

export const exportOutOfWarrantyExcel = async (input: OutOfWarrantyExportInput) => {
  const { exportExcelSheets, excelSheet } = await import('@/utils/export/excel')
  const title = summaryReportTitle(input.companyName)
  const note = filterNote(input)
  exportExcelSheets({
    filenameBase: filenameBase(input),
    sheets: [
      excelSheet({
        sheetName: 'ภาพรวมอุปกรณ์',
        title: `${title} · ${OUT_OF_WARRANTY_RINGS_TITLE}`,
        // The rings were read without the search.
        filterNote: `สถานะค้ำประกัน: ${OUT_OF_WARRANTY_LABEL}`,
        columns: RING_HEADERS.map((header, index) => ({
          header,
          width: index === 0 ? 22 : index === 4 ? 34 : 18,
          value: (ring: OutOfWarrantyExportInput['rings'][number]) => ringCells(ring)[index],
        })),
        rows: input.rings,
      }),
      excelSheet({
        sheetName: 'สรุป',
        title: `${title} · ${OUT_OF_WARRANTY_PROJECTS_TITLE}`,
        filterNote: note,
        columns: projectHeaders(input.types).map((header, index) => ({
          header,
          width: [8, 46, 20, 20, 14][index] ?? 14,
          ...(index === 1 || index === 2 ? { wrap: true } : {}),
          ...(index >= 4 || index === 0 ? { align: 'center' as const } : {}),
          value: (row: OutOfWarrantyProjectRow, rowIndex: number) => projectCells(row, rowIndex, input.types)[index],
        })),
        rows: input.projects,
      }),
      excelSheet({
        sheetName: OUT_OF_WARRANTY_LABEL,
        title: `${title} · ${OUT_OF_WARRANTY_RECORDS_TITLE}`,
        filterNote: note,
        columns: RECORD_COLUMNS,
        rows: exportRecords(input.projects),
      }),
    ],
  })
}
