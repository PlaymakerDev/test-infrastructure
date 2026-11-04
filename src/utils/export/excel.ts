// xlsx-js-style = drop-in SheetJS fork that can WRITE cell styles (the
// community `xlsx` build silently drops font/alignment/fill), needed for the
// PDF-style report header rows below. Only this file touches the lib.
import * as XLSX from 'xlsx-js-style'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'

dayjs.extend(buddhistEra)

/** One exported column: Thai header + how to pull the cell from a row.
 *  `width` is the Excel column width in characters (xlsx `wch`). */
export interface ExportColumn<Row> {
  header: string
  width?: number
  value: (row: Row, index: number) => string | number
  /** Header text colour, 6-digit hex without '#' (e.g. 'FF0000'). */
  headerColor?: string
  /** The data cells' horizontal alignment — Excel's own when absent (text
   *  left, numbers right). */
  align?: 'left' | 'center' | 'right'
  /** Wrap long text inside the cell instead of letting it run over the next. */
  wrap?: boolean
}

/** A header over the columns under it. Nest groups for a header several rows
 *  deep (a system → its parts → ออนไลน์ / ออฟไลน์); a column beside a group
 *  then reaches down through every header row, merged. */
export interface ExportColumnGroup<Row> {
  header: string
  children: ExportColumnNode<Row>[]
}

export type ExportColumnNode<Row> = ExportColumn<Row> | ExportColumnGroup<Row>

const isColumnGroup = <Row>(node: ExportColumnNode<Row>): node is ExportColumnGroup<Row> => 'children' in node

/** The data columns of a column tree, left to right. */
const leafColumns = <Row>(nodes: ExportColumnNode<Row>[]): ExportColumn<Row>[] =>
  nodes.flatMap((node) => (isColumnGroup(node) ? leafColumns(node.children) : [node]))

const headerDepth = <Row>(nodes: ExportColumnNode<Row>[]): number =>
  nodes.reduce((depth, node) => Math.max(depth, isColumnGroup(node) ? 1 + headerDepth(node.children) : 1), 0)

/** One cell of a multi-row header, in header-relative rows and columns. */
export interface ErasedHeaderCell {
  header: string
  r: number
  c: number
  rowSpan: number
  colSpan: number
  color?: string
}

/** A column tree laid out as header rows: a group spans its columns on its
 *  own row, a column reaches from its row down to the last one. */
function headerGrid<Row>(nodes: ExportColumnNode<Row>[]): { rows: number; cells: ErasedHeaderCell[] } {
  const rows = headerDepth(nodes)
  const cells: ErasedHeaderCell[] = []
  let col = 0
  const place = (list: ExportColumnNode<Row>[], r: number) => {
    for (const node of list) {
      if (isColumnGroup(node)) {
        const start = col
        place(node.children, r + 1)
        if (col > start) cells.push({ header: node.header, r, c: start, rowSpan: 1, colSpan: col - start })
      } else {
        cells.push({ header: node.header, r, c: col, rowSpan: rows - r, colSpan: 1, ...(node.headerColor ? { color: node.headerColor } : {}) })
        col += 1
      }
    }
  }
  place(nodes, 0)
  return { rows, cells }
}

/** Emphasis for one whole data row — e.g. a bureau's subtotal row. */
export interface ExcelRowStyle {
  bold?: boolean
  /** Solid fill, 6-digit hex without '#' (e.g. 'B8CCE4'). */
  fill?: string
}

/** One sheet's worth of config — shared by the single-sheet `exportExcel`
 *  and the multi-sheet `exportExcelSheets`. */
export interface ExportSheetArgs<Row> {
  sheetName: string
  /** Plain columns for a one-row header; groups among them for several rows. */
  columns: ExportColumnNode<Row>[]
  rows: Row[]
  /** Per-row emphasis; undefined (or no callback) = a plain row. */
  rowStyle?: (row: Row, index: number) => ExcelRowStyle | undefined
  /** Report title printed above the table — same string the page passes to
   *  `exportTablePdf`, so PDF and Excel share one header. When present the
   *  sheet gains the PDF-style header block (title + "ข้อมูล ณ วันที่ …" +
   *  optional filter note); when absent the sheet starts at the column
   *  headers exactly like before. */
  title?: string
  /** Active filter/search note — mirrors the PDF's filterNote line. */
  filterNote?: string
}

