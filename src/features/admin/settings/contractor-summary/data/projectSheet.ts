import type { ExcelCellStyle, ExcelLayoutCell, ExcelLayoutRow, ExcelLayoutSheet } from '@/utils/export/excel'
import type { PdfReportBlock, PdfTableRow } from '@/utils/export/pdf'

/** The โครงการ sheet of นำออกเอกสาร (user's sample report, 2026-10-27): one
 *  sheet, project after project — its name, contract and Solution boxes, then
 *  a section per system it has, each system's install points with their
 *  devices. Every project collapses under its own name row (+/− on the left,
 *  as in the user's grouped-by-road sample).
 *
 *  Built from this layout model rather than from an API response: the backend
 *  endpoint behind the sheet is still to come, and only the step that turns
 *  its response into these projects will depend on it. */

/** The Solution boxes, in the sample's order — columns C to M. */
export const PROJECT_SOLUTIONS = [
  'CCTV',
  'Traffic Volume',
  'Incident Detection',
  'Traffic Signal',
  'Crosswalk',
  'Street Light',
  'VMS',
  'Bridge Lighting',
  'Tunnel',
  'WIM',
  'LPR',
] as const

export type ProjectSolution = (typeof PROJECT_SOLUTIONS)[number]

/** The columns after ลำดับ: name, กม.ที่, การทำงาน, then one or two more —
 *  a single last one spans L–M. */
export type ProjectSheetColumns = readonly [string, string, string, string] | readonly [string, string, string, string, string]

export const CAMERA_COLUMNS: ProjectSheetColumns = ['ชื่อกล้อง', 'กม.ที่', 'การทำงาน', 'สถานะ', 'IP Address']
export const STREET_LIGHT_COLUMNS: ProjectSheetColumns = ['ชื่อจุดติดตั้ง', 'กม.ที่', 'การทำงาน', 'การเชื่อมต่อ', 'สถานะสาย']
// Not in the sample — the Street Light layout without its fifth column: a
// bridge installation or a tunnel device has none to show.
export const BRIDGE_LIGHTING_COLUMNS: ProjectSheetColumns = ['ชื่อจุดติดตั้ง', 'กม.ที่', 'การทำงาน', 'การเชื่อมต่อ']
export const TUNNEL_COLUMNS: ProjectSheetColumns = ['ชื่ออุปกรณ์', 'กม.ที่', 'การทำงาน', 'การเชื่อมต่อ']

/** A device's สถานะ / การเชื่อมต่อ, worded as the sample has it. */
export const connectionLabel = (isOnline: boolean | null | undefined) => (isOnline ? 'Connect' : 'Disconnect')

export interface ProjectSheetSection {
  /** The system listed — its name heads the section. */
  solution: ProjectSolution
  columns: ProjectSheetColumns
  /** In order. A point without a label lists its devices straight under the
   *  header (the sample's Street Light). */
  points: { label?: string; rows: ProjectSheetColumns[] }[]
}

export interface ProjectSheetProject {
  name: string
  contractNo: string
  /** The boxes ticked. */
  solutions: ProjectSolution[]
  /** In PROJECT_SOLUTIONS order, as the sample lists them. */
  sections: ProjectSheetSection[]
}

// The sample's fills: its theme's text-2 colour tinted 90% (the project row)
// and 75% (a section's name).
const PROJECT_FILL = 'DCEAF7'
const SECTION_FILL = 'A6CAEC'

// A–M: ลำดับ, the name over B–H, กม.ที่, การทำงาน over J–K, the last two —
// and on the Solution row, a box in each of C–M.
const WIDTHS = [11, 11, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10]
const LAST_COL = WIDTHS.length - 1

const cell = (col: number, value: string | number, style?: ExcelCellStyle, span?: number): ExcelLayoutCell => ({
  col,
  value,
  ...(span ? { span } : {}),
  ...(style ? { style } : {}),
})

/** "☑ CCTV", or the box over the name on a line of its own when the name
 *  outgrows the column ("☐ \nTraffic Volume"), as the sample writes them. */
