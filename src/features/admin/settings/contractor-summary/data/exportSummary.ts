import { DEVICE_BADGE } from '@/constants/cctv'
import type {
  DeviceTotals,
  ProjectCameraListCamera,
  ProjectCameraListItem,
  ProjectDeviceStatusRow,
} from '@/types/manage/device-status-api'
import type { ExportColumn } from '@/utils/export/excel'
import type { PdfTableRow } from '@/utils/export/pdf'
import type { SummarySystem } from './systems'
import { cameraBadges, offlinePercent } from './deviceStatus'

/** นำออกเอกสาร of the สรุปข้อมูลผู้รับจ้าง page: the two things it shows — the
 *  per-system rings and the project table, both under the page's warranty
 *  filter — then something the page doesn't show: those projects' offline
 *  cameras, project by project (user 2026-10-08). Built with the app's export
 *  kit; the columns mirror the screen, plus เลขที่สัญญา after the project name
 *  (user 2026-10-07). */
export interface SummaryExportInput {
  companyName: string
  shortName: string
  /** ทั้งหมด / ในค้ำ / หมดค้ำ — the filter the rings and the table were read under. */
  warrantyLabel: string
  rings: { system: SummarySystem; totals: DeviceTotals }[]
  projects: ProjectDeviceStatusRow[]
  /** GET /manage/project/device-status/cameras?is_online=false — every project
   *  of the contractor; only those in `projects` reach the report. */
  cameraProjects: ProjectCameraListItem[]
}

export const summaryReportTitle = (companyName: string) => `สรุปข้อมูลผู้รับจ้าง — ${companyName || '-'}`
export const RINGS_TITLE = 'ภาพรวมสถานะการทำงานของอุปกรณ์ทุกโครงการ'
export const PROJECTS_TITLE = 'ตารางสรุปโครงการและสถานะการทำงานของอุปกรณ์ทุกโครงการ'
export const OFFLINE_TITLE = 'รายการกล้องออฟไลน์แยกตามโครงการ'

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

/** One project of the offline section: its table row (name, contract) and
 *  its offline cameras, by road then chainage as the backend orders them. */
export interface OfflineCameraSection {
  project: ProjectDeviceStatusRow
  cameras: ProjectCameraListCamera[]
}

/** The exported projects, in the table's order, that have an offline camera —
 *  the section covers the same projects as the table, scope and filter alike. */
export const offlineCameraSections = (
  projects: ProjectDeviceStatusRow[],
  cameraProjects: ProjectCameraListItem[],
): OfflineCameraSection[] => {
  const camerasByProject = new Map(cameraProjects.map((item) => [item.project_id, item.cameras ?? []]))
  return projects.flatMap((project) => {
    const cameras = (camerasByProject.get(project.project_id) ?? []).filter((camera) => !camera.is_online)
    return cameras.length > 0 ? [{ project, cameras }] : []
  })
}

export const OFFLINE_HEADERS = ['ลำดับ', 'ชื่อกล้อง', 'กม.ที่', 'การทำงาน', 'IP Address']
// PDF widths (%), parallel to OFFLINE_HEADERS.
const OFFLINE_PDF_WIDTHS = [6, 42, 12, 24, 16]

/** A camera's row: the Live Stream card's tags as text ("CCTV, VMS"), and the
 *  bare chainage — the header already says กม.ที่. */
export const offlineCameraCells = (camera: ProjectCameraListCamera, index: number): (string | number)[] => [
  index + 1,
  camera.camera_name?.trim() || '-',
  (camera.sta ?? '').trim().replace(/^กม\.?\s*/, '') || '-',
  cameraBadges(camera.solution_types).map((key) => DEVICE_BADGE[key].label).join(', '),
  camera.ip_address?.trim() || '-',
]

/** The band over each project's cameras in the PDF: the name, then the
 *  contract and count on a line of their own — sharing the name's line, a
 *  long name pushed the wrap into them ("ออฟ|ไลน์", "2/26|/2567"). */
export const offlineBandLabel = ({ project, cameras }: OfflineCameraSection) =>
  `${project.project_name || '-'}\nเลขที่สัญญา ${project.contract_no?.trim() || '-'} · ออฟไลน์ ${cameras.length} ตัว`

export const offlineTitle = (sections: OfflineCameraSection[]) => {
  const cameraCount = sections.reduce((sum, section) => sum + section.cameras.length, 0)
  return `${OFFLINE_TITLE} (${sections.length} โครงการ, กล้อง ${cameraCount} ตัว)`
}

const offlinePdfRows = (sections: OfflineCameraSection[]): PdfTableRow[] =>
  sections.length > 0
    ? sections.flatMap((section): PdfTableRow[] => [{ group: offlineBandLabel(section) }, ...section.cameras.map(offlineCameraCells)])
    : [{ group: 'ไม่มีกล้องออฟไลน์' }]

type OfflineExcelRow = { project: ProjectDeviceStatusRow; camera: ProjectCameraListCamera }

// Excel can't band a row across the sheet, so the project leads every row
// instead (the export convention for grouped tables), numbered straight through.
const OFFLINE_EXCEL_COLUMNS: ExportColumn<OfflineExcelRow>[] = [
  { header: 'ลำดับ', width: 8, value: (_row, index) => index + 1 },
  { header: 'ชื่อโครงการ', width: 60, value: ({ project }) => project.project_name || '-' },
  { header: 'เลขที่สัญญา', width: 22, value: ({ project }) => project.contract_no?.trim() || '-' },
  ...OFFLINE_HEADERS.slice(1).map((header, index): ExportColumn<OfflineExcelRow> => ({
    header,
    width: [40, 12, 26, 18][index],
    value: ({ camera }) => offlineCameraCells(camera, 0)[index + 1],
  })),
]

export const exportSummaryPdf = async (input: SummaryExportInput) => {
  const { exportReportPdf } = await import('@/utils/export/pdf')
  const sections = offlineCameraSections(input.projects, input.cameraProjects)
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
      {
        // A table block starts a page of its own, so the section follows the
        // project table's last page.
        type: 'table',
        title: offlineTitle(sections),
        columns: OFFLINE_HEADERS.map((header, index) => ({
          header,
          widthPct: OFFLINE_PDF_WIDTHS[index],
          align: index === 1 ? ('left' as const) : ('center' as const),
        })),
        rows: offlinePdfRows(sections),
      },
    ],
  })
}

export const exportSummaryExcel = async (input: SummaryExportInput) => {
  const { exportExcelSheets, excelSheet } = await import('@/utils/export/excel')
  const title = summaryReportTitle(input.companyName)
  const sections = offlineCameraSections(input.projects, input.cameraProjects)
  exportExcelSheets({
    filenameBase: filenameBase(input),
    sheets: [
      excelSheet({
        sheetName: 'ภาพรวมอุปกรณ์',
        title: `${title} · ${RINGS_TITLE}`,
        filterNote: warrantyNote(input),
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
        filterNote: warrantyNote(input),
        columns: PROJECT_HEADERS.map((header, index) => ({
          header,
          width: PROJECT_EXCEL_WIDTHS[index],
          value: (project: ProjectDeviceStatusRow, rowIndex: number) => projectCells(project, rowIndex)[index],
        })),
        rows: input.projects,
      }),
      excelSheet({
        sheetName: 'กล้องออฟไลน์',
        title: `${title} · ${offlineTitle(sections)}`,
        filterNote: warrantyNote(input),
        columns: OFFLINE_EXCEL_COLUMNS,
        rows: sections.flatMap(({ project, cameras }) => cameras.map((camera) => ({ project, camera }))),
      }),
    ],
  })
}