export interface ExportExcelArgs<Row> extends ExportSheetArgs<Row> {
  /** File name base — saved as `<filenameBase>_YYYYMMDD_HHmmss.xlsx`. */
  filenameBase: string
}

/** A sheet whose `Row` generic has been resolved away (headers + a flat cell
 *  matrix) so sheets built from DIFFERENT row types can travel together in one
 *  workbook without an `any`. Always build one via `excelSheet()`. */
export interface ErasedExportSheet {
  sheetName: string
  title?: string
  filterNote?: string
  /** The data columns, left to right. */
  headers: Pick<ExportColumn<unknown>, 'header' | 'width' | 'headerColor' | 'align' | 'wrap'>[]
  /** A header several rows deep (column groups); absent = one row of `headers`. */
  headerGrid?: { rows: number; cells: ErasedHeaderCell[] }
  cells: (string | number)[][]
  /** Parallel to `cells`. */
  rowStyles?: (ExcelRowStyle | undefined)[]
}

export interface ExportExcelSheetsArgs {
  /** File name base — saved as `<filenameBase>_YYYYMMDD_HHmmss.xlsx`. */
  filenameBase: string
  sheets: ExcelSheet[]
}

/** Resolve one typed sheet config into an `ErasedExportSheet`, so a workbook
 *  can carry several sheets with unrelated row types (e.g. a status table, a
 *  latest-readings table and a time-series table on one device report). */
export function excelSheet<Row>({ sheetName, columns, rows, title, filterNote, rowStyle }: ExportSheetArgs<Row>): ErasedExportSheet {
  const leaves = leafColumns(columns)
  return {
    sheetName,
    title,
    filterNote,
    headers: leaves.map(({ header, width, headerColor, align, wrap }) => ({
      header,
      width,
      ...(headerColor ? { headerColor } : {}),
      ...(align ? { align } : {}),
      ...(wrap ? { wrap } : {}),
    })),
    ...(columns.some(isColumnGroup) ? { headerGrid: headerGrid(columns) } : {}),
    cells: rows.map((row, i) => leaves.map((c) => c.value(row, i))),
    rowStyles: rowStyle ? rows.map((row, i) => rowStyle(row, i)) : undefined,
  }
}

type StyledCell = { v: string | number; t?: 's' | 'n'; s?: object }

const THIN_BORDER = {
  top: { style: 'thin', color: { rgb: 'FF999999' } },
  bottom: { style: 'thin', color: { rgb: 'FF999999' } },
  left: { style: 'thin', color: { rgb: 'FF999999' } },
  right: { style: 'thin', color: { rgb: 'FF999999' } },
}

const headerStyle = (color?: string) => ({
  font: { bold: true, ...(color ? { color: { rgb: `FF${color}` } } : {}) },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  fill: { patternType: 'solid', fgColor: { rgb: 'FFEEEEEE' } },
  border: THIN_BORDER,
})

type SheetRows = (StyledCell | string | number | null)[][]

/** The PDF-style header block (title + as-of line + optional filter note),
 *  each line merged across the sheet's width and centred, then a spacer row. */
function pushTitleBlock(aoa: SheetRows, merges: XLSX.Range[], colCount: number, title: string, filterNote?: string) {
  const pushMergedLine = (cell: StyledCell) => {
    aoa.push([cell, ...Array<string>(colCount - 1).fill('')])
    merges.push({ s: { r: aoa.length - 1, c: 0 }, e: { r: aoa.length - 1, c: colCount - 1 } })
  }
  pushMergedLine({
    v: title,
    s: { font: { bold: true, sz: 14 }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true } },
  })
  pushMergedLine({
    v: `ข้อมูล ณ วันที่ ${dayjs().locale('th').format('D MMMM BBBB เวลา HH:mm น.')}`,
    s: { font: { sz: 10, color: { rgb: 'FF444444' } }, alignment: { horizontal: 'center' } },
  })
  if (filterNote) {
    pushMergedLine({
      v: filterNote,
      s: { font: { sz: 10, color: { rgb: 'FF444444' } }, alignment: { horizontal: 'center', wrapText: true } },
    })
  }
  aoa.push([]) // spacer row between header block and the table
}

/** Build one styled worksheet: optional PDF-style header block, a filled
 *  header (one row, or several for column groups), then bordered data cells. */
