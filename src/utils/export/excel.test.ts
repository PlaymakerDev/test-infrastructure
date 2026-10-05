import { describe, expect, it, vi } from 'vitest'
import type { WorkBook } from 'xlsx-js-style'
import { exportExcel, exportExcelSheets, excelSheet } from './excel'

// ESM namespaces aren't spy-able — intercept the module instead and capture
// the workbook that would have been written to disk.
const written: WorkBook[] = []
vi.mock('xlsx-js-style', async (importOriginal) => {
  const actual = await importOriginal<typeof import('xlsx-js-style')>()
  // Spreading the namespace loses the CJS-interop getters (only `default` is
  // enumerable), so forward the two members excel.ts actually uses.
  return { utils: actual.utils, writeFile: (wb: WorkBook) => { written.push(wb) } }
})

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
})
