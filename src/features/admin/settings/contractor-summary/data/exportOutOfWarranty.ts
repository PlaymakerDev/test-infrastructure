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
import { outOfWarrantyShareText } from './deviceStatus'
import { summaryReportTitle } from './exportSummary'
import { OUT_OF_WARRANTY_MAX_PHOTOS, OUT_OF_WARRANTY_PHOTO_EDGE, OUT_OF_WARRANTY_TYPES, type OutOfWarrantyType } from './outOfWarranty'
import { OUT_OF_WARRANTY_LABEL } from './projectSheet'
import type { SummarySystem } from './systems'

/** นำออกเอกสารนอกเหนือการรับประกัน (user 2026-11-16) — the นอกเหนือการรับประกัน
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

export const OUT_OF_WARRANTY_RINGS_TITLE = 'ภาพรวมอุปกรณ์นอกเหนือการรับประกันทุกโครงการ'
export const OUT_OF_WARRANTY_PROJECTS_TITLE = 'ตารางสรุปโครงการที่มีอุปกรณ์นอกเหนือการรับประกัน'
export const OUT_OF_WARRANTY_RECORDS_TITLE = 'รายการอุปกรณ์นอกเหนือการรับประกัน'

const filenameBase = (input: OutOfWarrantyExportInput) => `สรุปข้อมูลผู้รับจ้าง_${input.shortName || 'ผู้รับจ้าง'}_นอกเหนือการรับประกัน`
const filterNote = (input: OutOfWarrantyExportInput) =>
  `สถานะค้ำประกัน: ${OUT_OF_WARRANTY_LABEL}${input.search ? ` · ค้นหาโครงการ: "${input.search}"` : ''}`
const ringsTitle = (input: OutOfWarrantyExportInput) =>
  input.search ? `${OUT_OF_WARRANTY_RINGS_TITLE} (ไม่กรองตามคำค้นหา)` : OUT_OF_WARRANTY_RINGS_TITLE

// ── the rings ──

const RING_HEADERS = ['ระบบ', 'ทั้งหมด', 'ออฟไลน์', OUT_OF_WARRANTY_LABEL, `${OUT_OF_WARRANTY_LABEL} (% ของออฟไลน์)`]

/** A ring as the tab shows it — its share written the same ("0.2%"). */
export const ringCells = (ring: OutOfWarrantyExportInput['rings'][number]): (string | number)[] => [
  ring.system.label,
  ring.raw.total,
  ring.raw.offline,
  ring.outOfWarranty,
  outOfWarrantyShareText(ring),
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

// The Excel sheets' widths: each (bold) header on one line — Excel would
// break a Thai word anywhere to wrap it (2026-11-17).
const RING_SHEET_WIDTHS = [22, 18, 18, 24, 41]
const PROJECT_SHEET_WIDTHS = [8, 46, 20, 22, 18]
const PROJECT_SHEET_COUNT_WIDTH = 17

/** ภาพรวมอุปกรณ์'s columns. */
export const RING_SHEET_COLUMNS: ExportColumn<OutOfWarrantyExportInput['rings'][number]>[] = RING_HEADERS.map((header, index) => ({
  header,
  width: RING_SHEET_WIDTHS[index],
  value: (ring) => ringCells(ring)[index],
}))

/** สรุป's columns: the project, then a count per type the tab shows. */
export const projectSheetColumns = (types: readonly OutOfWarrantyType[]): ExportColumn<OutOfWarrantyProjectRow>[] =>
  projectHeaders(types).map((header, index) => ({
    header,
    width: PROJECT_SHEET_WIDTHS[index] ?? PROJECT_SHEET_COUNT_WIDTH,
    ...(index === 1 || index === 2 ? { wrap: true } : {}),
    ...(index >= 4 || index === 0 ? { align: 'center' as const } : {}),
    value: (row, rowIndex) => projectCells(row, rowIndex, types)[index],
  }))

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
  { header: 'วันที่เริ่มออฟไลน์', width: 17, align: 'center', value: (record) => record.offlineSince },
  { header: 'จำนวนวันออฟไลน์', width: 18, align: 'center', value: daysText },
  { header: 'ผลการตรวจสอบ / สาเหตุ', width: 40, wrap: true, value: (record) => record.cause },
  { header: 'รูปภาพ 1', width: 30, value: (record) => record.images[0] ?? '-' },
  { header: 'รูปภาพ 2', width: 30, value: (record) => record.images[1] ?? '-' },
  { header: 'ผู้บันทึก', width: 24, wrap: true, value: (record) => record.createdBy },
  { header: 'วันที่บันทึก', width: 20, align: 'center', value: (record) => record.createdAt },
]

// Printable dark tones of the rings' colours, for the PDF cards' type badge.
const BADGE_COLOR: Record<OutOfWarrantyDeviceType, string> = {
  cctv: '#1d4ed8',
  vms: '#c2410c',
  lighting: '#4d7c0f',
  traffic: '#15803d',
  crosswalk: '#4338ca',
  bridge_lighting: '#b91c1c',
  tunnel: '#6d28d9',
}

