import dayjs from 'dayjs'
import type { ExportLetterPdfArgs } from '@/utils/export/letterPdf'
import { thaiLetterDate, toThaiDigits } from '@/utils/export/letterPdf'

/**
 * Builds the หนังสือขอให้ซ่อมแซมอุปกรณ์ชำรุดบกพร่องระหว่างค้ำประกันสัญญา that the
 * Maintenance Case screen's "นำออกเอกสาร" now produces — the ministry's real
 * outgoing-letter format, not the generic block report.
 *
 * The export is the ONE-PAGE letter and nothing else: no สิ่งที่ส่งมาด้วย head
 * line and no detail/photo sheet behind it (dropped 2026-08-24 — the department
 * doesn't attach them). Case fields that aren't part of the letter's own
 * sentences are therefore not exported at all; don't reintroduce an enclosure
 * to carry them.
 *
 * Everything the backend can't supply (ที่ running number, ผู้ลงนาม, the
 * coordinator's name/phone) is left as a dotted fill-in line, exactly as the
 * paper draft does, so the officer completes it after printing.
 */

/** Sender letterhead — สำนักอำนวยความปลอดภัย, กรมทางหลวงชนบท. */
const SENDER_ADDRESS = [
  'สำนักอำนวยความปลอดภัย',
  'เลขที่ ๙ ถนนพหลโยธิน',
  'แขวงอนุสาวรีย์ เขตบางเขน',
  'กรุงเทพฯ ๑๐๒๒๐',
]

const FOOTER_LINES = [
  'กลุ่มวิชาการและแผนงาน',
  'โทรศัพท์ ๐ ๒๕๕๑ ๕๓๑๔',
  'ไปรษณีย์อิเล็กทรอนิกส์ saraban@drr.go.th',
  'www.drr.go.th',
]

const TAGLINE = '“ทช.โปร่งใส ใส่ใจคุณธรรม นำความซื่อสัตย์ ขจัดการทุจริต”'

/** Dotted fill-in for a field no endpoint provides. */
const BLANK = '.'.repeat(48)
const blank = (dots: number) => '.'.repeat(dots)

/** '-' / '' from the API must never reach the letter body — a sentence reading
 *  "ติดตั้งบริเวณ -" is worse than dropping the clause. */
const has = (value: string | null | undefined): boolean =>
  !!value && value.trim() !== '' && value.trim() !== '-'
const text = (value: string | null | undefined, fallback = BLANK): string =>
  has(value) ? (value as string).trim() : fallback

/** Same as `text`, but ๐-๙. Everything the officer typed reads back in Thai
 *  numerals like every other slot in the letter — the department's letters
 *  never mix "จำนวน 9 จุด" into a page of ๓๔,๙๘๐,๐๐๐ (user 2026-09-22). */
const thaiText = (value: string | null | undefined, fallback = BLANK): string =>
  has(value) ? toThaiDigits((value as string).trim()) : fallback

/** Thai baht in words for the ¶1 parenthetical — "๑,๒๕๐,๐๐๐.๐๐ บาท
 *  (หนึ่งล้านสองแสนห้าหมื่นบาทถ้วน)". Standard Thai reading rules: ๑ in the
 *  tens place is "สิบ" (not "หนึ่งสิบ"), ๒ is "ยี่สิบ", a trailing ๑ after a
 *  non-empty tens is "เอ็ด", and every 6 digits repeats with "ล้าน". */
const THAI_DIGIT_WORDS = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า']
const THAI_PLACE_WORDS = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน']

const readThaiGroup = (group: string): string => {
  let out = ''
  const len = group.length
  for (let i = 0; i < len; i++) {
    const digit = Number(group[i])
    if (digit === 0) continue
    const place = len - i - 1
    if (place === 1 && digit === 1) out += 'สิบ'
    else if (place === 1 && digit === 2) out += 'ยี่สิบ'
    else if (place === 0 && digit === 1 && len > 1) out += 'เอ็ด'
    else out += THAI_DIGIT_WORDS[digit] + THAI_PLACE_WORDS[place]
  }
  return out
}

