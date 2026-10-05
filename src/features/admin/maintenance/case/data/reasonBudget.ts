import type { ExportLetterPdfArgs } from '@/utils/export/letterPdf'
import type { RepairLetterInput } from './repairLetter'

// Stand-in for what the officer has yet to type: ordinary reason prose (Thai
// with the odd Latin word and digit). Only what comes after the typed text is
// measured with it.
const FILLER =
  'ตรวจพบกล้องโทรทัศน์วงจรปิด (CCTV) อยู่ในสถานะออฟไลน์ ไม่สามารถรับชมภาพ' +
  'และส่งสัญญาณภาพเข้าสู่ระบบส่วนกลางได้ตามปกติ ขอให้ผู้รับจ้างตรวจสอบและแก้ไขโดยเร็ว '

// The rest of the letter, wrapped once and reused while only the reason
// changes — wrapping the whole letter costs ~85 ms, one paragraph ~25 ms.
let cached: { key: string; wrapped: ExportLetterPdfArgs; index: number } | null = null

/** How many characters เหตุผลการแจ้งซ่อม can run to before the letter's
 *  closing block (ขอแสดงความนับถือ → room to sign → footer) is carried to
 *  page 2 — for THIS letter. The first sheet holds a fixed number of text lines
 *  (18 today), and the rest of the letter — project and contractor names, the
 *  budget in words, the coordinator — decides how many are left for the
 *  reason: measured 2026-10-05 at 65 to 324 characters across projects, so it
 *  can't be one printed number. The typed text is measured as typed; past it,
 *  ordinary prose stands in for what comes next.
 *
 *  Runs one measuring step at a time and hands the thread back between them,
 *  so it can follow the officer's typing; `isStale` lets a newer keystroke
 *  abandon it (→ null). null also = the letter has no reason paragraph. */
export async function reasonCharBudget(
  input: RepairLetterInput,
  isStale: () => boolean = () => false,
): Promise<number | null> {
  const [{ buildRepairLetter }, { wrapLetterArgs, wrapLetterParagraph, closingFitsFirstPage }] = await Promise.all([
    import('./repairLetter'),
    import('@/utils/export/letterPdf'),
  ])
  const { defect = '', ...rest } = input
  const key = JSON.stringify({ ...rest, caseNo: undefined, deviceStatusImages: undefined })
  if (cached?.key !== key) {
    // The paragraph that carries the reason: the one that changes with it.
    const a = buildRepairLetter({ ...rest, defect: 'ก' }).paragraphs
    const b = buildRepairLetter({ ...rest, defect: 'ขข' }).paragraphs
    const index = a.findIndex((p, i) => p.text !== b[i]?.text)
    cached = { key, index, wrapped: await wrapLetterArgs(buildRepairLetter({ ...rest, defect: 'ก' })) }
  }
  const { wrapped, index } = cached
  if (index < 0) return null

  const text = defect + FILLER.repeat(Math.ceil(2000 / FILLER.length))
  const fits = async (length: number) => {
    const reasonParagraph = buildRepairLetter({ ...rest, defect: text.slice(0, length) }).paragraphs[index]
    const paragraph = await wrapLetterParagraph(reasonParagraph)
    return closingFitsFirstPage({ ...wrapped, paragraphs: wrapped.paragraphs.map((p, i) => (i === index ? paragraph : p)) })
  }
  // Largest length that still fits (0 = even one character carries it over).
  let lo = 0
  let hi = text.length
  while (lo < hi) {
    await new Promise((resolve) => setTimeout(resolve, 0))
    if (isStale()) return null
    const mid = Math.ceil((lo + hi) / 2)
    if (await fits(mid)) lo = mid
    else hi = mid - 1
  }
  return lo
}
