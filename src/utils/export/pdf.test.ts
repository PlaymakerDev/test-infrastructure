import path from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import type { FontLike } from './pdf'

// pdf.tsx registers its font from NEXT_PUBLIC_BASE_PATH as it loads, so point
// that at public/ BEFORE the dynamic import below — it loads off disk.
process.env.NEXT_PUBLIC_BASE_PATH = path.resolve('public')

let kit: typeof import('./pdf')
let face: FontLike

beforeAll(async () => {
  kit = await import('./pdf')
  face = (await kit.loadMeasureFont('NotoSansThai__measure'))!
}, 60_000)

// A real camera name (ผู้รับจ้าง พงศกรกลการ, 2026-10-08): it starts in Latin and
// holds ฬ + an above mark.
const CAMERA = '68PSK-NPT4006-F017-จุดที่8-กม.4+100-มุ่งหน้าหอนาฬิกา'

describe('wrapPdfText — Latin-first text with ฬ + an above mark', () => {
  it('is what makes fontkit throw when laid out whole', () => {
    expect(face).toBeTruthy()
    expect(() => face.layout(CAMERA)).toThrow()
    expect(() => face.layout('Fฬิ')).toThrow()
  })

  it('is split where the script changes, digits and punctuation riding along', () => {
    expect(kit.scriptRuns(CAMERA)).toEqual(['68PSK-NPT4006-F017-', 'จุดที่8-กม.4+100-มุ่งหน้าหอนาฬิกา'])
    expect(kit.scriptRuns('Fฬิ')).toEqual(['F', 'ฬิ'])
    expect(kit.scriptRuns('CCTV ออนไลน์ 12')).toEqual(['CCTV ', 'ออนไลน์ 12'])
    expect(kit.scriptRuns('ทดสอบ')).toEqual(['ทดสอบ'])
    expect(kit.scriptRuns('')).toEqual([])
  })

  it('wraps without throwing and keeps every character, at any width', () => {
    for (const maxPt of [600, 160, 60]) {
      const wrapped = kit.wrapPdfText(face, CAMERA, maxPt, 9)
      expect(wrapped.replace(/ \n/g, '')).toBe(CAMERA)
    }
  })
})

describe('splitWrapped — coloured parts of a text wrapped as one', () => {
  const band = 'Traffic Signal · จุดติดตั้ง : รย.4006 แยกจราจรบ้านแหลมมะขาม กม.12+000 (ระบบ : '
  const runs = [{ text: band }, { text: 'ออฟไลน์', color: '#FF0000' }, { text: ')' }]
  const joined = runs.map((run) => run.text).join('')

  it('hands every character back to its part, the breaks with them, at any width', () => {
    for (const maxPt of [600, 160, 90, 40]) {
      const wrapped = kit.wrapPdfText(face, joined, maxPt, 7)
      const parts = kit.splitWrapped(runs, wrapped)
      expect(parts.map((part) => part.text).join('')).toBe(wrapped)
      // The coloured word keeps its colour and its letters, wherever a break falls.
      const red = parts.filter((part) => part.color === '#FF0000')
      expect(red.map((part) => part.text).join('').replace(/ ?\n/g, '')).toBe('ออฟไลน์')
      expect(parts.at(-1)!.text.replace(/ ?\n/g, '')).toBe(')')
    }
  })

  it('a short text stays as it was', () => {
    const count = [{ text: '12', color: '#4E95D9' }, { text: '/' }, { text: '3', color: '#FF0000' }]
    expect(kit.splitWrapped(count, '12/3')).toEqual(count)
  })

  it('a space the wrap dropped at a break, and a break at a part’s edge', () => {
    const parts = [{ text: 'ab ' }, { text: 'cd', color: '#00B050' }]
    expect(kit.splitWrapped(parts, 'ab \ncd')).toEqual([{ text: 'ab \n' }, { text: 'cd', color: '#00B050' }])
    expect(kit.splitWrapped([{ text: 'ab  ' }, { text: 'cd', color: '#00B050' }], 'ab \ncd')).toEqual([{ text: 'ab \n' }, { text: 'cd', color: '#00B050' }])
  })
})

// Code points, not literals: the two spellings look the same on screen.
const SARA_AM = String.fromCodePoint(0x0e33)
const NIKHAHIT_SARA_AA = String.fromCodePoint(0x0e4d, 0x0e32)

describe('drawableThai — ำ spelled as the two glyphs NotoSansThai draws for it', () => {
  const band = `งานอ${SARA_AM}นวยความปลอดภัย จ${SARA_AM}นวน 1 แห่ง · ออฟไลน์ 39 ตัว`

  it('spells every ำ as ํ + า and leaves the rest alone', () => {
    const drawn = kit.drawableThai(band)
    expect(drawn).not.toContain(SARA_AM)
    expect(drawn).toBe(band.split(SARA_AM).join(NIKHAHIT_SARA_AA))
    expect(kit.drawableThai('CCTV ออนไลน์ 12')).toBe('CCTV ออนไลน์ 12')
  })

  it('draws at exactly the same width, so wrapping on the real spelling still holds', () => {
    expect(face.layout(kit.drawableThai(band)).advanceWidth).toBe(face.layout(band).advanceWidth)
  })
})
