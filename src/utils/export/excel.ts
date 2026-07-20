import * as XLSX from 'xlsx'
import dayjs from 'dayjs'

/** One exported column: Thai header + how to pull the cell from a row.
 *  `width` is the Excel column width in characters (xlsx `wch`). */
export interface ExportColumn<Row> {
  header: string
  width?: number
  value: (row: Row, index: number) => string | number
}

export interface ExportExcelArgs<Row> {
  /** File name base — saved as `<filenameBase>_YYYYMMDD_HHmmss.xlsx`. */
  filenameBase: string
  sheetName: string
  columns: ExportColumn<Row>[]
  rows: Row[]
}

/** Build + download an .xlsx from column config (same shape the PDF export
 *  uses, so a page defines its columns once and passes them to both).
 *  Mirrors the drr-cm-fe pattern: json sheet + explicit column widths. */
export function exportExcel<Row>({ filenameBase, sheetName, columns, rows }: ExportExcelArgs<Row>): void {
  const aoa: (string | number)[][] = [
    columns.map((c) => c.header),
    ...rows.map((row, i) => columns.map((c) => c.value(row, i))),
  ]
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  ws['!cols'] = columns.map((c) => ({ wch: c.width ?? 16 }))

  const wb = XLSX.utils.book_new()
  // Excel sheet names cap at 31 chars and reject \ / ? * [ ] :
  XLSX.utils.book_append_sheet(wb, ws, sheetName.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31))
  XLSX.writeFile(wb, `${filenameBase}_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`)
}