function buildWorksheet({ title, filterNote, headers, headerGrid, cells, rowStyles }: ErasedExportSheet): XLSX.WorkSheet {
  const colCount = headers.length
  const aoa: SheetRows = []
  const merges: XLSX.Range[] = []
  if (title) pushTitleBlock(aoa, merges, colCount, title, filterNote)

  // Every header cell styled, the ones a merge covers too, so a merged label
  // keeps its border all round.
  const grid = headerGrid ?? {
    rows: 1,
    cells: headers.map((c, i) => ({ header: c.header, r: 0, c: i, rowSpan: 1, colSpan: 1, color: c.headerColor })),
  }
  const firstHeaderRow = aoa.length
  for (let r = 0; r < grid.rows; r++) aoa.push(headers.map<StyledCell>(() => ({ v: '', s: headerStyle() })))
  for (const cell of grid.cells) {
    const r = firstHeaderRow + cell.r
    aoa[r][cell.c] = { v: cell.header, s: headerStyle(cell.color) }
    if (cell.rowSpan > 1 || cell.colSpan > 1) {
      merges.push({ s: { r, c: cell.c }, e: { r: r + cell.rowSpan - 1, c: cell.c + cell.colSpan - 1 } })
    }
  }
  cells.forEach((row, r) => {
    const emphasis = rowStyles?.[r]
    aoa.push(
      row.map<StyledCell>((v, c) => ({
        v,
        t: typeof v === 'number' ? 'n' : 's',
        s: {
          border: THIN_BORDER,
          alignment: {
            vertical: 'top',
            ...(headers[c]?.align ? { horizontal: headers[c].align } : {}),
            ...(headers[c]?.wrap ? { wrapText: true } : {}),
          },
          ...(emphasis?.bold ? { font: { bold: true } } : {}),
          ...(emphasis?.fill ? { fill: { patternType: 'solid', fgColor: { rgb: `FF${emphasis.fill}` } } } : {}),
        },
      })),
    )
  })

  const ws = XLSX.utils.aoa_to_sheet(aoa)
  ws['!cols'] = headers.map((c) => ({ wch: c.width ?? 16 }))
  if (merges.length) ws['!merges'] = merges
  const rowInfo: XLSX.RowInfo[] = []
  // Taller title row so the 14pt title breathes like the PDF header.
  if (title) rowInfo[0] = { hpt: 24 }
  // A group label sits in a merged cell, which Excel never auto-fits: room for
  // two lines on every header row above the last.
  for (let r = 0; r < grid.rows - 1; r++) rowInfo[firstHeaderRow + r] = { hpt: 36 }
  if (rowInfo.length) ws['!rows'] = rowInfo
  return ws
}

// ── Sheets laid out row by row ────────────────────────────────────────────────

/** How one cell of a laid-out sheet looks. */
export interface ExcelCellStyle {
  bold?: boolean
  /** Solid fill, 6-digit hex without '#'. */
  fill?: string
  /** Font colour, 6-digit hex without '#'. */
  color?: string
  /** Font name — e.g. one that has ☑ / ☐. */
  font?: string
  size?: number
  align?: 'left' | 'center' | 'right'
  vertical?: 'top' | 'center'
  wrap?: boolean
  /** A thin box round the cell — round the whole span when it's merged. */
  border?: boolean
}

/** A part of a cell's text with a colour of its own. */
export interface ExcelTextRun {
  text: string
  /** Font colour, 6-digit hex without '#'; absent = the cell's. */
  color?: string
}

export interface ExcelLayoutCell {
  /** 0-based column. */
  col: number
  /** The columns the cell covers, merged; default 1. */
  span?: number
  value: string | number
  style?: ExcelCellStyle
  /** `value` in parts, so one word can stand out in its own colour ("(ระบบ :
   *  ออนไลน์)" with ออนไลน์ green) — they must join to `value`. */
  runs?: ExcelTextRun[]
}

export interface ExcelLayoutRow {
  cells: ExcelLayoutCell[]
  /** Outline (group) level. A run of rows deeper than the row above it
   *  collapses under that row, its +/− beside it, as Excel's Group does. */
  level?: number
  /** Points; absent = Excel's own height — or, when a merged cell's wrapped
   *  text needs more than one line, enough for it (wrappedRowHeight). */
  height?: number
}

/** A sheet laid out row by row — bands, merged cells, collapsible groups —
 *  under the same title block as the table sheets, for a report that isn't
 *  one table. */
export interface ExcelLayoutSheet {
  sheetName: string
  title?: string
  filterNote?: string
  /** Column widths in characters; their count is the sheet's width. */
  widths: number[]
  rows: ExcelLayoutRow[]
}

