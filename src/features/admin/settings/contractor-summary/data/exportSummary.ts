import { DEVICE_BADGE } from '@/constants/cctv'
import type {
  CameraSolution,
  DeviceTotals,
  ProjectDeviceSolutionsRow,
  ProjectDeviceSummaryRow,
  SolutionCamera,
  SystemSolution,
} from '@/types/manage/device-status-api'
import type { ExportColumn, ExportColumnNode } from '@/utils/export/excel'
import type { PdfReportBlock, PdfRun, PdfTableColumn } from '@/utils/export/pdf'
import type { SummarySystem } from './systems'
import { cameraBadges, offlinePercent } from './deviceStatus'
import {
  BRIDGE_LIGHTING_COLUMNS,
  CAMERA_COLUMNS,
  PROJECT_DEVICES_TITLE,
  PROJECT_SOLUTIONS,
  STREET_LIGHT_COLUMNS,
  TUNNEL_COLUMNS,
  connectionLabel,
  projectDevicesPdfBlocks,
  projectDevicesSheet,
  type ProjectSheetColumns,
  type ProjectSheetProject,
  type ProjectSheetSection,
  type ProjectSolution,
} from './projectSheet'

/** นำออกเอกสาร of the สรุปข้อมูลผู้รับจ้าง page (the user's sample report,
 *  2026-10-27): the rings; every project with each system's online / offline
 *  counts (สรุป); then every device of those projects, project by project
 *  (โครงการ) — all under the page's warranty filter. Built with the app's
 *  export kit. */
