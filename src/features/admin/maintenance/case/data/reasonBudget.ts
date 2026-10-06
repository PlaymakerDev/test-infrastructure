import type { ExportLetterPdfArgs } from '@/utils/export/letterPdf'
import type { RepairLetterInput } from './repairLetter'

// Stand-in for what the officer has yet to type: ordinary reason prose (Thai
// with the odd Latin word and digit). Only what comes after the typed text is
// measured with it.
const FILLER =
  'ตรวจพบกล้องโทรทัศน์วงจรปิด (CCTV) อยู่ในสถานะออฟไลน์ ไม่สามารถรับชมภาพ' +
  'และส่งสัญญาณภาพเข้าสู่ระบบส่วนกลางได้ตามปกติ ขอให้ผู้รับจ้างตรวจสอบและแก้ไขโดยเร็ว '

/** A letter that, with its closing block where the department's form puts it,
 *  has room for fewer characters of reason than this lets the block come down
 *  to the foot of the paper instead, then tighten its room to sign (user
 *  2026-10-06) — a long project name can leave no room at all (solution 434:
 *  none). A letter with more room keeps the form's layout, and the block goes
 *  to page 2 once the reason outgrows it. */
export const CLOSING_DROP_UNDER = 20

// The rest of the letter, wrapped once and reused while only the reason
// changes — wrapping the whole letter costs ~85 ms, one paragraph ~25 ms.
// `index` is the paragraph that carries the reason, `start` where in its text
// the reason begins.
let cached: { key: string; wrapped: ExportLetterPdfArgs; index: number; start: number } | null = null

/** THIS letter with any reason in place — its closing block kept where the
 *  form puts it, or (`drop`) allowed to come down. */
interface ReasonLayout {
  /** Whether the closing block stays on the first sheet. */
  fits: (reason: string, drop: boolean) => Promise<boolean>
  /** How much more text (pt of body line) fits in after the reason before the
   *  closing block is carried — see paragraphRoom. */
  room: (reason: string, drop: boolean, lineEndWaste: number) => Promise<number>
}

/** null = the letter has no reason paragraph. */
async function reasonLayout(input: RepairLetterInput): Promise<ReasonLayout | null> {
  const [{ buildRepairLetter }, { wrapLetterArgs, wrapLetterParagraph, closingFitsFirstPage, paragraphRoom }] = await Promise.all([
    import('./repairLetter'),
    import('@/utils/export/letterPdf'),
  ])
  const key = JSON.stringify({ ...input, defect: undefined, caseNo: undefined, deviceStatusImages: undefined })
  if (cached?.key !== key) {
    // The paragraph that carries the reason: the one that changes with it.
    const a = buildRepairLetter({ ...input, defect: 'ก' }).paragraphs
    const b = buildRepairLetter({ ...input, defect: 'ขข' }).paragraphs
    const index = a.findIndex((p, i) => p.text !== b[i]?.text)
    let start = 0
    while (index >= 0 && a[index].text[start] === b[index].text[start]) start++
    cached = { key, index, start, wrapped: await wrapLetterArgs(buildRepairLetter({ ...input, defect: 'ก' })) }
  }
  const { wrapped, index, start } = cached
  if (index < 0) return null
  const withReason = async (reason: string, drop: boolean): Promise<ExportLetterPdfArgs> => {
    const paragraph = await wrapLetterParagraph(buildRepairLetter({ ...input, defect: reason }).paragraphs[index])
    return { ...wrapped, paragraphs: wrapped.paragraphs.map((p, i) => (i === index ? paragraph : p)), closingMayDrop: drop }
  }
  return {
    fits: async (reason, drop) => closingFitsFirstPage(await withReason(reason, drop)),
    // The letter prints the reason trimmed (buildRepairLetter), so it ends there.
    room: async (reason, drop, lineEndWaste) =>
      paragraphRoom(await withReason(reason, drop), index, { at: start + reason.trim().length, lineEndWaste }),
  }
}

