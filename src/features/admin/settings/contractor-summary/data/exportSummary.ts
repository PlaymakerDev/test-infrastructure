import type { DeviceTotals, ProjectDeviceStatusRow } from '@/types/manage/device-status-api'
import type { SummarySystem } from './systems'
import { offlinePercent } from './deviceStatus'

/** นำออกเอกสาร of the สรุปข้อมูลผู้รับจ้าง page: the two things it shows — the
 *  per-system rings and the project table (under the page's warranty filter).
 *  Built with the app's export kit; the columns mirror the screen. */
export interface SummaryExportInput {
  companyName: string
  shortName: string
  /** ทั้งหมด / ในค้ำ / หมดค้ำ — the table's filter; the rings are never filtered. */
  warrantyLabel: string
  rings: { system: SummarySystem; totals: DeviceTotals }[]
  projects: ProjectDeviceStatusRow[]
}

export const summaryReportTitle = (companyName: string) => `สรุปข้อมูลผู้รับจ้าง — ${companyName || '-'}`
export const RINGS_TITLE = 'ภาพรวมสถานะการทำงานของอุปกรณ์ทุกโครงการ'
export const PROJECTS_TITLE = 'ตารางสรุปโครงการและสถานะการทำงานของอุปกรณ์ทุกโครงการ'

const filenameBase = (input: SummaryExportInput) => `สรุปข้อมูลผู้รับจ้าง_${input.shortName || 'ผู้รับจ้าง'}`
const warrantyNote = (input: SummaryExportInput) => `ตารางโครงการ — สถานะค้ำประกัน: ${input.warrantyLabel}`

const ringCells = ({ system, totals }: SummaryExportInput['rings'][number]): (string | number)[] => [
  system.label,
  totals.total,
  totals.online,
  totals.offline,
  `${offlinePercent(totals)}%`,
]

const projectCells = (project: ProjectDeviceStatusRow, index: number): (string | number)[] => [
  index + 1,
  project.project_name || '-',
  project.cameras?.online ?? 0,
  project.cameras?.offline ?? 0,
  project.vms?.online ?? 0,
  project.vms?.offline ?? 0,
  project.lighting?.online ?? 0,
  project.lighting?.offline ?? 0,
]

const RING_HEADERS = ['ระบบ', 'ทั้งหมด', 'ออนไลน์', 'ออฟไลน์', 'ออฟไลน์ (%)']
const PROJECT_HEADERS = [
  'ลำดับ',
  'ชื่อโครงการ',
  'CCTV ออนไลน์',
  'CCTV ออฟไลน์',
  'VMS ออนไลน์',
  'VMS ออฟไลน์',
  'Street Light ออนไลน์',
  'Street Light ออฟไลน์',
]

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
        columns: [
          { header: PROJECT_HEADERS[0], widthPct: 6, align: 'center' },
          { header: PROJECT_HEADERS[1], widthPct: 40 },
          { header: PROJECT_HEADERS[2], widthPct: 9, align: 'right' },
          { header: PROJECT_HEADERS[3], widthPct: 9, align: 'right' },
          { header: PROJECT_HEADERS[4], widthPct: 9, align: 'right' },
          { header: PROJECT_HEADERS[5], widthPct: 9, align: 'right' },
          { header: PROJECT_HEADERS[6], widthPct: 9, align: 'right' },
          { header: PROJECT_HEADERS[7], widthPct: 9, align: 'right' },
        ],
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
          width: index === 0 ? 8 : index === 1 ? 70 : 16,
          value: (project: ProjectDeviceStatusRow, rowIndex: number) => projectCells(project, rowIndex)[index],
        })),
        rows: input.projects,
      }),
    ],
  })
}
