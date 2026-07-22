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
}

export interface ExportExcelArgs<Row> {
  /** File name base — saved as `<filenameBase>_YYYYMMDD_HHmmss.xlsx`. */
  filenameBase: string
  sheetName: string
  columns: ExportColumn<Row>[]
  rows: Row[]
  /** Report title printed above the table — same string the page passes to
   *  `exportTablePdf`, so PDF and Excel share one header. When present the
   *  sheet gains the PDF-style header block (title + "ข้อมูล ณ วันที่ …" +
   *  optional filter note); when absent the sheet starts at the column
   *  headers exactly like before. */
  title?: string
  /** Active filter/search note — mirrors the PDF's filterNote line. */
  filterNote?: string
}

type StyledCell = { v: string | number; t?: 's' | 'n'; s?: object }

const THIN_BORDER = {
  top: { style: 'thin', color: { rgb: 'FF999999' } },
  bottom: { style: 'thin', color: { rgb: 'FF999999' } },
  left: { style: 'thin', color: { rgb: 'FF999999' } },
  right: { style: 'thin', color: { rgb: 'FF999999' } },
}

/** Build + download an .xlsx from column config (same shape the PDF export
 *  uses, so a page defines its columns once and passes them to both).
 *  Mirrors the drr-cm-fe pattern: json sheet + explicit column widths. */
export function exportExcel<Row>({ filenameBase, sheetName, columns, rows, title, filterNote }: ExportExcelArgs<Row>): void {
  const colCount = columns.length
  const aoa: (StyledCell | string | number)[][] = []
  const merges: XLSX.Range[] = []

  // ── PDF-style header block (title + as-of line + optional filter note),
  //    each line merged across the table width and centered.
  if (title) {
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

  aoa.push(
    columns.map<StyledCell>((c) => ({
      v: c.header,
      s: {
        font: { bold: true },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        fill: { patternType: 'solid', fgColor: { rgb: 'FFEEEEEE' } },
        border: THIN_BORDER,
      },
    })),
  )
  for (const [i, row] of rows.entries()) {
    aoa.push(
      columns.map<StyledCell>((c) => {
        const v = c.value(row, i)
        return { v, t: typeof v === 'number' ? 'n' : 's', s: { border: THIN_BORDER, alignment: { vertical: 'top' } } }
      }),
    )
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa)
  ws['!cols'] = columns.map((c) => ({ wch: c.width ?? 16 }))
  if (merges.length) ws['!merges'] = merges
  // Taller title row so the 14pt title breathes like the PDF header.
  if (title) ws['!rows'] = [{ hpt: 24 }]

  const wb = XLSX.utils.book_new()
  // Excel sheet names cap at 31 chars and reject \ / ? * [ ] :
  XLSX.utils.book_append_sheet(wb, ws, sheetName.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31))
  XLSX.writeFile(wb, `${filenameBase}_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`)
}
