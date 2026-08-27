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
  'โทรศัพท์ ๐ ๒๕๕๑ ๕๓๙๔',
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

/** Paragraphs 1 and 2, supplied verbatim by the department 2026-08-26 and
 *  printed as-is. Every dotted run is part of the given text — the department
 *  wants the letter to print as a fill-in form until the backend can supply the
 *  contract recital and the defect details. See the note in buildRepairLetter
 *  for what to substitute when these go dynamic.
 *  (Declared AFTER `blank` — these are consts, not hoisted declarations.) */
const PARAGRAPH_1_FIXED =
  'ตามสัญญาจ้างที่อ้างถึง ....................... เป็นผู้รับจ้าง ' +
  'โครงการบริหารจัดการลำดับชั้นทางหลวงและยกระดับความปลอดภัย ' +
  'ถนนสาย กพ.๑๐๐๒ ฝั่งเมืองรวมเมืองกำแพงเพชร อ.เมืองกำแพงเพชร จ.กำแพงเพชร ๑ แห่ง ' +
  'วงเงินค่าก่อสร้าง ๓๙,๘๙๐,๐๐๐.๐๐ บาท (สามสิบเก้าล้านแปดแสนเก้าหมื่นบาทถ้วน) นั้น'

const PARAGRAPH_2_FIXED =
  'สำนักอำนวยความปลอดภัย ได้ดำเนินการตรวจสอบสภาพสิ่งก่อสร้างในระหว่างค้ำประกันสัญญา ' +
  // อุปกรณ์ <device type> ของ <project + road>
  `ปรากฏว่าอุปกรณ์ ${blank(15)} ของ ${blank(22)} ` +
  // <defect description>
  `ไม่สามารถใช้งานได้ตามปกติ ${blank(27)} ` +
  'ซึ่งอุปกรณ์ดังกล่าวอยู่ในระหว่างค้ำประกันสัญญา ' +
  // จึงขอให้ <contractor> … ภายในวันที่ <deadline>
  `จึงขอให้ ${blank(23)} ดำเนินการซ่อมแซมอุปกรณ์ดังกล่าวให้อยู่ในสภาพเรียบร้อยใช้งานได้ดี ` +
  `ภายในวันที่ ${blank(16)}`

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
  }
  /** 'ลงวันที่' of the referenced contract — /manage/project has no such date. */
  contractDate?: string

  // ── Coordinator (paragraph 3) ──
  // Staff details live outside the ITS database entirely.
  coordinatorName?: string
  coordinatorPosition?: string
  coordinatorPhone?: string
}

export function buildRepairLetter(input: RepairLetterInput): ExportLetterPdfArgs {
  const { caseNo, project } = input

  const contractor = text(project.contractor, blank(26))

  // อ้างถึง
  const contractRef =
    `สัญญาจ้างก่อสร้างเลขที่ ${has(project.contractNo) ? toThaiDigits(project.contractNo) : blank(18)}` +
    ` ลงวันที่ ${input.contractDate ? toThaiDigits(input.contractDate) : blank(18)}`

  // ── Paragraphs 1 and 2: FIXED TEXT, verbatim from the department (2026-08-26).
  // Deliberately NOT built from `input`. The contract recital needs อำเภอ,
  // จังหวัด, จำนวนแห่ง and วงเงินค่าก่อสร้าง (figures AND words); paragraph 2
  // needs ประเภทอุปกรณ์, the project/road recital, the defect description and a
  // กำหนดวันซ่อมแซม. Almost none of that exists in the ITS schema
  // (/manage/project carries only budget_year, tbl_maintenance_case has no
  // due-date column), so the department asked for their wording printed as a
  // fill-in form instead.
  //
  // TO MAKE THESE DYNAMIC, the slots to substitute are:
  //   ¶1  ผู้รับจ้าง (available: `contractor`) · ชื่อโครงการ · สายทาง · อ. · จ. ·
  //       จำนวนแห่ง · วงเงินค่าก่อสร้าง · วงเงินเป็นตัวหนังสือ
  //   ¶2  ประเภทอุปกรณ์ (cctv → 'กล้องโทรทัศน์วงจรปิด') · โครงการ+สายทาง ·
  //       รายละเอียดที่ชำรุด (the case's ปัญหาที่พบ, plus the offline date/duration
  //       the screen already resolves) · ผู้รับจ้าง · กำหนดวันซ่อมแซม
  // The screen's `problem` / `device` / `project.projectName` inputs were
  // removed from RepairLetterInput when this went fixed — pass them back in.
  const intro = PARAGRAPH_1_FIXED
  const findings = PARAGRAPH_2_FIXED

  // ── Paragraph 3: the coordinator + the cost-recovery clause.
  const coordination =
    `ทั้งนี้ ได้มอบหมายให้ ${text(input.coordinatorName, blank(22))}` +
    ` ${text(input.coordinatorPosition, blank(18))}` +
    ` โทร. ${input.coordinatorPhone ? toThaiDigits(input.coordinatorPhone) : blank(16)}` +
    ' เป็นผู้ประสานงานในการซ่อมแซมครั้งนี้ หากพ้นกำหนดนี้แล้วยังไม่ดำเนินการซ่อมแซม' +
    'หรือดำเนินการแล้วไม่เสร็จ กรมทางหลวงชนบทจะพิจารณาดำเนินการซ่อมแซมเองหรือจ้างซ่อมแล้วแต่กรณี ' +
    'โดยผู้รับจ้างจะต้องรับผิดชอบชำระค่าใช้จ่ายทั้งหมด ตามสัญญาจ้างข้อ ๘'

  const closingPara =
    'จึงเรียนมาเพื่อโปรดดำเนินการ โดยให้ประสานงานเพื่อกำหนดวิธีการซ่อมแซม ' +
    'พร้อมทั้งกำหนดวันที่เข้าดำเนินการซ่อม'

  return {
    filenameBase: `หนังสือขอให้ซ่อมแซม_${caseNo}`,
    refNo: `ที่ คค ๐๗๐๒.๒/`,
    senderAddress: SENDER_ADDRESS,
    date: thaiLetterDate(dayjs()),
    fields: [
      { label: 'เรื่อง', value: 'ขอให้ซ่อมแซมอุปกรณ์ชำรุดบกพร่องระหว่างค้ำประกันสัญญา' },
      { label: 'เรียน', value: contractor },
      { label: 'อ้างถึง', value: contractRef },
    ],
    paragraphs: [
      { text: intro },
      { text: findings },
      { text: coordination },
      { text: closingPara },
    ],
    closing: 'ขอแสดงความนับถือ',
    signerName: `(${'.'.repeat(30)})`,
    signerPosition: `${'.'.repeat(34)}`,
    footerLines: FOOTER_LINES,
    tagline: TAGLINE,
  }
}