export const thaiBahtText = (amount: number): string => {
  if (!Number.isFinite(amount) || amount < 0) return ''
  const [bahtPart, satangPart] = amount.toFixed(2).split('.')
  let digits = bahtPart
  const groups: string[] = []
  while (digits.length > 6) {
    groups.unshift(digits.slice(-6))
    digits = digits.slice(0, -6)
  }
  groups.unshift(digits)
  const baht = groups.reduce((acc, g, i) => {
    const readGroup = readThaiGroup(g)
    // A group of zeroes still needs its "ล้าน" so 1,000,000 doesn't read as "หนึ่ง".
    if (!readGroup && i < groups.length - 1) return acc + 'ล้าน'
    return acc + readGroup + (i < groups.length - 1 ? 'ล้าน' : '')
  }, '') || 'ศูนย์'
  const satang = Number(satangPart)
  return satang > 0 ? `${baht}บาท${readThaiGroup(satangPart)}สตางค์` : `${baht}บาทถ้วน`
}

/** Non-breaking space — see glueLeaders in pdf.tsx. Joining a phone's groups
 *  with these keeps the whole number on one line; a normal space let the
 *  wrapper split "๐ ๒๕๕๑ / ๕๓๑๔" across two lines. */
const NBSP = ' '

const fromThaiDigits = (value: string): string =>
  value.replace(/[๐-๙]/g, (d) => String('๐๑๒๓๔๕๖๗๘๙'.indexOf(d)))

/** เบอร์โทรศัพท์ตามรูปแบบราชการ, whatever the officer typed:
 *   - ๙ หลัก (เบอร์บ้าน/สำนักงาน)  → ๐ ๒๕๕๑ ๕๓๑๔
 *   - ๑๐ หลัก (มือถือ ๐๖/๐๘/๐๙)    → ๐๘๑ ๒๓๔ ๕๖๗๘
 *  A "ต่อ <เลขที่>" tail is kept and joined on. Anything whose digit count
 *  isn't 9 or 10 is printed exactly as typed — better a number in the
 *  officer's own format than a confidently wrong regrouping.
 */
export const formatLetterPhone = (raw: string): string => {
  const asTyped = toThaiDigits(raw.trim())
  const [main, ...tail] = raw.split('ต่อ')
  // Reformat ONLY a bare number. Anything else the officer wrote — a label, a
  // second number, a note — must survive verbatim; stripping non-digits would
  // silently delete it.
  if (!/^[\s\d\-().๐-๙]+$/.test(main)) return asTyped

  const digits = fromThaiDigits(main).replace(/\D/g, '')
  // Keep the officer's own separator: they type the letter, and a hyphenated
  // number is how plenty of them write it (user 2026-09-22). Grouping is still
  // normalised. A numeric hyphen is a no-break point in the wrapper, so either
  // separator keeps the number on one line.
  const sep = main.includes('-') ? '-' : NBSP
  // Prefix-checked so a mistyped number isn't confidently regrouped: Thai
  // landlines are 9 digits on area codes ๐๒–๐๗, mobiles 10 digits on ๐๖/๐๘/๐๙.
  const grouped =
    digits.length === 9 && /^0[2-7]/.test(digits)
      ? [digits.slice(0, 1), digits.slice(1, 5), digits.slice(5)].join(sep)
      : digits.length === 10 && /^0[689]/.test(digits)
        ? [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6)].join(sep)
        : null
  if (!grouped) return asTyped

  const ext = tail.join('ต่อ').trim()
  return toThaiDigits(ext ? `${grouped}${NBSP}ต่อ${NBSP}${ext}` : grouped)
}

/** "5,000,000" / "5000000.50" → 5000000.5; anything unparseable → null. */
const parseAmount = (value: string | null | undefined): number | null => {
  if (!has(value)) return null
  const n = Number(String(value).replace(/[, ]/g, ''))
  return Number.isFinite(n) ? n : null
}