export const solutionBox = (solution: ProjectSolution, ticked: boolean) =>
  `${ticked ? '☑' : '☐'}${solution.length > 6 ? ' \n' : ' '}${solution}`

/** ลำดับ, then the columns over A–M: the name merged across B–H, การทำงาน
 *  across J–K, and the last two in L and M — or one across both. */
const columnCells = (first: string | number, values: ProjectSheetColumns, firstStyle: ExcelCellStyle, header: boolean): ExcelLayoutCell[] => {
  const centred: ExcelCellStyle = { align: 'center', vertical: 'center', border: true }
  const lead = [
    cell(0, first, firstStyle),
    cell(1, values[0], header ? { align: 'center', border: true } : { align: 'left', border: true }, 7),
    cell(8, values[1], { ...centred, wrap: header }),
    cell(9, values[2], { align: 'center', wrap: true, border: true }, 2),
  ]
  return values.length === 5
    ? [...lead, cell(11, values[3], { ...centred, wrap: header }), cell(12, values[4], centred)]
    : [...lead, cell(11, values[3], { ...centred, wrap: header }, 2)]
}

export function projectDevicesSheet({
  title,
  filterNote,
  projects,
}: {
  title: string
  filterNote?: string
  projects: ProjectSheetProject[]
}): ExcelLayoutSheet {
  const rows: ExcelLayoutRow[] = []
  // Everything below a project's name row folds into it.
  const detail = (cells: ExcelLayoutCell[], height?: number) => rows.push({ cells, level: 1, ...(height ? { height } : {}) })

  projects.forEach((project, index) => {
    rows.push({
      cells: [
        cell(0, `โครงการที่ ${index + 1} :`, { fill: PROJECT_FILL }),
        cell(1, project.name || '-', { fill: PROJECT_FILL, align: 'left' }, LAST_COL),
      ],
    })
    detail([
      cell(1, 'เลขที่สัญญา :', { vertical: 'center' }),
      cell(2, project.contractNo || '-', { align: 'left', vertical: 'center', wrap: true }, LAST_COL - 1),
    ])
    detail(
      [
        cell(1, 'Solution :', { vertical: 'center' }),
        // A font with the ballot boxes — the sample's Wingdings 2 shows them as blanks.
        ...PROJECT_SOLUTIONS.map((solution, i) =>
          cell(2 + i, solutionBox(solution, project.solutions.includes(solution)), { font: 'Segoe UI Symbol', size: 10, vertical: 'center', wrap: true }),
        ),
      ],
      42,
    )
    detail([])
    for (const section of project.sections) {
      detail(columnCells(section.solution, section.columns, { fill: SECTION_FILL, align: 'center', vertical: 'center', wrap: true, border: true }, true))
      for (const point of section.points) {
        if (point.label) detail([cell(0, `จุดติดตั้ง : ${point.label}`, { align: 'left', vertical: 'center', border: true }, WIDTHS.length)])
        // Numbered from 1 at every install point (user 2026-10-28).
        point.rows.forEach((row, i) => detail(columnCells(i + 1, row, { align: 'center', vertical: 'center', border: true }, false)))
      }
      detail([])
    }
  })

  return { sheetName: 'โครงการ', title, filterNote, widths: WIDTHS, rows }
}

export const PROJECT_DEVICES_TITLE = 'รายการอุปกรณ์ทั้งหมดแยกตามโครงการ'

const DEVICE_PDF_COLUMNS = [
  { header: 'ลำดับ', widthPct: 6 },
  { header: CAMERA_COLUMNS[0], widthPct: 44, align: 'left' as const },
  { header: CAMERA_COLUMNS[1], widthPct: 10 },
  { header: CAMERA_COLUMNS[2], widthPct: 16 },
  { header: CAMERA_COLUMNS[3], widthPct: 11 },
  { header: CAMERA_COLUMNS[4], widthPct: 13 },
]

