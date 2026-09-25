import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx-js-style'
import { removeSheetColumn, removeXlsxColumnByHeader, shiftRange } from './removeColumn'

describe('shiftRange', () => {
  it('slides refs right of the removed column one to the left, keeping anchors', () => {
    expect(shiftRange('A5:E32', 6)).toBe('A5:E32')
    expect(shiftRange('G2', 6)).toBe('F2')
    expect(shiftRange('$A$1:$L$1', 6)).toBe('$A$1:$K$1')
    expect(shiftRange('F2:H9', 6)).toBe('F2:G9')
    expect(shiftRange('D2:F9', 6)).toBe('D2:E9')
    expect(shiftRange('Z1:AB1', 26)).toBe('Z1:AA1')
  })

  it('returns null when nothing is left of the range', () => {
    expect(shiftRange('F2', 6)).toBeNull()
    expect(shiftRange('F2:F9', 6)).toBeNull()
    expect(shiftRange('E1:F1', 6)).toBeNull() // would shrink to a one-cell merge
  })
})

describe('removeSheetColumn', () => {
  it('drops the cells, width and merges of the column and shifts the rest', () => {
    const xml =
      '<worksheet><dimension ref="A1:C2"></dimension>' +
      '<cols><col customWidth="true" max="1" min="1" width="10"></col><col customWidth="true" max="3" min="2" width="18"></col></cols>' +
      '<sheetData><row r="1" spans="1:3"><c r="A1" s="1" t="s"><v>0</v></c><c r="B1" s="1" t="s"><v>1</v></c><c r="C1" s="1" t="s"><v>2</v></c></row>' +
      '<row r="2"><c r="A2" s="2"></c><c r="B2" s="2"/><c r="C2" s="3"><v>7</v></c></row></sheetData>' +
      '<autoFilter ref="$A$1:$C$1"></autoFilter>' +
      '<mergeCells count="2"><mergeCell ref="A1:A2"></mergeCell><mergeCell ref="B2:C2"></mergeCell></mergeCells></worksheet>'
    const out = removeSheetColumn(xml, 2)
    expect(out).toContain('<dimension ref="A1:B2">')
    expect(out).toContain('<col customWidth="true" max="2" min="2" width="18"></col>')
    expect(out).toContain('<row r="1" spans="1:2"><c r="A1" s="1" t="s"><v>0</v></c><c r="B1" s="1" t="s"><v>2</v></c></row>')
    expect(out).toContain('<row r="2"><c r="A2" s="2"></c><c r="B2" s="3"><v>7</v></c></row>')
    expect(out).toContain('<autoFilter ref="$A$1:$B$1">')
    // B2:C2 shrinks to one cell, so only A1:A2 survives.
    expect(out).toContain('<mergeCells count="1"><mergeCell ref="A1:A2"></mergeCell></mergeCells>')
  })
})

describe('removeXlsxColumnByHeader', () => {
  const build = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['บริษัท', 'ชื่อย่อ', 'รหัสโครงการ', 'เลขที่สัญญา'],
      ['ก', 'k', 'MT001', 'สบร.1/2569'],
      ['', '', 'MT002', 'สบร.2/2569'],
    ])
    ws['!merges'] = [{ s: { r: 1, c: 0 }, e: { r: 2, c: 0 } }, { s: { r: 1, c: 1 }, e: { r: 2, c: 1 } }]
    ws['!cols'] = [{ wch: 22 }, { wch: 10 }, { wch: 14 }, { wch: 18 }]
    ws['!autofilter'] = { ref: 'A1:D1' }
    ws['A1'].s = { fill: { patternType: 'solid', fgColor: { rgb: '2F5597' } } }
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'ผู้รับจ้าง')
    return new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx', bookSST: true }))
  }

  it('removes the column and keeps the workbook readable', async () => {
    const out = await removeXlsxColumnByHeader(build(), 'รหัสโครงการ')
    expect(out).not.toBeNull()
    const wb = XLSX.read(out!, { type: 'array', cellStyles: true })
    const ws = wb.Sheets['ผู้รับจ้าง']
    expect(XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })).toEqual([
      ['บริษัท', 'ชื่อย่อ', 'เลขที่สัญญา'],
      ['ก', 'k', 'สบร.1/2569'],
      ['', '', 'สบร.2/2569'],
    ])
    expect(ws['!merges']).toEqual([{ s: { r: 1, c: 0 }, e: { r: 2, c: 0 } }, { s: { r: 1, c: 1 }, e: { r: 2, c: 1 } }])
    expect(ws['!cols']?.map((c) => c.wch && Math.round(c.wch))).toEqual([22, 10, 18])
    // SheetJS writes the filter over the whole data range (A1:D3).
    expect(ws['!autofilter']?.ref).toBe('A1:C3')
    const zip = XLSX.CFB.read(out!, { type: 'array' })
    const workbookXml = new TextDecoder().decode(XLSX.CFB.find(zip, '/xl/workbook.xml').content)
    expect(workbookXml).toContain('!A1:C3</definedName>')
    expect(XLSX.CFB.find(zip, '/Sh33tJ5')).toBeNull()
    expect(ws['A1'].s?.fgColor?.rgb).toBe('2F5597')
  })

  it('returns null when the header is not in the sheet', async () => {
    expect(await removeXlsxColumnByHeader(build(), 'ไม่มีคอลัมน์นี้')).toBeNull()
  })
})