export type ExcelSheet = ErasedExportSheet | ExcelLayoutSheet

const isLayoutSheet = (sheet: ExcelSheet): sheet is ExcelLayoutSheet => 'widths' in sheet

const layoutCellStyle = (style: ExcelCellStyle = {}) => {
  const font = {
    ...(style.bold ? { bold: true } : {}),
    ...(style.color ? { color: { rgb: `FF${style.color}` } } : {}),
    ...(style.font ? { name: style.font } : {}),
    ...(style.size ? { sz: style.size } : {}),
  }
  const alignment = {
    ...(style.align ? { horizontal: style.align } : {}),
    ...(style.vertical ? { vertical: style.vertical } : {}),
    ...(style.wrap ? { wrapText: true } : {}),
  }
  return {
    ...(Object.keys(font).length ? { font } : {}),
    ...(Object.keys(alignment).length ? { alignment } : {}),
    ...(style.fill ? { fill: { patternType: 'solid', fgColor: { rgb: `FF${style.fill}` } } } : {}),
    ...(style.border ? { border: THIN_BORDER } : {}),
  }
}

/** The deepest row outline level of a sheet — 0 for one without groups. */
const outlineDepth = (sheet: ExcelSheet) =>
  isLayoutSheet(sheet) ? sheet.rows.reduce((depth, row) => Math.max(depth, row.level ?? 0), 0) : 0

/** A cell written as plain text whose text is then split into coloured runs. */
export interface RichTextCell {
  /** A1 reference. */
  ref: string
  runs: ExcelTextRun[]
  style: ExcelCellStyle
}

// ── Wrapped text in merged cells ────────────────────────────────────────────
// Excel grows a row for wrapped text in a plain cell, never in a merged one —
// that text is cut at the row's one line. So a layout row whose merged cell
// wraps gets its height from the estimate below.

const THAI_NARROW = new Set('เะรใาำงวโไๆฯๅ')
const THAI_WIDE = new Set('ฌญฑฒณ')
const NARROW = new Set(" .,:;'!()[]{}-ijlIJ")
const SLIM = new Set('frstz/')
const WIDE = new Set('MWmw@%&')

const latinPx = (ch: string) =>
  NARROW.has(ch) ? 4.3 : SLIM.has(ch) ? 5.7 : WIDE.has(ch) ? 12.3 : ch >= '0' && ch <= '9' ? 7.55 : ch >= 'A' && ch <= 'Z' ? 8.6 : 7.5

/** About how wide `text` draws in the workbook font (Calibri 11, Thai in
 *  Windows' fallback), in pixels at `size` points — by character class, erring
 *  wide. Calibrated against Chromium on Windows (2026-10-29) over the 21k
 *  strings of the contractor report: none short by more than 0.5%, 4% wide
 *  on average. */
export function excelTextPx(text: string, size = 11): number {
  let px = 0
  for (const ch of text) {
    const code = ch.charCodeAt(0)
    // Thai vowel and tone marks sit on the consonant before them.
    if (code === 0x0e31 || (code >= 0x0e34 && code <= 0x0e3a) || (code >= 0x0e47 && code <= 0x0e4e)) continue
    px += code >= 0x0e00 && code <= 0x0e7f ? (THAI_NARROW.has(ch) ? 7.3 : THAI_WIDE.has(ch) ? 12.8 : 9.5) : latinPx(ch)
  }
  return (px * size) / 11
}

/** A column's width in pixels as Excel draws it: SheetJS writes `wch` as
 *  (wch × 6 + 5) / 6 characters, which Calibri 11 draws at 7px each. */
const columnPx = (wch: number) => Math.trunc(7 * (wch + 5 / 6) + 0.49)

/** The room for text in a cell spanning `widths`, less its padding. */
const cellRoomPx = (widths: number[]) => widths.reduce((sum, wch) => sum + columnPx(wch), 0) - 6

/** How many lines `text` wraps to in `roomPx`: word by word at the spaces, a
 *  word too long for a line running on over several; `\n` starts a line. */
export function excelWrappedLines(text: string, roomPx: number, size = 11): number {
  if (roomPx <= 0) return 1
  const space = excelTextPx(' ', size)
  return text.split('\n').reduce((total, paragraph) => {
    let lines = 1
    let used = 0
    for (const word of paragraph.split(' ')) {
      const width = excelTextPx(word, size)
      const need = used === 0 ? width : used + space + width
      if (need <= roomPx) {
        used = need
        continue
      }
      if (used > 0) lines += 1
      const runOn = Math.max(0, Math.ceil(width / roomPx) - 1)
      lines += runOn
      used = width - runOn * roomPx
    }
    return total + lines
  }, 0)
}

