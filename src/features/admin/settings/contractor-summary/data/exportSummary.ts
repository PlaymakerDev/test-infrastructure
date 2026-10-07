import type { DeviceTotals, ProjectDeviceStatusRow } from '@/types/manage/device-status-api'
import type { SummarySystem } from './systems'
import { offlinePercent } from './deviceStatus'

/** นำออกเอกสาร of the สรุปข้อมูลผู้รับจ้าง page: the two things it shows — the
 *  per-system rings and the project table, both under the page's warranty
 *  filter. Built with the app's export kit; the columns mirror the screen,
 *  plus เลขที่สัญญา after the project name (user 2026-10-07). */
export interface SummaryExportInput {
  companyName: string
  shortName: string
  /** ทั้งหมด / ในค้ำ / หมดค้ำ — the filter the rings and the table were read under. */
  warrantyLabel: string
  rings: { system: SummarySystem; totals: DeviceTotals }[]
  projects: ProjectDeviceStatusRow[]
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

export const exportSummaryPdf = async (input: SummaryExportInput) => {
  const { exportReportPdf } = await import('@/utils/export/pdf')
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
    ],
  })
}

export const exportSummaryExcel = async (input: SummaryExportInput) => {
  const { exportExcelSheets, excelSheet } = await import('@/utils/export/excel')
  const title = summaryReportTitle(input.companyName)
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
    ],
  })
}
