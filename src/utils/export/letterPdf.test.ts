import fs from 'node:fs'
import path from 'node:path'
import React from 'react'
import { beforeAll, describe, expect, it } from 'vitest'
import type { RepairLetterInput } from '@/features/admin/maintenance/case/data/repairLetter'

// The letter registers its fonts from NEXT_PUBLIC_BASE_PATH as it loads, so
// point that at public/ BEFORE the dynamic import below — they load off disk.
process.env.NEXT_PUBLIC_BASE_PATH = path.resolve('public')

let letter: typeof import('./letterPdf')
let buildRepairLetter: typeof import('@/features/admin/maintenance/case/data/repairLetter').buildRepairLetter
let budgets: typeof import('@/features/admin/maintenance/case/data/reasonBudget')
let pdf: typeof import('@react-pdf/renderer').pdf
let emblem: string

beforeAll(async () => {
  letter = await import('./letterPdf')
  ;({ buildRepairLetter } = await import('@/features/admin/maintenance/case/data/repairLetter'))
  budgets = await import('@/features/admin/maintenance/case/data/reasonBudget')
  ;({ pdf } = await import('@react-pdf/renderer'))
  emblem = `data:image/png;base64,${fs.readFileSync(path.resolve('public/images/export/garuda-emblem.png')).toString('base64')}`
}, 60_000)

const REASON = (
  'ตรวจพบกล้องโทรทัศน์วงจรปิด (CCTV) จำนวน 1 ตัว บริเวณสายทาง รย.4006 กม.4+170 จุดติดตั้งที่ 4 ' +
  'อยู่ในสถานะออฟไลน์ (Offline) ไม่สามารถรับชมภาพและส่งสัญญาณภาพเข้าสู่ระบบส่วนกลางได้ตามปกติ ' +
  'เบื้องต้นเจ้าหน้าที่ได้ตรวจสอบสถานะการเชื่อมต่อของกล้องและอุปกรณ์เครือข่ายที่เกี่ยวข้องแล้ว '
).repeat(4)

// Three real-world shapes: the user's PSD project, long names, minimal names.
const LETTERS: Record<string, RepairLetterInput> = {
  psd: {
    caseNo: 'C-1', letterNo: 'คค 34/2569', letterDate: '2026-10-05', contractDate: '2025-08-18', budget: '3400000',
    project: { contractor: 'บริษัท พีเอสดี โรด โซลูชั่น จำกัด', contractNo: 'สอป.34/2568', projectName: 'โครงการปรับปรุงจุดเสี่ยงอันตราย ถนนสาย รย.4006 (PSD)' },
    deviceType: 'กล้องโทรทัศน์วงจรปิด', deadline: '2026-10-27', contractClause: '3',
    coordinatorName: 'นายณัฐวุฒิ พรหมมา', coordinatorPosition: 'นายช่างโยธา', coordinatorPhone: '0975432346',
  },
  long: {
    caseNo: 'C-2', letterNo: 'คค 0729.2/2569', letterDate: '2026-10-05', contractDate: '2025-04-04', budget: '12500000',
    project: { contractor: 'ห้างหุ้นส่วนจำกัด ลำปางภาณุภัทร์ก่อสร้าง 2008', contractNo: 'สบร.183/2569', projectName: 'โครงการติดตั้งระบบกล้องโทรทัศน์วงจรปิด (CCTV) บริเวณสายทาง กท.1001 ถนนกัลปพฤกษ์ อำเภอบางแค กรุงเทพมหานคร' },
    deviceType: 'กล้องโทรทัศน์วงจรปิด และระบบตรวจนับปริมาณจราจร', deadline: '2026-10-30', contractClause: '8',
    coordinatorName: 'นางสาวสมหญิง ใจดีมากมาย', coordinatorPosition: 'วิศวกรโยธาชำนาญการพิเศษ', coordinatorPhone: '0812345678',
  },
  short: {
    caseNo: 'C-3', letterNo: 'คค 1/2569', letterDate: '2026-10-05', contractDate: '2025-01-01', budget: '1000000',
    project: { contractor: 'ทดสอบ', contractNo: 'ทส.1/2568', projectName: 'ทดสอบระบบ' },
    deviceType: 'กล้องโทรทัศน์วงจรปิด', deadline: '2026-10-10', contractClause: '3',
    coordinatorName: 'นายเอ บี', coordinatorPosition: 'นายช่าง', coordinatorPhone: '021234567',
  },
}

