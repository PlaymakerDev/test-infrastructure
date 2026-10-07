import { describe, expect, it } from 'vitest'
import { fileStem, withSavePdfBar } from './reportHtml'

const REPORT = '<!DOCTYPE html><html lang="th"><head><title>รายงาน</title><style>body{margin:24px}</style></head>' +
  '<body class="r"><h1>รายงานสถานะกล้อง CCTV</h1></body></html>'

describe('withSavePdfBar', () => {
  it('puts the ดาวน์โหลด PDF bar first in the body and leaves the report as it was', () => {
    const out = withSavePdfBar(REPORT, 'รายงานสถานะกล้อง_สทช.ที่ 2/22/2568')
    const bodyEnd = REPORT.indexOf('<h1>')
    // Everything the backend sent is still there, in order, with the bar
    // between the opening <body> and the report's first heading.
    expect(out.startsWith(REPORT.slice(0, bodyEnd))).toBe(true)
    expect(out.endsWith(REPORT.slice(bodyEnd))).toBe(true)
    const added = out.slice(bodyEnd, out.length - (REPORT.length - bodyEnd))
    expect(added).toMatch(/^<style>[\s\S]*<\/style><div class="its-save-pdf-bar"[\s\S]*ดาวน์โหลด PDF[\s\S]*<\/script>$/)
  })

  it('never prints the bar', () => {
    expect(withSavePdfBar(REPORT, 'x')).toMatch(/@media print\{\.its-save-pdf-bar\{display:none!important\}\}/)
  })

  it('leaves how the report prints to the backend', () => {
    // Paper, margins and colours are the report's own CSS (user 2026-10-07).
    expect(withSavePdfBar(REPORT, 'x')).not.toContain('@page')
  })

  it('names the saved PDF like the app’s exports, from a safe stem', () => {
    const out = withSavePdfBar(REPORT, 'รายงานสถานะกล้อง_สทช.ที่ 2/22/2568')
    expect(out).toContain('var base = "รายงานสถานะกล้อง_สทช.ที่ 2-22-2568";')
    // A stem can't close the script it is written into.
    const hostile = withSavePdfBar(REPORT, 'a</script><b>"x')
    expect(hostile).toContain('var base = "a-script-b-x";')
    expect(hostile.match(/<\/script>/g)).toHaveLength(1)
  })

  it('still adds the bar to a page without a <body> tag', () => {
    expect(withSavePdfBar('<h1>x</h1>', 'x').endsWith('<h1>x</h1>')).toBe(true)
    expect(withSavePdfBar('<h1>x</h1>', 'x')).toContain('its-save-pdf-bar')
  })
})

describe('fileStem', () => {
  it('drops what a file name cannot hold', () => {
    expect(fileStem(' a/b\\c:d*e?f"g<h>i|j  k ')).toBe('a-b-c-d-e-f-g-h-i-j k')
  })
})