const sameColumns = (a: ProjectSheetColumns, b: ProjectSheetColumns) => a.join('\n') === b.join('\n')

/** About one PDF table row (9pt text, 4pt padding), in points. */
const PDF_ROW_PT = 20
/** A section with columns of its own up to this tall (~22 rows) moves whole
 *  to the next page rather than split: the header reprinted there is the
 *  camera one, which would mislabel its rows. A taller one splits. */
const PDF_KEEP_TOGETHER_PT = 440

/** One project's rows of the PDF table: its band (name, then contract and its
 *  Solutions — the report font has no ballot boxes, so the ticked ones are
 *  named), a lighter band per section and install point, then the devices
 *  numbered from 1 at each install point. The page header is the camera one;
 *  a section repeats its own header under its first band whenever another is
 *  in view (`inView`) — Street Light's, and a camera section after it gets the
 *  camera header back. Returns the header in view after the project as well. */
const projectPdfRows = (project: ProjectSheetProject, index: number, inView: ProjectSheetColumns) => {
  const rows: PdfTableRow[] = [
    {
      group: `โครงการที่ ${index + 1} : ${project.name || '-'}\nเลขที่สัญญา : ${project.contractNo || '-'} · Solution : ${project.solutions.join(', ') || '-'}`,
    },
  ]
  for (const section of project.sections) {
    // What follows the section's first band: its header, its devices and the
    // other points' bands.
    const after = PDF_ROW_PT * (1 + section.points.reduce((sum, point) => sum + point.rows.length, 0) + section.points.length - 1)
    const keepTogether = !sameColumns(section.columns, CAMERA_COLUMNS) && after <= PDF_KEEP_TOGETHER_PT
    section.points.forEach((point, pointIndex) => {
      rows.push({
        group: point.label ? `${section.solution} · จุดติดตั้ง : ${point.label}` : section.solution,
        tone: 'soft',
        ...(pointIndex === 0 && keepTogether ? { keepAhead: after } : {}),
      })
      if (pointIndex === 0 && !sameColumns(section.columns, inView)) {
        rows.push({ cells: ['ลำดับ', ...section.columns], emphasis: true })
        inView = section.columns
      }
      point.rows.forEach((row, i) => rows.push([i + 1, ...row]))
    })
  }
  return { rows, inView }
}

/** About this many rows per table block. A block is one react-pdf Page, and
 *  every page break inside it lays the whole rest of the block out again — the
 *  cost grows with the square of its rows: 4,000 devices in one block took six
 *  minutes. Cut between projects, each block opens a page of its own. */
export const PDF_ROWS_PER_BLOCK = 250

/** The projects' devices in the PDF: one table, cut into blocks of about
 *  PDF_ROWS_PER_BLOCK rows at project boundaries (a bigger project stays whole),
 *  the title on the first. */
export function projectDevicesPdfBlocks(projects: ProjectSheetProject[]): PdfReportBlock[] {
  const title = `${PROJECT_DEVICES_TITLE} (${projects.length} โครงการ)`
  const chunks: PdfTableRow[][] = []
  let chunk: PdfTableRow[] = []
  let inView = CAMERA_COLUMNS
  projects.forEach((project, index) => {
    let built = projectPdfRows(project, index, inView)
    if (chunk.length > 0 && chunk.length + built.rows.length > PDF_ROWS_PER_BLOCK) {
      chunks.push(chunk)
      chunk = []
      // A new block opens on a page of its own, under the camera header.
      built = projectPdfRows(project, index, CAMERA_COLUMNS)
    }
    chunk.push(...built.rows)
    inView = built.inView
  })
  if (chunk.length > 0) chunks.push(chunk)
  if (chunks.length === 0) return [{ type: 'table', title, columns: DEVICE_PDF_COLUMNS, rows: [{ group: 'ไม่มีโครงการ' }] }]
  return chunks.map((rows, i) => ({ type: 'table', ...(i === 0 ? { title } : {}), columns: DEVICE_PDF_COLUMNS, rows }))
}
