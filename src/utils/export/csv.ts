import dayjs from 'dayjs'

/** One CSV column: header text + how to pull the cell from a row. Mirrors the
 *  `value` contract of the Excel/PDF export kits so pages can share column
 *  definitions across formats. */
export interface CsvColumn<Row> {
  header: string
  value: (row: Row, index: number) => string | number | null | undefined
}

export interface ExportCsvArgs<Row> {
  /** File name base — saved as `<filenameBase>_YYYYMMDD_HHmmss.csv`. */
  filenameBase: string
  columns: CsvColumn<Row>[]
  rows: Row[]
}

// RFC-4180 escaping: wrap in quotes when the field contains a comma, quote,
// or newline; double any embedded quotes.
const escapeCell = (v: string | number | null | undefined): string => {
  const s = v == null ? '' : String(v)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/**
 * Plain .csv export (added 2026-08-24 for maintenance's จุดติดตั้งอุปกรณ์ tab,
 * whose spec asks for CSV rather than the app-standard xlsx). Generated fully
 * client-side:
 *  - UTF-8 BOM prefix — without it Excel-on-Windows guesses the encoding and
 *    mangles Thai text.
 *  - CRLF row endings per RFC 4180.
 * For styled reports (title block, filter note) keep using
 * `utils/export/excel.ts` — CSV is intentionally bare tabular data.
 */
export function exportCsv<Row>({ filenameBase, columns, rows }: ExportCsvArgs<Row>): void {
  const header = columns.map((c) => escapeCell(c.header)).join(',')
  const body = rows.map((row, i) => columns.map((c) => escapeCell(c.value(row, i))).join(','))
  const csv = '\uFEFF' + [header, ...body].join('\r\n') + '\r\n'

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filenameBase}_${dayjs().format('YYYYMMDD_HHmmss')}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