// Solution 434's real project (MST, ลบ.4040): its name alone fills page 1 — a
// one-character reason already pushed ขอแสดงความนับถือ to page 2 (2026-10-06).
const TIGHT: RepairLetterInput = {
  caseNo: '', letterNo: 'คค 0729.2/2569', letterDate: '2026-10-06', contractDate: '2025-12-11', budget: '4980000',
  project: {
    contractor: 'บริษัท แมสซีฟ ซิสเต็ม แอนด์ เทคโนโลยี จำกัด',
    contractNo: 'ขทช.ลบ./63/2568',
    projectName: 'อำนวยความปลอดภัยและปรับปรุงแก้ไขบริเวณเสี่ยงอันตราย สาย ลบ.4040 แยกทางหลวงหมายเลข 2256 - น้ำตกวังก้านเหลือง ต.ท่าหลวง อ.ท่าหลวง จ.ลพบุรี จำนวน 1 แห่ง',
  },
  deviceType: 'กล้องโทรทัศน์วงจรปิด', deadline: '2026-10-27', contractClause: '8',
  coordinatorName: 'นายณัฐวุฒิ พรหมมา', coordinatorPosition: 'นายช่างโยธา', coordinatorPhone: '0975432346',
}

const prepare = (input: RepairLetterInput, reasonLength: number, closingMayDrop = false) =>
  letter.wrapLetterArgs({ ...buildRepairLetter({ ...input, defect: REASON.slice(0, reasonLength) }), closingMayDrop })

/** Sheets the real renderer breaks the letter page into. */
const sheets = async (prepared: Awaited<ReturnType<typeof prepare>>) => {
  let pages = 1
  // LetterDocument renders the <Document>; pdf() types its argument as one.
  const element = React.createElement(letter.LetterDocument, { ...prepared, emblemDataUrl: emblem, onLetterPages: (n: number) => { pages = n } })
  await pdf(element as unknown as Parameters<typeof pdf>[0]).toBlob()
  return pages
}

/** Sheets of the FINAL document — both passes of letterDocument(), as the app
 *  renders it (the carried drawing must paginate exactly like the probe). */
const finalSheets = async (prepared: Awaited<ReturnType<typeof prepare>>) => {
  let pages = 1
  const doc = (await letter.letterDocument(prepared, emblem)) as React.ReactElement<{ onLetterPages?: (n: number) => void }>
  const probed = React.cloneElement(doc, { onLetterPages: (n: number) => { pages = n } })
  await pdf(probed as unknown as Parameters<typeof pdf>[0]).toBlob()
  return pages
}

/** Longest reason that closingFitsFirstPage() keeps on one sheet. */
const modelLimit = async (input: RepairLetterInput, closingMayDrop = false) => {
  let lo = 1
  let hi = REASON.length
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2)
    if (letter.closingFitsFirstPage(await prepare(input, mid, closingMayDrop))) lo = mid
    else hi = mid - 1
  }
  return lo
}

describe('closingFitsFirstPage', () => {
  it.each(Object.keys(LETTERS))('matches @react-pdf pagination at the boundary (%s)', async (name) => {
    const input = LETTERS[name]
    const limit = await modelLimit(input)
    expect(await sheets(await prepare(input, limit))).toBe(1)
    expect(await sheets(await prepare(input, limit + 1))).toBe(2)
    // …and the finished letter agrees: one character over is carried, not
    // squeezed back onto page 1 by the shorter carried drawing.
    expect(await finalSheets(await prepare(input, limit))).toBe(1)
    expect(await finalSheets(await prepare(input, limit + 1))).toBe(2)
    // and well inside either side
    expect(letter.closingFitsFirstPage(await prepare(input, 1))).toBe(true)
    expect(await sheets(await prepare(input, 1))).toBe(1)
    expect(letter.closingFitsFirstPage(await prepare(input, REASON.length))).toBe(false)
  }, 60_000)
})

