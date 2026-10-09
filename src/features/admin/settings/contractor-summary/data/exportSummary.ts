import { DEVICE_BADGE } from '@/constants/cctv'
import type {
  DeviceTotals,
  ProjectCameraListCamera,
  ProjectCameraListItem,
  ProjectDeviceStatusRow,
  ProjectLightingItem,
  ProjectLightingListItem,
  ProjectVMSItem,
  ProjectVMSListItem,
} from '@/types/manage/device-status-api'
import type { ExportColumn, ExportSheetArgs } from '@/utils/export/excel'
import type { PdfReportBlock, PdfTableRow } from '@/utils/export/pdf'
import type { SummarySystem } from './systems'
import { cameraBadges, offlinePercent } from './deviceStatus'

/** นำออกเอกสาร of the สรุปข้อมูลผู้รับจ้าง page: the two things it shows — the
 *  per-system rings and the project table, both under the page's warranty
 *  filter — then what the page doesn't show: those projects' offline CCTV
 *  cameras (user 2026-10-08), street-light cabinets and VMS signs (2026-10-09),
 *  project by project. Built with the app's export kit; the columns mirror the
 *  screen, plus เลขที่สัญญา after the project name (user 2026-10-07). */
export interface SummaryExportInput {
  companyName: string
  shortName: string
  /** ทั้งหมด / ในค้ำ / หมดค้ำ — the filter the rings and the table were read under. */
  warrantyLabel: string
  rings: { system: SummarySystem; totals: DeviceTotals }[]
  projects: ProjectDeviceStatusRow[]
  /** GET /manage/project/device-status/{cameras,lighting,vms}?is_online=false —
   *  every project of the contractor; only those in `projects` reach the report. */
  cameraProjects: ProjectCameraListItem[]
  lightingProjects: ProjectLightingListItem[]
  vmsProjects: ProjectVMSListItem[]
}

export const summaryReportTitle = (companyName: string) => `สรุปข้อมูลผู้รับจ้าง — ${companyName || '-'}`
export const RINGS_TITLE = 'ภาพรวมสถานะการทำงานของอุปกรณ์ทุกโครงการ'
export const PROJECTS_TITLE = 'ตารางสรุปโครงการและสถานะการทำงานของอุปกรณ์ทุกโครงการ'

const filenameBase = (input: SummaryExportInput) => `สรุปข้อมูลผู้รับจ้าง_${input.shortName || 'ผู้รับจ้าง'}`
export const warrantyNote = (input: Pick<SummaryExportInput, 'warrantyLabel'>) => `สถานะค้ำประกัน: ${input.warrantyLabel}`

const ringCells = ({ system, totals }: SummaryExportInput['rings'][number]): (string | number)[] => [
  system.label,
  totals.total,
  totals.online,
  totals.offline,
  `${offlinePercent(totals)}%`,
]

export const projectCells = (project: ProjectDeviceStatusRow, index: number): (string | number)[] => [
  index + 1,
  project.project_name || '-',
  project.contract_no?.trim() || '-',
  project.cameras?.online ?? 0,
  project.cameras?.offline ?? 0,
  project.vms?.online ?? 0,
  project.vms?.offline ?? 0,
  project.lighting?.online ?? 0,
  project.lighting?.offline ?? 0,
]

const RING_HEADERS = ['ระบบ', 'ทั้งหมด', 'ออนไลน์', 'ออฟไลน์', 'ออฟไลน์ (%)']
export const PROJECT_HEADERS = [
  'ลำดับ',
  'ชื่อโครงการ',
  'เลขที่สัญญา',
  'CCTV ออนไลน์',
  'CCTV ออฟไลน์',
  'VMS ออนไลน์',
  'VMS ออฟไลน์',
  'Street Light ออนไลน์',
  'Street Light ออฟไลน์',
]
// PDF widths (%), parallel to PROJECT_HEADERS — they sum to 100. The counts
// keep their 9%: at 8% "ออฟไลน์" no longer fits beside "CCTV" and the header
// broke inside the word ("CCTV ออฟ / ไลน์").
const PROJECT_PDF_WIDTHS = [5, 29, 12, 9, 9, 9, 9, 9, 9]
// Excel widths (characters), parallel to PROJECT_HEADERS.
const PROJECT_EXCEL_WIDTHS = [8, 70, 22, 16, 16, 16, 16, 16, 16]

// ── Offline devices, project by project ──────────────────────────────────────

/** One kind of device the report lists offline. Each kind gets the same
 *  layout: a page of its own, a band per project, an Excel sheet of its own. */
export interface OfflineKind<Item> {
  title: string
  /** "กล้อง 278 ตัว" in the title: what is counted, and its classifier. */
  noun: string
  unit: string
  /** The PDF section's only line when no project has one offline. */
  empty: string
  sheetName: string
  /** The columns after ลำดับ: PDF width (%), Excel width (chars), cell. */
  columns: { header: string; widthPct: number; width: number; align?: 'left'; value: (item: Item) => string }[]
}