/** A record's photos as the PDF carries them. */
export type OutOfWarrantyPdfPhoto = NonNullable<PdfEntryItem['photos']>[number]

/** A record as a PDF card: the device and its fields, its photos beside
 *  them, each whole and apart (user 2026-11-17: both in the one thumbnail
 *  ran together, too small to see) — the photos speak for themselves, no
 *  "รูปภาพ N รูป" line (user, same day). */
export const recordEntry = (record: OutOfWarrantyExportRecord, photos: OutOfWarrantyPdfPhoto[]): PdfEntryItem => ({
  photos,
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
  ],
})

// ── photos for the PDF (browser only) ──

/** A record's photos, each on its own, through the app's proxy (its-media
 *  sends no CORS) — sharp at the size the card prints them: one alone spans
 *  the photos' whole width, so it comes at the upload's own 1280px. One that
 *  doesn't come back is left out. */
const recordPhotos = async (images: string[]): Promise<OutOfWarrantyPdfPhoto[]> => {
  const { fetchImageAsDataUrl } = await import('@/utils/export/image')
  const urls = images.slice(0, OUT_OF_WARRANTY_MAX_PHOTOS)
  const maxWidth = urls.length === 1 ? OUT_OF_WARRANTY_PHOTO_EDGE : 640
  const shots = await Promise.all(urls.map((url) => fetchImageAsDataUrl(url, maxWidth)))
  return shots.filter((shot): shot is FetchedImage => shot !== null)
}

/** Every card's photos, a few records at a time. */
const recordPhotoSets = async (records: OutOfWarrantyExportRecord[]): Promise<OutOfWarrantyPdfPhoto[][]> => {
  const sets: OutOfWarrantyPdfPhoto[][] = []
  for (let i = 0; i < records.length; i += 4) {
    sets.push(...(await Promise.all(records.slice(i, i + 4).map((record) => recordPhotos(record.images).catch(() => [])))))
  }
  return sets
}

// ── the files ──

// สรุป's PDF table at 8pt, padding 3, each column as wide as its header's
// widest word needs whole (one too wide is split — "Stree t Light"; ICU
// breaks "รับผิด|ชอบ"): the Thai headers on one line, a count column per its
// type ("Crosswalk" the widest) — measured 2026-11-17, kept by the test. The
// name takes the rest: 29.5% with all seven types.
const PROJECT_PDF_FONT = 8
const PROJECT_PDF_PADDING = 3
const COUNT_PCT: Record<OutOfWarrantyDeviceType, number> = {
  cctv: 4.5,
  vms: 4.5,
  lighting: 4.5,
  traffic: 4.5,
  bridge_lighting: 5.5,
  crosswalk: 6.5,
  tunnel: 5,
}
const TOTAL_PCT = 4.5

export const projectPdfColumns = (types: readonly OutOfWarrantyType[]): PdfTableColumn[] => {
  // ลำดับ 4, contract 9, department 10, warranty 8 = 31.
  const counts = types.reduce((sum, type) => sum + COUNT_PCT[type.key], TOTAL_PCT)
  return [
    { header: 'ลำดับ', widthPct: 4 },
    { header: 'ชื่อโครงการ', widthPct: 100 - 31 - counts, align: 'left' },
    { header: 'เลขที่สัญญา', widthPct: 9 },
    { header: 'หน่วยงานรับผิดชอบ', widthPct: 10 },
    { header: 'สถานะค้ำประกัน', widthPct: 8 },
    ...types.map((type): PdfTableColumn => ({ header: type.label, widthPct: COUNT_PCT[type.key] })),
    { header: 'รวม', widthPct: TOTAL_PCT },
  ]
}

export const outOfWarrantyPdfBlocks = (
  input: OutOfWarrantyExportInput,
  records: OutOfWarrantyExportRecord[],
  photos: OutOfWarrantyPdfPhoto[][],
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
    fontSize: PROJECT_PDF_FONT,
    cellPadding: PROJECT_PDF_PADDING,
    rows: input.projects.length
      ? input.projects.map((row, index) => projectCells(row, index, input.types))
      : [{ group: 'ไม่มีโครงการ' }],
  },
  {
    type: 'entries',
    title: `${OUT_OF_WARRANTY_RECORDS_TITLE} (${records.length} รายการ)`,
    items: records.map((record, index) => recordEntry(record, photos[index] ?? [])),
  },
]

export const exportOutOfWarrantyPdf = async (input: OutOfWarrantyExportInput) => {
  const { exportReportPdf } = await import('@/utils/export/pdf')
  const records = exportRecords(input.projects)
  const photos = await recordPhotoSets(records)
  await exportReportPdf({
    filenameBase: filenameBase(input),
    title: summaryReportTitle(input.companyName),
    subtitleNote: filterNote(input),
    orientation: 'landscape',
    blocks: outOfWarrantyPdfBlocks(input, records, photos),
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
        columns: RING_SHEET_COLUMNS,
        rows: input.rings,
      }),
      excelSheet({
        sheetName: 'สรุป',
        title: `${title} · ${OUT_OF_WARRANTY_PROJECTS_TITLE}`,
        filterNote: note,
        columns: projectSheetColumns(input.types),
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
