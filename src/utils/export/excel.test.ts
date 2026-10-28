import { describe, expect, it, vi } from 'vitest'
import { CFB, read, utils, type WorkBook } from 'xlsx-js-style'
import { buildWorkbook, exportExcel, exportExcelSheets, excelSheet, xlsxBytes, type ExcelLayoutSheet } from './excel'

// ESM namespaces aren't spy-able — intercept the module instead and capture
// the workbook that would have been written to disk.
const written: WorkBook[] = []
vi.mock('xlsx-js-style', async (importOriginal) => {
  const actual = await importOriginal<typeof import('xlsx-js-style')>()
  // Spreading the namespace loses the CJS-interop getters (only `default` is
  // enumerable), so forward the members excel.ts and these tests use.
  return {
    utils: actual.utils,
    write: actual.write,
    read: actual.read,
    CFB: actual.CFB,
    writeFile: (wb: WorkBook) => { written.push(wb) },
  }
})

/** A written sheet's XML, straight out of the .xlsx zip. */
const sheetXml = (bytes: Uint8Array, index: number) =>
  new TextDecoder().decode(CFB.find(CFB.read(bytes, { type: 'array' }), `/xl/worksheets/sheet${index}.xml`)!.content as Uint8Array)

describe('excel export', () => {
  it('single-sheet exportExcel still builds one styled sheet', () => {
    exportExcel({
      filenameBase: 'X',
      sheetName: 'S1',
      title: 'หัวข้อรายงาน',
      filterNote: 'เงื่อนไข',
      columns: [{ header: 'ก', value: (r: { a: string }) => r.a }, { header: 'ข', width: 5, value: () => 1 }],
      rows: [{ a: 'v1' }, { a: 'v2' }],
    })
    const wb = written[written.length - 1]
    expect(wb.SheetNames).toEqual(['S1'])
    const ws = wb.Sheets['S1']
    expect(ws['A1'].v).toBe('หัวข้อรายงาน')
    expect(ws['A3'].v).toBe('เงื่อนไข')
    expect(ws['A5'].v).toBe('ก')   // header row after title block + spacer
    expect(ws['A6'].v).toBe('v1')
    expect(ws['B6'].t).toBe('n')
    expect(ws['!merges']?.length).toBe(3)
    expect(ws['!cols']?.[1]).toEqual({ wch: 5 })
  })

  it('rowStyle emphasises whole rows (bold + fill) and leaves the rest plain', () => {
    exportExcel({
      filenameBase: 'X',
      sheetName: 'S',
      columns: [{ header: 'หน่วยงาน', value: (r: { name: string; total: boolean }) => r.name }, { header: 'รวม', value: () => 3 }],
      rows: [{ name: 'สทช.1 (รวม)', total: true }, { name: 'ขทช.ปทุมธานี', total: false }],
      rowStyle: (r) => (r.total ? { bold: true, fill: 'B8CCE4' } : undefined),
    })
    const ws = written[written.length - 1].Sheets['S']
    for (const ref of ['A2', 'B2']) {
      expect(ws[ref].s.font).toEqual({ bold: true })
      expect(ws[ref].s.fill).toEqual({ patternType: 'solid', fgColor: { rgb: 'FFB8CCE4' } })
      expect(ws[ref].s.border).toBeDefined()
    }
    expect(ws['B2'].t).toBe('n') // still a number
    expect(ws['A3'].s.font).toBeUndefined()
    expect(ws['A3'].s.fill).toBeUndefined()
  })

  it('exportExcelSheets builds one tab per sheet, sanitising names', () => {
    exportExcelSheets({
      filenameBase: 'Bridge_Lighting_Report',
      sheets: [
        excelSheet({ sheetName: 'สถานะการทำงาน', title: 'T', columns: [{ header: 'อุปกรณ์', value: (d: { n: string }) => d.n }], rows: [{ n: 'shelly' }] }),
        excelSheet({ sheetName: 'สรุป 24 ชม.', columns: [{ header: 'ค่า', value: (r: { v: number }) => r.v }], rows: [{ v: 232.18 }] }),
        excelSheet({ sheetName: 'bad:name/here*[x]', columns: [{ header: 'h', value: () => '-' }], rows: [] }),
      ],
    })
    const wb = written[written.length - 1]
    expect(wb.SheetNames).toEqual(['สถานะการทำงาน', 'สรุป 24 ชม.', 'bad name here  x '])
    expect(wb.Sheets['สรุป 24 ชม.']['A1'].v).toBe('ค่า')   // no title → starts at headers
    expect(wb.Sheets['สรุป 24 ชม.']['A2'].v).toBe(232.18)
    expect(wb.Sheets['สถานะการทำงาน']['A1'].v).toBe('T')
  })

  it('column groups: a header several rows deep, merged, with coloured labels and aligned cells', () => {
    type Row = { name: string; on: number; off: number }
    exportExcelSheets({
      filenameBase: 'X',
      sheets: [
        excelSheet<Row>({
          sheetName: 'G',
          title: 'T',
          columns: [
            { header: 'ลำดับ', value: (_row, index) => index + 1 },
            { header: 'ชื่อโครงการ', wrap: true, value: (row) => row.name },
            {
              header: 'CCTV (กล้อง)',
              children: [
                {
                  header: 'CCTV',
                  children: [
                    { header: 'ออนไลน์', align: 'center', headerColor: '4E95D9', value: (row) => row.on },
                    { header: 'ออฟไลน์', align: 'center', headerColor: 'FF0000', value: (row) => row.off },
                  ],
                },
              ],
            },
          ],
          rows: [{ name: 'โครงการ 1', on: 3, off: 4 }],
        }),
      ],
    })
    const ws = written[written.length - 1].Sheets['G']
    // Title + as-of line + spacer, then header rows 4–6 and the data on row 7.
    expect(['A4', 'C4', 'C5', 'C6', 'D6'].map((ref) => ws[ref].v)).toEqual(['ลำดับ', 'CCTV (กล้อง)', 'CCTV', 'ออนไลน์', 'ออฟไลน์'])
    expect(['A7', 'B7', 'C7', 'D7'].map((ref) => ws[ref].v)).toEqual([1, 'โครงการ 1', 3, 4])
    expect(ws['!merges']!.map((m) => utils.encode_range(m))).toEqual(['A1:D1', 'A2:D2', 'A4:A6', 'B4:B6', 'C5:D5', 'C4:D4'])
    expect(ws['C6'].s.font).toEqual({ bold: true, color: { rgb: 'FF4E95D9' } })
    expect(ws['A4'].s.font).toEqual({ bold: true })
    // A cell under a merge is styled too, so the merged label keeps its border.
    expect(ws['A5'].s.border).toBeDefined()
    expect(ws['D4'].s.fill).toEqual({ patternType: 'solid', fgColor: { rgb: 'FFEEEEEE' } })
    expect(ws['C7'].s.alignment).toEqual({ vertical: 'top', horizontal: 'center' })
    expect(ws['B7'].s.alignment).toEqual({ vertical: 'top', wrapText: true })
    expect(ws['A7'].s.alignment).toEqual({ vertical: 'top' })
    // Merged labels never auto-fit: room for two lines above the last header row.
    expect([ws['!rows']![0], ws['!rows']![3], ws['!rows']![4], ws['!rows']![5]]).toEqual([{ hpt: 24 }, { hpt: 36 }, { hpt: 36 }, undefined])
  })
})