describe('closingMayDrop', () => {
  it.each(Object.keys(LETTERS))('keeps the closing on page 1 by bringing it down — then carries it (%s)', async (name) => {
    const input = LETTERS[name]
    const pinned = await modelLimit(input)
    const dropped = await modelLimit(input, true)
    expect(dropped).toBeGreaterThan(pinned)
    // Past the room under the footer: the signing room tightened too.
    expect(letter.firstPageOverflow(await prepare(input, dropped))).toBeGreaterThan(28)
    // What used to be carried now stays on page 1 …
    expect(await finalSheets(await prepare(input, pinned + 1, true))).toBe(1)
    expect(await finalSheets(await prepare(input, dropped, true))).toBe(1)
    // … until even that room runs out, and it is carried as before.
    expect(await finalSheets(await prepare(input, dropped + 1, true))).toBe(2)
    // A letter that fits never moves.
    expect(letter.firstPageOverflow(await prepare(input, pinned))).toBeLessThanOrEqual(0)
  }, 120_000)
})

describe('hand-typed line breaks in the reason', () => {
  it('end their line where typed, ragged — never letter-spaced to the margin', async () => {
    // Pasted from an earlier letter's PDF: hard breaks at that PDF's line ends.
    const pasted = `ตรวจพบกล้องดับบริเวณทางแยกหน้าโรงเรียนวัดบ้านต้นกระบก\nสาเหตุเบื้องต้นจากไฟฟ้าขัดข้อง\n${REASON.slice(0, 300)}`
    const prepared = await letter.wrapLetterArgs(buildRepairLetter({ ...LETTERS.psd, defect: pasted }))
    const findings = prepared.paragraphs[1]
    const lines = (findings.lines ?? []).map((l) => ({ text: l.runs.map((r) => r.text).join(''), spacing: l.letterSpacing }))
    expect(lines.some((l) => l.text.includes('\n'))).toBe(false)
    const handEnded = lines.filter((l) => l.text.endsWith('วัดบ้านต้นกระบก') || l.text.endsWith('ไฟฟ้าขัดข้อง'))
    expect(handEnded).toHaveLength(2)
    expect(handEnded.map((l) => l.spacing)).toEqual([0, 0])
    // The very next line starts at the typed break, at the margin.
    expect(lines[lines.indexOf(handEnded[0]) + 1].text.startsWith('สาเหตุเบื้องต้น')).toBe(true)
    // Lines the wrapper broke itself are still justified to the margin.
    expect(lines.slice(0, -1).filter((l) => !handEnded.includes(l)).some((l) => l.spacing > 0)).toBe(true)
  }, 60_000)
})