/** The bare chainage — the header already says กม.ที่. */
const km = (sta: string | null | undefined) => (sta ?? '').trim().replace(/^กม\.?\s*/, '') || '-'

export const CCTV_OFFLINE: OfflineKind<ProjectCameraListCamera> = {
  title: 'รายการกล้องออฟไลน์แยกตามโครงการ',
  noun: 'กล้อง',
  unit: 'ตัว',
  empty: 'ไม่มีกล้องออฟไลน์',
  sheetName: 'กล้องออฟไลน์',
  columns: [
    { header: 'ชื่อกล้อง', widthPct: 42, width: 40, align: 'left', value: (camera) => camera.camera_name?.trim() || '-' },
    { header: 'กม.ที่', widthPct: 12, width: 12, value: (camera) => km(camera.sta) },
    // The Live Stream card's tags as text ("CCTV, VMS").
    {
      header: 'การทำงาน',
      widthPct: 24,
      width: 26,
      value: (camera) => cameraBadges(camera.solution_types).map((key) => DEVICE_BADGE[key].label).join(', '),
    },
    { header: 'IP Address', widthPct: 16, width: 18, value: (camera) => camera.ip_address?.trim() || '-' },
  ],
}

export const LIGHTING_OFFLINE: OfflineKind<ProjectLightingItem> = {
  title: 'รายการ Street Light ออฟไลน์แยกตามโครงการ',
  noun: 'ตู้ป้องกันโจรกรรม',
  unit: 'ตู้',
  empty: 'ไม่มี Street Light ออฟไลน์',
  sheetName: 'Street Light ออฟไลน์',
  columns: [
    { header: 'จุดติดตั้งตู้ป้องกันโจรกรรม', widthPct: 74, width: 60, align: 'left', value: (cabinet) => cabinet.solution_name?.trim() || '-' },
    // In place of สถานะสาย for now: the backend is filling the cabinets'
    // `sta` in — "-" until it has (user 2026-10-09).
    { header: 'กม.ที่', widthPct: 20, width: 12, value: (cabinet) => km(cabinet.sta) },
  ],
}

export const VMS_OFFLINE: OfflineKind<ProjectVMSItem> = {
  title: 'รายการ VMS ออฟไลน์แยกตามโครงการ',
  noun: 'ป้าย VMS',
  unit: 'ป้าย',
  empty: 'ไม่มี VMS ออฟไลน์',
  sheetName: 'VMS ออฟไลน์',
  columns: [
    { header: 'จุดติดตั้งป้าย VMS', widthPct: 74, width: 60, align: 'left', value: (sign) => sign.solution_name?.trim() || '-' },
    { header: 'กม.ที่', widthPct: 20, width: 12, value: (sign) => km(sign.sta) },
  ],
}

/** One project of an offline section: its table row (name, contract) and its
 *  offline devices, by road then chainage as the backend orders them. */
export interface OfflineSection<Item> {
  project: ProjectDeviceStatusRow
  items: Item[]
}

/** The exported projects, in the table's order, that have an offline device
 *  of this kind — a section covers the same projects as the table, scope and
 *  filter alike. */
export const offlineSections = <List extends { project_id: number }, Item extends { is_online: boolean }>(
  projects: ProjectDeviceStatusRow[],
  lists: List[],
  itemsOf: (list: List) => Item[] | null | undefined,
): OfflineSection<Item>[] => {
  const itemsByProject = new Map(lists.map((list) => [list.project_id, itemsOf(list) ?? []]))
  return projects.flatMap((project) => {
    const items = (itemsByProject.get(project.project_id) ?? []).filter((item) => !item.is_online)
    return items.length > 0 ? [{ project, items }] : []
  })
}

/** The band over each project's devices in the PDF: the name, then the
 *  contract and count on a line of their own — sharing the name's line, a
 *  long name pushed the wrap into them ("ออฟ|ไลน์", "2/26|/2567"). */
export const offlineBandLabel = <Item>(kind: OfflineKind<Item>, { project, items }: OfflineSection<Item>) =>
  `${project.project_name || '-'}\nเลขที่สัญญา ${project.contract_no?.trim() || '-'} · ออฟไลน์ ${items.length} ${kind.unit}`

export const offlineTitle = <Item>(kind: OfflineKind<Item>, sections: OfflineSection<Item>[]) => {
  const count = sections.reduce((sum, section) => sum + section.items.length, 0)
  return `${kind.title} (${sections.length} โครงการ, ${kind.noun} ${count} ${kind.unit})`
}

/** A table block starts a page of its own, so each section follows the
 *  previous one's last page. */
const offlinePdfBlock = <Item>(kind: OfflineKind<Item>, sections: OfflineSection<Item>[]): PdfReportBlock => ({
  type: 'table',
  title: offlineTitle(kind, sections),
  columns: [
    { header: 'ลำดับ', widthPct: 6 },
    ...kind.columns.map((column) => ({ header: column.header, widthPct: column.widthPct, align: column.align ?? ('center' as const) })),
  ],
  rows: sections.length > 0
    ? sections.flatMap((section): PdfTableRow[] => [
        { group: offlineBandLabel(kind, section) },
        ...section.items.map((item, index) => [index + 1, ...kind.columns.map((column) => column.value(item))]),
      ])
    : [{ group: kind.empty }],
})