const thaiAmount = (value: string | null | undefined): string | null => {
  const n = parseAmount(value)
  if (n === null) return null
  const figures = toThaiDigits(n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
  return `${figures} บาท (${thaiBahtText(n)})`
}

/** Only what the letter still reads. With paragraphs 1 and 2 fixed (see
 *  PARAGRAPH_1_FIXED / PARAGRAPH_2_FIXED) the live fields are down to three:
 *  the case no for the file name, and ผู้รับจ้าง + เลขที่สัญญา for the เรียน and
 *  อ้างถึง head lines. The screen's `problem` / `device` / `projectName` /
 *  `agency` inputs were dropped rather than left unread — the comment in
 *  buildRepairLetter lists exactly what to pass back in when the body goes
 *  dynamic again.
 *
 *  Optional fields are variable slots no endpoint the case screen calls can
 *  fill yet; they render as dotted fill-ins and light up as soon as the backend
 *  sends them. */
export interface RepairLetterInput {
  caseNo: string
  project: {
    contractor: string
    contractNo: string
    /** Recited in ¶1 and ¶2. */
    projectName?: string
  }
  /** 'ลงวันที่' of the referenced contract, as a RAW date — the builder renders
   *  it "๑๔ กันยายน ๒๕๖๙" (full month; abbreviations are not งานสารบรรณ form).
   *  The project record has no contract date of its own, so the department uses
   *  `warranty_start_date` (user 2026-09-18) — the warranty starts when the
   *  contract is accepted. */
  contractDate?: string | Date | null

  // ── From the officer's หนังสือแจ้งซ่อม form (/case/new, 2026-09-11 redesign).
  // Only `reason` and `dueDate` survive a reload today — the rest have no
  // backend columns yet, so re-downloading the letter from the case page prints
  // them as dotted fill-ins again. ⚠ PENDING BE.
  /** เลขที่หนังสือแจ้งซ่อม → the "ที่" line. */
  letterNo?: string
  /** ลงวันที่แจ้งซ่อม → the centred date line. Without it the letter would be
   *  dated the day it was downloaded, so a re-print would disagree with the
   *  copy already sent to the contractor. */
  letterDate?: string | Date | null
  /** วงเงินของโครงการ → ¶1 วงเงินค่าก่อสร้าง (figures + Thai words). */
  budget?: string
  /** เหตุผลการแจ้งซ่อม / ปัญหาที่พบ → ¶2 defect description. */
  defect?: string
  /** ประเภทอุปกรณ์ที่ชำรุด → ¶2 (e.g. "กล้องโทรทัศน์วงจรปิด (CCTV)"). */
  deviceType?: string
  /** ลงวันที่ดำเนินการแล้วเสร็จ → ¶2 ภายในวันที่. RAW date — rendered full-month
   *  like every other date on the letter. */
  deadline?: string | Date | null
  /** ตามสัญญาจ้างข้อที่ → ¶3 cost-recovery clause (defaults to ๘). */
  contractClause?: string

  // ── Coordinator (paragraph 3) — the form's มอบหมายให้ / ตำแหน่ง / ติดต่อ.
  coordinatorName?: string
  coordinatorPosition?: string
  coordinatorPhone?: string

  /** รูปภาพสถานะการทำงานของอุปกรณ์ — appended as a sheet behind the letter.
   *  Either the officer's own uploads or the contact sheet the backend builds
   *  from the cameras' live frames. */
  deviceStatusImages?: string[]
}

export function buildRepairLetter(input: RepairLetterInput): ExportLetterPdfArgs {
  const { caseNo, project } = input

  const contractor = thaiText(project.contractor, blank(26))
  const contractDate = thaiLetterDate(input.contractDate)
  const deadline = thaiLetterDate(input.deadline)

  // อ้างถึง
  const contractRef =
    `สัญญาจ้างก่อสร้างเลขที่ ${has(project.contractNo) ? toThaiDigits(project.contractNo) : blank(18)}` +
    ` ลงวันที่ ${contractDate || blank(18)}`

  // ── Paragraphs 1 and 2: the department's wording (2026-08-26), with every
  // slot the officer's หนังสือแจ้งซ่อม form now fills substituted in. Each slot
  // keeps its dotted fill-in when the value is missing, so the letter still
  // prints as the paper form for anything the system can't supply — which is
  // what the department asked for while the data didn't exist.
  // No literal "โครงการ" before the name: the officer types the word themselves
  // when it belongs there, and the letter was reading "โครงการ โครงการ …"
  // (user 2026-09-22).
  const intro =
    `ตามสัญญาจ้างที่อ้างถึง ${contractor} เป็นผู้รับจ้าง ` +
    `${thaiText(input.project.projectName, blank(30))} ` +
    `วงเงินค่าก่อสร้าง ${thaiAmount(input.budget) ?? `${blank(14)} บาท (${blank(20)})`} นั้น`

  const findings =
    'สำนักอำนวยความปลอดภัย ได้ดำเนินการตรวจสอบสภาพสิ่งก่อสร้างในระหว่างค้ำประกันสัญญา ' +
    // No spaces around these two slots: Thai doesn't space a noun from its
    // qualifier, so the sentence has to read "อุปกรณ์กล้องโทรทัศน์วงจรปิดของ
    // โครงการ…" as one phrase (user 2026-09-22).
    `ปรากฏว่าอุปกรณ์${thaiText(input.deviceType, blank(15))}` +
    `ของ${thaiText(input.project.projectName, blank(22))} ` +
    `ไม่สามารถใช้งานได้ตามปกติ ${thaiText(input.defect, blank(27))} ` +
    'ซึ่งอุปกรณ์ดังกล่าวอยู่ในระหว่างค้ำประกันสัญญา ' +
    `จึงขอให้ ${contractor} ดำเนินการซ่อมแซมอุปกรณ์ดังกล่าวให้อยู่ในสภาพเรียบร้อยใช้งานได้ดี ` +
    `ภายในวันที่ ${deadline || blank(16)}`

  // ── Paragraph 3: the coordinator + the cost-recovery clause.
  // The consequence clause prints BOLD (user 2026-09-22) — it is the part the
  // contractor is being held to, and the department emphasises it on paper.
  const enforcement =
    'กรมทางหลวงชนบทจะพิจารณาดำเนินการซ่อมแซมเองหรือจ้างซ่อมแล้วแต่กรณี ' +
    'โดยผู้รับจ้างจะต้องรับผิดชอบชำระค่าใช้จ่ายทั้งหมด ' +
    `ตามสัญญาจ้างข้อ ${has(input.contractClause) ? toThaiDigits(input.contractClause!.trim()) : '๘'}`

  const coordination =
    `ทั้งนี้ ได้มอบหมายให้ ${thaiText(input.coordinatorName, blank(22))}` +
    ` ${thaiText(input.coordinatorPosition, blank(18))}` +
    ` โทร. ${has(input.coordinatorPhone) ? formatLetterPhone(input.coordinatorPhone!) : blank(16)}` +
    ' เป็นผู้ประสานงานในการซ่อมแซมครั้งนี้ หากพ้นกำหนดนี้แล้วยังไม่ดำเนินการซ่อมแซม' +
    'หรือดำเนินการไม่แล้วเสร็จ ' + enforcement

  const closingPara =
    'จึงเรียนมาเพื่อโปรดดำเนินการ โดยให้ประสานงานเพื่อกำหนดวิธีการซ่อมแซม ' +
    'พร้อมทั้งกำหนดวันที่เข้าดำเนินการซ่อม'

  return {
    filenameBase: `หนังสือขอให้ซ่อมแซม_${caseNo}`,
    // The officer types the whole running number (เช่น คค 0729.2/2569); the
    // department's default prefix stays for a letter issued without one.
    refNo: has(input.letterNo) ? `ที่ ${toThaiDigits(input.letterNo!.trim())}` : 'ที่ คค ๐๗๐๒.๒/',
    senderAddress: SENDER_ADDRESS,
    date: thaiLetterDate(input.letterDate ? dayjs(input.letterDate) : dayjs()),
    fields: [
      { label: 'เรื่อง', value: 'ขอให้ซ่อมแซมอุปกรณ์ชำรุดบกพร่องระหว่างค้ำประกันสัญญา' },
      { label: 'เรียน', value: contractor },
      { label: 'อ้างถึง', value: contractRef },
    ],
    paragraphs: [
      { text: intro },
      { text: findings },
      { text: coordination, bold: enforcement },
      { text: closingPara },
    ],
    closing: 'ขอแสดงความนับถือ',
    // No signer block — the department signs the printed letter by hand and
    // didn't want the dotted name/position lines (user 2026-09-18).
    footerLines: FOOTER_LINES,
    tagline: TAGLINE,
    attachments: input.deviceStatusImages?.length
      ? [{ title: 'รูปภาพสถานะการทำงานของอุปกรณ์', images: input.deviceStatusImages }]
      : undefined,
  }
}