describe('reasonCharBudget', () => {
  it('is the exact one-sheet limit for the text being typed', async () => {
    const input = { ...LETTERS.psd, defect: REASON }
    const budget = (await budgets.reasonCharBudget(input)) as number
    expect(budget).toBeGreaterThan(0)
    expect(budget).toBeLessThan(REASON.length)
    expect(await sheets(await prepare(LETTERS.psd, budget))).toBe(1)
    expect(await sheets(await prepare(LETTERS.psd, budget + 1))).toBe(2)
  }, 60_000)

  it('depends on the rest of the letter, not just the reason', async () => {
    const long = (await budgets.reasonCharBudget(LETTERS.long)) as number
    const psd = (await budgets.reasonCharBudget(LETTERS.psd)) as number
    const short = (await budgets.reasonCharBudget(LETTERS.short)) as number
    expect(long).toBeLessThan(psd)
    expect(psd).toBeLessThan(short)
  }, 60_000)

  it('gives up when a newer keystroke makes it stale', async () => {
    expect(await budgets.reasonCharBudget(LETTERS.psd, () => true)).toBeNull()
  }, 60_000)

  it('follows the typing a step at a time — no climbing per keystroke, then dropping a word', async () => {
    // Typed one character at a time into 434's letter. Counting the room by
    // trying prose word by word made the number climb one per keystroke and
    // drop a whole word — 414 before typing, 416 after "ฟห" (user 2026-10-06).
    const typing = 'ฟหกด ตรวจพบกล้องโทรทัศน์วงจรปิด (CCTV) จำนวน 1 ตัว บริเวณสายทาง ลบ.4040'
    const seen: number[] = []
    for (let n = 0; n <= typing.length; n++) seen.push((await budgets.reasonCharBudget({ ...TIGHT, defect: typing.slice(0, n) })) as number)
    const steps = seen.slice(1).map((v, i) => v - seen[i])
    expect(Math.max(...steps.map(Math.abs))).toBeLessThanOrEqual(2)
    // the sawtooth's mark: a run of keystrokes that each add one
    const climbs = steps.map((d) => (d > 0 ? 'u' : '.')).join('')
    expect(climbs).not.toContain('uuu')
  }, 120_000)

  it('agrees with the printed letter about where the closing lands', async () => {
    // Over the limit the number is exact; under it, it never claims less room
    // than is typed — so the counter is red exactly when the letter carries.
    for (const length of [100, 300, 340, 341, 345, 400]) {
      const input = { ...TIGHT, defect: REASON.slice(0, length) }
      const budget = (await budgets.reasonCharBudget(input)) as number
      const carried = (await finalSheets(await letter.wrapLetterArgs(await budgets.printableRepairLetter(input)))) > 1
      expect(length > budget).toBe(carried)
    }
  }, 120_000)

  it('brings the closing down only for a letter with under 20 characters of room', async () => {
    expect(budgets.CLOSING_DROP_UNDER).toBe(20)
    // Kept where the form puts it, this letter has no room for a reason at all.
    expect(letter.closingFitsFirstPage(await prepare(TIGHT, 1))).toBe(false)
    const budget = (await budgets.reasonCharBudget({ ...TIGHT, defect: REASON })) as number
    expect(budget).toBeGreaterThan(budgets.CLOSING_DROP_UNDER)
    // Printed the way the hint promised: the budget on page 1, one more carried.
    const printed = async (length: number) =>
      letter.wrapLetterArgs(await budgets.printableRepairLetter({ ...TIGHT, defect: REASON.slice(0, length) }))
    const atBudget = await printed(budget)
    expect(atBudget.closingMayDrop).toBe(true)
    expect(await finalSheets(atBudget)).toBe(1)
    expect(await finalSheets(await printed(budget + 1))).toBe(2)
    // A letter with room keeps the form's layout: past its budget, page 2.
    const roomy = await budgets.printableRepairLetter({ ...LETTERS.long, defect: REASON })
    expect(roomy.closingMayDrop).toBe(false)
  }, 120_000)

  it('keeps case C-20261006-0002 on one sheet — its closing set was alone on page 2', async () => {
    // Its reason as filed: four lines past the form's limit, two past the room
    // under the footer — the signing room takes up the rest.
    const filed = 'ตรวจพบกล้องโทรทัศน์วงจรปิด (CCTV) จำนวน 1 ตัว บริเวณสายทาง ลบ.4040 กม.4+980 จุดติดตั้งที่ 5 ' +
      'ทิศทางมุ่งหน้าบ้านบารมีธรรม น้ำตกวังก้านเหลือง อยู่ในสถานะออฟไลน์ (Offline) ไม่สามารถรับชมภาพและส่งสัญญาณภาพ' +
      'เข้าสู่ระบบส่วนกลางได้ตามปกติ เบื้องต้นเจ้าหน้าที่ได้ตรวจสอบสถานะการเชื่อมต่อของกล้องและอุปกรณ์เครือข่ายที่เกี่ยวข้องแล้ว ' +
      'พบว่ายังไม่สามารถเรียกดูภาพจากกล้องดังกล่าวได้ จึงขอให้ผู้รับจ้างดำเนินการตรวจสอบและแก้ไขโดยเร็ว'
    const args = await letter.wrapLetterArgs(await budgets.printableRepairLetter({ ...TIGHT, letterNo: 'คค 42/2569', defect: filed }))
    expect(letter.firstPageOverflow(args)).toBeGreaterThan(28)
    expect(await finalSheets(args)).toBe(1)
  }, 60_000)
})