describe('excel export — sheets laid out row by row', () => {
  const layout: ExcelLayoutSheet = {
    sheetName: 'L',
    title: 'T',
    widths: [10, 10, 10],
    rows: [
      { cells: [{ col: 0, value: 'กลุ่ม 1', style: { fill: 'DCEAF7' } }, { col: 1, span: 2, value: 'ชื่อ', style: { fill: 'DCEAF7', align: 'left' } }] },
      { level: 1, height: 42, cells: [{ col: 1, value: '☑ CCTV', style: { font: 'Segoe UI Symbol', size: 10, wrap: true } }] },
      { level: 1, cells: [{ col: 0, span: 3, value: 'จุดติดตั้ง : ก', style: { border: true } }] },
      { level: 1, cells: [] },
      { cells: [{ col: 0, value: 2 }] },
    ],
  }

  it('places, merges and styles the cells, the rows below the title block', () => {
    const { workbook, outlineLevels } = buildWorkbook([layout])
    const ws = workbook.Sheets['L']
    expect(outlineLevels).toEqual([1])
    // Title + as-of line + spacer, then the rows from row 4.
    expect(['A1', 'A4', 'B4', 'B5', 'A6', 'A8'].map((ref) => ws[ref]?.v)).toEqual(['T', 'กลุ่ม 1', 'ชื่อ', '☑ CCTV', 'จุดติดตั้ง : ก', 2])
    expect(ws['A8'].t).toBe('n')
    expect(ws['!merges']!.map((m) => utils.encode_range(m))).toEqual(['A1:C1', 'A2:C2', 'B4:C4', 'A6:C6'])
    expect(ws['B4'].s).toEqual({ alignment: { horizontal: 'left' }, fill: { patternType: 'solid', fgColor: { rgb: 'FFDCEAF7' } } })
    expect(ws['B5'].s).toEqual({ font: { name: 'Segoe UI Symbol', sz: 10 }, alignment: { wrapText: true } })
    // A merged span keeps its box: the covered cells carry the border too.
    expect(ws['C6'].s.border).toEqual(ws['A6'].s.border)
    expect(ws['A7']).toBeUndefined()
    expect(ws['!cols']).toEqual([{ wch: 10 }, { wch: 10 }, { wch: 10 }])
    expect([3, 4, 5, 6, 7].map((r) => ws['!rows']![r])).toEqual([undefined, { hpt: 42, level: 1 }, { level: 1 }, { level: 1 }, undefined])
    expect(ws['!outline']).toEqual({ above: true })
  })

  it('a grouped sheet gets its +/− gutter (sheetFormatPr outlineLevelRow) — the others don’t', () => {
    const table = excelSheet({ sheetName: 'ตาราง', columns: [{ header: 'h', value: (r: { v: number }) => r.v }], rows: [{ v: 1 }] })
    const { workbook, outlineLevels } = buildWorkbook([table, layout])
    const bytes = xlsxBytes(workbook, outlineLevels)
    expect(outlineLevels).toEqual([0, 1])
    const grouped = sheetXml(bytes, 2)
    expect(grouped).toContain('<outlinePr summaryBelow="0" summaryRight="1"/>')
    // Right after sheetViews, where the schema wants it.
    expect(grouped).toContain('</sheetViews><sheetFormatPr defaultRowHeight="15" outlineLevelRow="1"/><cols>')
    expect(grouped).toMatch(/<row r="5"[^>]*outlineLevel="1"/)
    expect(sheetXml(bytes, 1)).not.toContain('sheetFormatPr')
    // Still a workbook Excel (and SheetJS) can open, every value in place.
    const back = read(bytes, { type: 'array' })
    expect(back.SheetNames).toEqual(['ตาราง', 'L'])
    expect(back.Sheets['L']['A6'].v).toBe('จุดติดตั้ง : ก')
  })

  it('without groups the bytes are SheetJS’s own', () => {
    const { workbook, outlineLevels } = buildWorkbook([{ ...layout, rows: layout.rows.map((row) => ({ cells: row.cells, height: row.height })) }])
    expect(outlineLevels).toEqual([0])
    expect(sheetXml(xlsxBytes(workbook, outlineLevels), 1)).not.toContain('sheetFormatPr')
  })
})