/** A line of 11pt text, in points — Excel's own row height for it. */
const LINE_PT = 15

/** The height a row needs when one of its merged cells wraps onto more lines
 *  than one — tall enough for its tallest wrapped cell; none otherwise (Excel
 *  sizes it). */
const wrappedRowHeight = (row: ExcelLayoutRow, widths: number[]): number | undefined => {
  let mergedWraps = false
  let tallest = 0
  for (const cell of row.cells) {
    if (!cell.style?.wrap) continue
    const span = cell.span ?? 1
    const size = cell.style.size ?? 11
    const lines = excelWrappedLines(String(cell.value), cellRoomPx(widths.slice(cell.col, cell.col + span)), size)
    if (span > 1 && lines > 1) mergedWraps = true
    tallest = Math.max(tallest, (lines * LINE_PT * size) / 11)
  }
  return mergedWraps ? Math.ceil(tallest) + 1 : undefined
}

function buildLayoutWorksheet({ title, filterNote, widths, rows }: ExcelLayoutSheet): { ws: XLSX.WorkSheet; richText: RichTextCell[] } {
  const colCount = widths.length
  const aoa: SheetRows = []
  const merges: XLSX.Range[] = []
  const rowInfo: XLSX.RowInfo[] = []
  const richText: RichTextCell[] = []
  if (title) {
    pushTitleBlock(aoa, merges, colCount, title, filterNote)
    rowInfo[0] = { hpt: 24 }
  }
  for (const row of rows) {
    const r = aoa.length
    const line: SheetRows[number] = Array(colCount).fill(null)
    for (const cell of row.cells) {
      const span = cell.span ?? 1
      line[cell.col] = { v: cell.value, t: typeof cell.value === 'number' ? 'n' : 's', s: layoutCellStyle(cell.style) }
      if (cell.runs?.length) richText.push({ ref: XLSX.utils.encode_cell({ r, c: cell.col }), runs: cell.runs, style: cell.style ?? {} })
      // The cells a merge covers carry the box too, or only its first cell gets one.
      for (let c = cell.col + 1; c < cell.col + span; c++) line[c] = { v: '', s: cell.style?.border ? { border: THIN_BORDER } : {} }
      if (span > 1) merges.push({ s: { r, c: cell.col }, e: { r, c: cell.col + span - 1 } })
    }
    aoa.push(line)
    const height = row.height ?? wrappedRowHeight(row, widths)
    if (row.level || height) rowInfo[r] = { ...(height ? { hpt: height } : {}), ...(row.level ? { level: row.level } : {}) }
  }
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  ws['!cols'] = widths.map((wch) => ({ wch }))
  if (merges.length) ws['!merges'] = merges
  if (rowInfo.length) ws['!rows'] = rowInfo
  // A group's +/− on the row above it (Excel's default puts it below).
  if (rows.some((row) => row.level)) ws['!outline'] = { above: true }
  return { ws, richText }
}

/** Excel only draws a sheet's +/− gutter when its sheetFormatPr names the
 *  deepest row outline level, and SheetJS writes that element for every sheet
 *  or none — so add it to the grouped sheets of the written file alone.
 *  `levels` = each sheet's depth, in workbook order. */
export function withRowOutlines(xlsx: Uint8Array, levels: number[]): Uint8Array {
  const zip = XLSX.CFB.read(xlsx, { type: 'array' })
  levels.forEach((level, index) => {
    if (!level) return
    const entry = XLSX.CFB.find(zip, `/xl/worksheets/sheet${index + 1}.xml`)
    if (!entry?.content) return
    const xml = new TextDecoder().decode(entry.content as Uint8Array)
    entry.content = new TextEncoder().encode(
      xml.replace('</sheetViews>', `</sheetViews><sheetFormatPr defaultRowHeight="15" outlineLevelRow="${level}"/>`),
    ) as unknown as typeof entry.content
  })
  return new Uint8Array(XLSX.CFB.write(zip, { fileType: 'zip', type: 'array', compression: true }) as ArrayLike<number>)
}

const xmlText = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** SheetJS writes no rich text, so each such cell of the written file is
 *  swapped for an inline string in runs — every run in the cell's font, a
 *  coloured one in its colour. `cells` = each sheet's, in workbook order. */