export interface SummaryExportInput {
  companyName: string
  shortName: string
  /** ทั้งหมด / ในค้ำ / หมดค้ำ — the filter the rings and the tables were read under. */
  warrantyLabel: string
  rings: { system: SummarySystem; totals: DeviceTotals }[]
  /** GET /manage/project/device-status/summary — the projects of both tables, in order. */
  summary: ProjectDeviceSummaryRow[]
  /** GET /manage/project/device-status/solutions — each project's devices by
   *  system: install points and controllers with their cameras and state. */
  solutions: ProjectDeviceSolutionsRow[]
  /** GET /manage/project — the Solutions each project is set up with. */
  projectSolutions: { id: number; solution_group?: { id: number; name: string }[] }[]
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

const RING_HEADERS = ['ระบบ', 'ทั้งหมด', 'ออนไลน์', 'ออฟไลน์', 'ออฟไลน์ (%)']

// ── The สรุป table: every system per project ─────────────────────────────────

/** One counted part of a system, and where a summary row keeps its totals. */
interface SummaryPart {
  header: string
  totals: (row: ProjectDeviceSummaryRow) => DeviceTotals | undefined
}

interface SummaryGroup {
  header: string
  parts: SummaryPart[]
}

/** The cameras by what they serve — the backend counts each camera once,
 *  under the first system that uses it (CCTV = used by none of the others). */
export const SUMMARY_CAMERA_GROUP: SummaryGroup = {
  header: 'CCTV (กล้อง)',
  parts: [
    { header: 'CCTV', totals: (row) => row.cctv },
    { header: 'Traffic Volume', totals: (row) => row.counting },
    { header: 'Incident Detection', totals: (row) => row.analytic },
    { header: 'LPR', totals: (row) => row.lpr },
  ],
}

/** The systems with devices of their own (System), and the cameras linked to
 *  those that have them. */
export const SUMMARY_SYSTEM_GROUPS: SummaryGroup[] = [
  {
    header: 'Traffic Signal',
    parts: [
      { header: 'System', totals: (row) => row.traffic?.system },
      { header: 'CCTV', totals: (row) => row.traffic?.camera },
    ],
  },
  {
    header: 'Crosswalk',
    parts: [
      { header: 'System', totals: (row) => row.crosswalk?.system },
      { header: 'CCTV', totals: (row) => row.crosswalk?.camera },
    ],
  },
  { header: 'Street Light', parts: [{ header: 'System', totals: (row) => row.lighting }] },
  {
    header: 'VMS',
    parts: [
      { header: 'System', totals: (row) => row.vms?.system },
      { header: 'CCTV', totals: (row) => row.vms?.camera },
    ],
  },
  { header: 'Bridge Lighting', parts: [{ header: 'System', totals: (row) => row.bridge_lighting }] },
  { header: 'Tunnel', parts: [{ header: 'Sensor', totals: (row) => row.tunnel }] },
]

/** The sample report's header colours: ออนไลน์ blue, ออฟไลน์ red. */
const ONLINE_COLOR = '4E95D9'
const OFFLINE_COLOR = 'FF0000'

const STATUS_COUNTS = [
  { header: 'ออนไลน์', color: ONLINE_COLOR, count: (totals: DeviceTotals | undefined) => totals?.online ?? 0 },
  { header: 'ออฟไลน์', color: OFFLINE_COLOR, count: (totals: DeviceTotals | undefined) => totals?.offline ?? 0 },
]

const summaryLeadCells = (row: ProjectDeviceSummaryRow, index: number): (string | number)[] => [
  index + 1,
  row.project_name || '-',
  row.contract_no?.trim() || '-',
]

/** สรุป on one sheet, as the sample lays it out: ลำดับ / ชื่อโครงการ /
 *  เลขที่สัญญา, then system → part → ออนไลน์ / ออฟไลน์ three header rows deep. */
export const SUMMARY_EXCEL_COLUMNS: ExportColumnNode<ProjectDeviceSummaryRow>[] = [
  { header: 'ลำดับ', width: 8, value: (_row, index) => index + 1 },
  { header: 'ชื่อโครงการ', width: 46, wrap: true, value: (row) => row.project_name || '-' },
  { header: 'เลขที่สัญญา', width: 20, wrap: true, value: (row) => row.contract_no?.trim() || '-' },
  ...[SUMMARY_CAMERA_GROUP, ...SUMMARY_SYSTEM_GROUPS].map((group) => ({
    header: group.header,
    children: group.parts.map((part) => ({
      header: part.header,
      children: STATUS_COUNTS.map((status): ExportColumn<ProjectDeviceSummaryRow> => ({
        header: status.header,
        width: 9,
        align: 'center',
        headerColor: status.color,
        value: (row) => status.count(part.totals(row)),
      })),
    })),
  })),
]

/** "1 / 0": a part's online count in blue, its offline count in red. */
const countRuns = (totals: DeviceTotals | undefined): PdfRun[] => [
  { text: String(totals?.online ?? 0), color: `#${ONLINE_COLOR}` },
  { text: ' / ' },
  { text: String(totals?.offline ?? 0), color: `#${OFFLINE_COLOR}` },
]

const ON_OFF_HEADER: PdfRun[] = [{ text: 'On', color: `#${ONLINE_COLOR}` }, { text: ' / ' }, { text: 'Off', color: `#${OFFLINE_COLOR}` }]

/** สรุป in the PDF (user 2026-10-28): one table under the sample's three
 *  header rows, but one column a part — "On / Off", its cell "1 / 0" — so
 *  every system fits one A4 row and a contractor's projects are listed once,
 *  not in two tables. 3 + 21.4 + 8 + 13 × 5.2 = 100; 5.2% at 7pt holds the
 *  widest header word, "Detection", whole, and a count up to "999 / 999". */
export const summaryPdfBlocks = (rows: ProjectDeviceSummaryRow[]): PdfReportBlock[] => {
  const groups = [SUMMARY_CAMERA_GROUP, ...SUMMARY_SYSTEM_GROUPS]
  const parts = groups.flatMap((group) => group.parts)
  return [{
    type: 'table',
    title: PROJECTS_TITLE,
    fontSize: 7,
    cellPadding: 1.5,
    columns: [
      { header: 'ลำดับ', widthPct: 3 },
      { header: 'ชื่อโครงการ', widthPct: 21.4 },
      { header: 'เลขที่สัญญา', widthPct: 8 },
      ...groups.map((group): PdfTableColumn => ({
        header: group.header,
        children: group.parts.map((part) => ({
          header: part.header,
          children: [{ header: 'On / Off', headerRuns: ON_OFF_HEADER, widthPct: 5.2 }],
        })),
      })),
    ],
    rows: rows.map((row, index) => [...summaryLeadCells(row, index), ...parts.map((part) => countRuns(part.totals(row)))]),
  }]
}

/** หน้าปัจจุบัน: the summary rows of the projects on the page, in its order. */
export const summaryForProjects = (summary: ProjectDeviceSummaryRow[], projects: { project_id: number }[]): ProjectDeviceSummaryRow[] => {
  const byId = new Map(summary.map((row) => [row.project_id, row]))
  return projects.flatMap((project) => {
    const row = byId.get(project.project_id)
    return row ? [row] : []
  })
}

// ── The โครงการ sheet: every device, project by project ─────────────────────

/** solution_type_id → its Solution box. */
const SOLUTION_OF_TYPE: Record<number, ProjectSolution> = {
  1: 'CCTV',
  2: 'Traffic Volume',
  3: 'Incident Detection',
  4: 'Traffic Signal',
  5: 'Crosswalk',
  6: 'Street Light',
  7: 'VMS',
  8: 'Tunnel',
  9: 'WIM',
  10: 'Bridge Lighting',
  11: 'LPR',
}

/** A camera's solution_group entry — an upper-cased tbl_solution_type name —
 *  to that type's id. */
const TYPE_OF_GROUP: Record<string, number> = {
  CCTV: 1,
  COUNTING: 2,
  ANALYTIC: 3,
  TRAFFIC: 4,
  CROSSWALK: 5,
  LIGHTING: 6,
  VMS: 7,
  TUNNEL: 8,
  WIM: 9,
  BRIDGELIGHTING: 10,
  LPR: 11,
}

/** The bare chainage — the header already says กม.ที่. */
const km = (sta: string | null | undefined) => (sta ?? '').trim().replace(/^กม\.?\s*/, '') || '-'

/** The Live Stream card's tags as text ("CCTV, Traffic"), from every system
 *  the camera serves. */
const cameraTags = (group: string[] | null | undefined) =>
  cameraBadges((group ?? []).flatMap((name) => (TYPE_OF_GROUP[name] ? [{ id: TYPE_OF_GROUP[name] }] : [])))
    .map((key) => DEVICE_BADGE[key].label)
    .join(', ')

const cameraRow = (camera: SolutionCamera): ProjectSheetColumns => [
  camera.camera_name?.trim() || '-',
  km(camera.sta),
  cameraTags(camera.solution_group),
  connectionLabel(camera.is_online),
  camera.ip_address?.trim() || '-',
]

/** A system's install points (or controllers) with their cameras — nothing
 *  when it has none. `stateOf`: a controller's own state, which the sheet
 *  writes after its install point. */
const cameraSection = <Item extends CameraSolution>(
  solution: ProjectSolution,
  list: Item[] | undefined,
  stateOf?: (item: Item) => boolean,
): ProjectSheetSection[] =>
  list?.length
    ? [{
        solution,
        columns: CAMERA_COLUMNS,
        points: list.map((item) => ({
          label: item.solution_name,
          ...(stateOf ? { online: stateOf(item) } : {}),
          rows: (item.cameras ?? []).map(cameraRow),
        })),
      }]
    : []

const controllerState = (controller: SystemSolution) => controller.is_online

/** WIM has no list of its own in /solutions: its cameras, by the CCTV install
 *  point each stands at. */
const wimPoints = (cctv: CameraSolution[] | undefined): CameraSolution[] =>
  (cctv ?? []).flatMap((point) => {
    const cameras = (point.cameras ?? []).filter((camera) => camera.solution_group?.includes('WIM'))
    return cameras.length ? [{ ...point, cameras }] : []
  })

/** A project's devices as sections, in the Solution boxes' order — its row of
 *  /device-status/solutions: every camera of its CCTV install points, then
 *  each system's install points and controllers with their cameras (VMS signs
 *  among them), then the street-light cabinets, bridge lighting and tunnel
 *  devices. A camera is listed under every system it serves, as the sample
 *  does (user 2026-10-27). */
const projectSections = (solutions: ProjectDeviceSolutionsRow | undefined): ProjectSheetSection[] => {
  const sections: ProjectSheetSection[] = [
    ...cameraSection('CCTV', solutions?.cctv),
    ...cameraSection('Traffic Volume', solutions?.counting),
    ...cameraSection('Incident Detection', solutions?.analytic),
    ...cameraSection('Traffic Signal', solutions?.traffic, controllerState),
    ...cameraSection('Crosswalk', solutions?.crosswalk, controllerState),
    ...cameraSection('LPR', solutions?.lpr),
    ...cameraSection('WIM', wimPoints(solutions?.cctv)),
    ...(solutions?.lighting?.length
      ? [{
          solution: 'Street Light' as const,
          columns: STREET_LIGHT_COLUMNS,
          // The cabinets, as the sample lists them (not their lamps); สถานะสาย
          // is Connect while the wire is whole.
          points: [{
            rows: solutions.lighting.map((cabinet): ProjectSheetColumns => [
              cabinet.solution_name?.trim() || '-',
              km(cabinet.sta),
              'Street Light',
              connectionLabel(cabinet.is_online),
              connectionLabel(!cabinet.has_broken_wire),
            ]),
          }],
        }]
      : []),
    // Each sign with its state and cameras, as Traffic Signal lists its
    // controllers (user 2026-10-28) — a sign without a camera too.
    ...cameraSection('VMS', solutions?.vms, controllerState),
    ...(solutions?.bridge_lighting?.length
      ? [{
          solution: 'Bridge Lighting' as const,
          columns: BRIDGE_LIGHTING_COLUMNS,
          points: [{ rows: solutions.bridge_lighting.map((bridge): ProjectSheetColumns => [bridge.solution_name?.trim() || '-', '-', 'Bridge Lighting', connectionLabel(bridge.is_online)]) }],
        }]
      : []),
    ...(solutions?.tunnel?.length
      ? [{
          solution: 'Tunnel' as const,
          columns: TUNNEL_COLUMNS,
          points: solutions.tunnel.map((tunnel) => ({
            label: (tunnel.devices ?? []).length ? tunnel.solution_name : `${tunnel.solution_name} (ไม่มีข้อมูลอุปกรณ์)`,
            rows: (tunnel.devices ?? []).map((device): ProjectSheetColumns => [device.device_name?.trim() || '-', '-', 'Tunnel', connectionLabel(device.is_online)]),
          })),
        }]
      : []),
  ]
  return sections.sort((a, b) => PROJECT_SOLUTIONS.indexOf(a.solution) - PROJECT_SOLUTIONS.indexOf(b.solution))
}

/** The summary's projects (the สรุป sheet's, in its order) with every device
 *  they hold. A box is ticked for a Solution the project is set up with, or
 *  one it has devices of. */
export const projectSheetProjects = (input: SummaryExportInput): ProjectSheetProject[] => {
  const solutionsOf = new Map(input.solutions.map((row) => [row.project_id, row]))
  const typesOf = new Map(input.projectSolutions.map((project) => [project.id, (project.solution_group ?? []).map((group) => group.id)]))
  return input.summary.map((row) => {
    const sections = projectSections(solutionsOf.get(row.project_id))
    const ticked = new Set<ProjectSolution>([
      ...(typesOf.get(row.project_id) ?? []).flatMap((id) => (SOLUTION_OF_TYPE[id] ? [SOLUTION_OF_TYPE[id]] : [])),
      ...sections.map((section) => section.solution),
    ])
    return {
      name: row.project_name || '-',
      contractNo: row.contract_no?.trim() || '-',
      solutions: PROJECT_SOLUTIONS.filter((solution) => ticked.has(solution)),
      sections,
    }
  })
}

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
      ...summaryPdfBlocks(input.summary),
      ...projectDevicesPdfBlocks(projectSheetProjects(input)),
    ],
  })
}

export const exportSummaryExcel = async (input: SummaryExportInput) => {
  const { exportExcelSheets, excelSheet } = await import('@/utils/export/excel')
  const title = summaryReportTitle(input.companyName)
  const note = warrantyNote(input)
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
        sheetName: 'สรุป',
        title: `${title} · ${PROJECTS_TITLE}`,
        filterNote: note,
        columns: SUMMARY_EXCEL_COLUMNS,
        rows: input.summary,
      }),
      projectDevicesSheet({ title: `${title} · ${PROJECT_DEVICES_TITLE}`, filterNote: note, projects: projectSheetProjects(input) }),
    ],
  })
}