type OfflineExcelRow<Item> = { project: ProjectDeviceStatusRow; item: Item }

/** Excel can't band a row across the sheet, so the project leads every row
 *  instead (the export convention for grouped tables), numbered straight through. */
const offlineSheetArgs = <Item>(
  kind: OfflineKind<Item>,
  sections: OfflineSection<Item>[],
  reportTitle: string,
  filterNote: string,
): ExportSheetArgs<OfflineExcelRow<Item>> => ({
  sheetName: kind.sheetName,
  title: `${reportTitle} · ${offlineTitle(kind, sections)}`,
  filterNote,
  columns: [
    { header: 'ลำดับ', width: 8, value: (_row, index) => index + 1 },
    { header: 'ชื่อโครงการ', width: 60, value: ({ project }) => project.project_name || '-' },
    { header: 'เลขที่สัญญา', width: 22, value: ({ project }) => project.contract_no?.trim() || '-' },
    ...kind.columns.map((column): ExportColumn<OfflineExcelRow<Item>> => ({
      header: column.header,
      width: column.width,
      value: ({ item }) => column.value(item),
    })),
  ],
  rows: sections.flatMap(({ project, items }) => items.map((item) => ({ project, item }))),
})

const offlineReport = (input: SummaryExportInput) => ({
  cameras: offlineSections(input.projects, input.cameraProjects, (list) => list.cameras),
  lighting: offlineSections(input.projects, input.lightingProjects, (list) => list.lighting),
  vms: offlineSections(input.projects, input.vmsProjects, (list) => list.vms),
})

export const exportSummaryPdf = async (input: SummaryExportInput) => {
  const { exportReportPdf } = await import('@/utils/export/pdf')
  const offline = offlineReport(input)
  await exportReportPdf({
    filenameBase: filenameBase(input),
    title: summaryReportTitle(input.companyName),
    subtitleNote: warrantyNote(input),
    orientation: 'landscape',
    blocks: [
      {
        type: 'table',
        title: RINGS_TITLE,
        columns: [
          { header: RING_HEADERS[0], widthPct: 32 },
          { header: RING_HEADERS[1], widthPct: 17, align: 'right' },
          { header: RING_HEADERS[2], widthPct: 17, align: 'right' },
          { header: RING_HEADERS[3], widthPct: 17, align: 'right' },
          { header: RING_HEADERS[4], widthPct: 17, align: 'right' },
        ],
        rows: input.rings.map(ringCells),
      },
      {
        type: 'table',
        title: PROJECTS_TITLE,
        // ลำดับ / ชื่อโครงการ / เลขที่สัญญา centred (the kit's default), counts right.
        columns: PROJECT_HEADERS.map((header, index) => ({
          header,
          widthPct: PROJECT_PDF_WIDTHS[index],
          align: index <= 2 ? ('center' as const) : ('right' as const),
        })),
        rows: input.projects.map(projectCells),
      },
      offlinePdfBlock(CCTV_OFFLINE, offline.cameras),
      offlinePdfBlock(LIGHTING_OFFLINE, offline.lighting),
      offlinePdfBlock(VMS_OFFLINE, offline.vms),
    ],
  })
}

export const exportSummaryExcel = async (input: SummaryExportInput) => {
  const { exportExcelSheets, excelSheet } = await import('@/utils/export/excel')
  const title = summaryReportTitle(input.companyName)
  const note = warrantyNote(input)
  const offline = offlineReport(input)
  exportExcelSheets({
    filenameBase: filenameBase(input),
    sheets: [
      excelSheet({
        sheetName: 'ภาพรวมอุปกรณ์',
        title: `${title} · ${RINGS_TITLE}`,
        filterNote: note,
        columns: RING_HEADERS.map((header, index) => ({
          header,
          width: index === 0 ? 22 : 14,
          value: (ring: SummaryExportInput['rings'][number]) => ringCells(ring)[index],
        })),
        rows: input.rings,
      }),
      excelSheet({
        sheetName: 'โครงการ',
        title: `${title} · ${PROJECTS_TITLE}`,
        filterNote: note,
        columns: PROJECT_HEADERS.map((header, index) => ({
          header,
          width: PROJECT_EXCEL_WIDTHS[index],
          value: (project: ProjectDeviceStatusRow, rowIndex: number) => projectCells(project, rowIndex)[index],
        })),
        rows: input.projects,
      }),
      excelSheet(offlineSheetArgs(CCTV_OFFLINE, offline.cameras, title, note)),
      excelSheet(offlineSheetArgs(LIGHTING_OFFLINE, offline.lighting, title, note)),
      excelSheet(offlineSheetArgs(VMS_OFFLINE, offline.vms, title, note)),
    ],
  })
}