export function withRichText(xlsx: Uint8Array, cells: RichTextCell[][]): Uint8Array {
  const zip = XLSX.CFB.read(xlsx, { type: 'array' })
  cells.forEach((sheetCells, index) => {
    if (!sheetCells.length) return
    const entry = XLSX.CFB.find(zip, `/xl/worksheets/sheet${index + 1}.xml`)
    if (!entry?.content) return
    let xml = new TextDecoder().decode(entry.content as Uint8Array)
    for (const { ref, runs, style } of sheetCells) {
      // The workbook's default font is Calibri 11.
      const font = `<sz val="${style.size ?? 11}"/>${style.bold ? '<b/>' : ''}<rFont val="${style.font ?? 'Calibri'}"/>`
      const text = runs
        .map((run) => {
          const color = run.color ?? style.color
          return `<r><rPr>${font}${color ? `<color rgb="FF${color}"/>` : ''}</rPr><t xml:space="preserve">${xmlText(run.text)}</t></r>`
        })
        .join('')
      // A text cell comes out as t="str" (or t="s" with shared strings).
      xml = xml.replace(
        new RegExp(`<c r="${ref}"([^>]*?) t="s(?:tr)?"([^>]*)>.*?</c>`),
        (_cell, before: string, after: string) => `<c r="${ref}"${before} t="inlineStr"${after}><is>${text}</is></c>`,
      )
    }
    entry.content = new TextEncoder().encode(xml) as unknown as typeof entry.content
  })
  return new Uint8Array(XLSX.CFB.write(zip, { fileType: 'zip', type: 'array', compression: true }) as ArrayLike<number>)
}

/** The workbook as .xlsx bytes, with the +/− gutter on its grouped sheets and
 *  its rich-text cells in colour. */
export function xlsxBytes(workbook: XLSX.WorkBook, outlineLevels: number[], richText: RichTextCell[][] = []): Uint8Array {
  let bytes: Uint8Array = new Uint8Array(XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer)
  if (outlineLevels.some((level) => level > 0)) bytes = withRowOutlines(bytes, outlineLevels)
  if (richText.some((cells) => cells.length > 0)) bytes = withRichText(bytes, richText)
  return bytes
}

/** The workbook of the sheets, each sheet's deepest row outline level and its
 *  rich-text cells. */
export function buildWorkbook(sheets: ExcelSheet[]): { workbook: XLSX.WorkBook; outlineLevels: number[]; richText: RichTextCell[][] } {
  const workbook = XLSX.utils.book_new()
  const richText: RichTextCell[][] = []
  for (const sheet of sheets) {
    // Excel sheet names cap at 31 chars and reject \ / ? * [ ] :
    const name = sheet.sheetName.replace(/[\/?*[\]:]/g, ' ').slice(0, 31)
    const built = isLayoutSheet(sheet) ? buildLayoutWorksheet(sheet) : { ws: buildWorksheet(sheet), richText: [] }
    XLSX.utils.book_append_sheet(workbook, built.ws, name)
    richText.push(built.richText)
  }
  return { workbook, outlineLevels: sheets.map(outlineDepth), richText }
}

function downloadXlsx(bytes: Uint8Array, filename: string) {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** Build + download a multi-sheet .xlsx — one tab per sheet (a table from
 *  `excelSheet()`, or an `ExcelLayoutSheet`). Use when one report covers
 *  several differently-shaped tables (device status / latest readings / time
 *  series) that would otherwise need one file each. */
export function exportExcelSheets({ filenameBase, sheets }: ExportExcelSheetsArgs): void {
  const { workbook, outlineLevels, richText } = buildWorkbook(sheets)
  const filename = `${filenameBase}_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`
  if (outlineLevels.every((level) => level === 0) && richText.every((cells) => cells.length === 0)) {
    XLSX.writeFile(workbook, filename)
    return
  }
  downloadXlsx(xlsxBytes(workbook, outlineLevels, richText), filename)
}

/** Build + download a single-sheet .xlsx from column config (same shape the
 *  PDF export uses, so a page defines its columns once and passes them to
 *  both). Mirrors the drr-cm-fe pattern: json sheet + explicit column widths. */
export function exportExcel<Row>({ filenameBase, ...sheet }: ExportExcelArgs<Row>): void {
  exportExcelSheets({ filenameBase, sheets: [excelSheet(sheet)] })
}