/** The reason as typed, then ordinary prose for what is still to come. */
const reasonText = (input: RepairLetterInput) => (input.defect ?? '') + FILLER.repeat(Math.ceil(2000 / FILLER.length))

/** Whether this letter's closing block may come down to make room: kept where
 *  the form puts it, it leaves room for fewer than CLOSING_DROP_UNDER
 *  characters of reason. Measured on the reason as typed — padded out with
 *  prose while shorter — the same way for the hint and for the printed letter,
 *  so the letter prints the way the hint said it would. */
const closingMayDrop = async (layout: ReasonLayout, input: RepairLetterInput) =>
  !(await layout.fits(reasonText(input).slice(0, CLOSING_DROP_UNDER), false))

// How ordinary prose fills the body (bodyProseMetrics) — measured once.
let proseMetrics: Promise<{ perChar: number; lineEndWaste: number } | null> | null = null
const ordinaryProse = () => {
  proseMetrics ??= import('@/utils/export/letterPdf').then(({ bodyProseMetrics }) => bodyProseMetrics(FILLER.repeat(6)))
  return proseMetrics
}

/** How many characters เหตุผลการแจ้งซ่อม can run to before the letter's
 *  closing block (ขอแสดงความนับถือ → room to sign → footer) is carried to
 *  page 2 — for THIS letter. The first sheet holds a fixed number of text lines
 *  (18 today), and the rest of the letter — project and contractor names, the
 *  budget in words, the coordinator — decides how many are left for the
 *  reason: measured 2026-10-05 at 65 to 324 characters across projects, so it
 *  can't be one printed number. Under CLOSING_DROP_UNDER it counts the room the
 *  block gets by coming down.
 *
 *  It follows the typing: what is typed counts as typed; past it, the room
 *  left on the page — in pt, lines and the last line's end — holds as many
 *  characters as ordinary prose takes to fill it. Once the closing would be
 *  carried, it is the exact length of what is typed that still fits.
 *  (Counting the room by trying ordinary prose word by word, as it did first,
 *  made the number lurch: up one per keystroke, then down a whole word — 414
 *  before typing, 416 after two characters; user 2026-10-06.)
 *
 *  `isStale` lets a newer keystroke abandon it (→ null). null also = the letter
 *  has no reason paragraph. */
export async function reasonCharBudget(
  input: RepairLetterInput,
  isStale: () => boolean = () => false,
): Promise<number | null> {
  const layout = await reasonLayout(input)
  if (!layout) return null
  const typed = input.defect ?? ''
  const drop = await closingMayDrop(layout, input)
  // An empty reason prints as a dotted fill-in, so nothing typed is measured as
  // typing has just begun: one character of ordinary prose.
  const measured = typed || FILLER.slice(0, 1)
  const prose = await ordinaryProse()
  if (!prose) return null
  const room = await layout.room(measured, drop, prose.lineEndWaste)
  if (isStale()) return null
  if (room >= 0) return measured.length + Math.floor(room / prose.perChar)
  // Carried already: the longest beginning of what is typed that still fits.
  let lo = 0
  let hi = typed.length - 1
  while (lo < hi) {
    await new Promise((resolve) => setTimeout(resolve, 0))
    if (isStale()) return null
    const mid = Math.ceil((lo + hi) / 2)
    if (await layout.fits(typed.slice(0, mid), drop)) lo = mid
    else hi = mid - 1
  }
  return Math.max(lo, 0)
}

/** The repair letter as it prints: buildRepairLetter, plus whether its closing
 *  block may come down — decided the way reasonCharBudget decided it. Every
 *  preview and download of the letter goes through here. */
export async function printableRepairLetter(input: RepairLetterInput): Promise<ExportLetterPdfArgs> {
  const [{ buildRepairLetter }, layout] = await Promise.all([import('./repairLetter'), reasonLayout(input)])
  return { ...buildRepairLetter(input), closingMayDrop: layout ? await closingMayDrop(layout, input) : false }
}
