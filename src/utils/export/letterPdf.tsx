import React from 'react'
import { Document, Font, Image, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import { download, loadMeasureFont, wrapPdfText } from './pdf'

dayjs.extend(buddhistEra)

// ═══════════════════════════════════════════════════════════════════════════
// หนังสือราชการภายนอก (external official letter) — the format the ministry
// actually sends contractors. Distinct from the table/block reports in
// pdf.tsx: A4 portrait, ครุฑ letterhead, TH Sarabun New at 16pt, Thai
// numerals, งานสารบรรณ margins (left 3cm / right 2cm).
// ═══════════════════════════════════════════════════════════════════════════

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
const SARABUN_REGULAR = `${BASE_PATH}/fonts/THSarabunNew-Regular.ttf`
const SARABUN_BOLD = `${BASE_PATH}/fonts/THSarabunNew-Bold.ttf`
const SARABUN_ITALIC = `${BASE_PATH}/fonts/THSarabunNew-Italic.ttf`

// TH Sarabun New is THE font for Thai government correspondence (ระเบียบ
// สำนักนายกฯ ว่าด้วยงานสารบรรณ) — NotoSansThai, used by every other export in
// this folder, is wrong for a letter.
//
// FONT NOTE — public/fonts/THSarabunNew-*.ttf must stay the ORIGINAL SIPA
// national-font release (1000 units/em, GSUB with a `thai` script entry). Do
// NOT swap in a FontSquirrel-style "webfont" build: those strip GPOS and the
// Thai GSUB script, so fontkit can never substitute the lowered mark variants
// (uni0E48.alt2 …) and EVERY วรรณยุกต์ renders half an em too high — it lands
// on the line above and reads as a missing tone mark. That failure is invisible
// to tsc and to a quick low-zoom glance; verify at 4× zoom on a word like
// "สิ่งก่อสร้าง" after any font change.
Font.register({
  family: 'THSarabunNew',
  fonts: [
    { src: SARABUN_REGULAR, fontWeight: 400 },
    { src: SARABUN_BOLD, fontWeight: 700 },
    { src: SARABUN_ITALIC, fontStyle: 'italic', fontWeight: 400 },
    // The SIPA release ships no BoldItalic face, and @react-pdf has no
    // synthetic oblique — so bold+italic resolves to the upright Bold rather
    // than throwing. Drop this line the day a THSarabunNew-BoldItalic.ttf
    // lands in public/fonts.
    { src: SARABUN_BOLD, fontStyle: 'italic', fontWeight: 700 },
  ],
})
// Measure-only twins — see the register note at the top of pdf.tsx: measuring
// on the render family poisons its fontkit shaping cache and drops leading
// glyphs. The bold twin exists because Sarabun Bold runs ~4.9% wider than
// Regular, so a line that mixes the two cannot be measured on Regular alone.
Font.register({ family: 'THSarabunNew__measure', fonts: [{ src: SARABUN_REGULAR }] })
Font.register({ family: 'THSarabunNew__measureBold', fonts: [{ src: SARABUN_BOLD }] })
// Textkit must never break inside a Thai word (inserts "-" AND truncates the
// tail); wrapLetterArgs precomputes every break as a real '\n'.
Font.registerHyphenationCallback((word) => [word])

/** ๐-๙ — official letters spell numerals in Thai digits, including dates,
 *  phone numbers and contract numbers. */
export function toThaiDigits(value: string): string {
  return value.replace(/[0-9]/g, (d) => '๐๑๒๓๔๕๖๗๘๙'[Number(d)])
}

/** "๒๔ สิงหาคม ๒๕๖๙" — Buddhist-era long date in Thai digits. Month is spelled
 *  out: งานสารบรรณ has no abbreviated form on an external letter. */
export function thaiLetterDate(date: dayjs.Dayjs | Date | string | null | undefined): string {
  if (!date) return ''
  const d = dayjs(date)
  if (!d.isValid()) return ''
  return toThaiDigits(d.locale('th').format('D MMMM BBBB'))
}

/** A stretch of body text rendered in one weight. */
export interface LetterRun {
  text: string
  bold?: boolean
}

/** One pre-wrapped, pre-justified body line. */
export interface LetterLine {
  /** The line split at its weight changes — usually a single regular run. */
  runs: LetterRun[]
  /** Extra advance per glyph that stretches this line out to the right margin;
   *  0 on a paragraph's last line, which stays ragged as justified text should. */
  letterSpacing: number
}

/** One body paragraph. `indent: false` keeps it flush left — for the tail
 *  clauses that continue the paragraph above (as in the reference letter). */
export interface LetterParagraph {
  text: string
  indent?: boolean
  /** A verbatim substring of `text` to render bold — the department bolds the
   *  cost-recovery clause at the end of ¶3. Wrapping accounts for the wider
   *  bold face, so the span may start and end mid-line. */
  bold?: string
  /** Filled by wrapLetterArgs: the paragraph pre-broken into rendered lines,
   *  each with the `letterSpacing` that flushes it to the right margin.
   *  Each line renders as its OWN <Text> so the first one can carry the indent
   *  as a plain marginLeft. Do NOT collapse this back into one <Text> with
   *  '\n's + `textIndent`: textkit treats every '\n' as a new paragraph and
   *  re-applies the indent to all of them, and the over-wide lines that
   *  follow get re-broken by the engine. */
  lines?: LetterLine[]
}

/** A labelled head line: "เรื่อง  <value>" / "เรียน  <value>". */
export interface LetterField {
  label: string
  value: string
}

export interface ExportLetterPdfArgs {
  /** File name base — saved as `<filenameBase>_YYYYMMDD_HHmmss.pdf`. */
  filenameBase: string
  /** "ที่" — reference number, e.g. 'คค ๐๗๐๒.๒/'. */
  refNo: string
  /** Sender block on the right, one line each (office, street, district…). */
  senderAddress: string[]
  /** Centered date line under the letterhead. */
  date: string
  /** เรื่อง / เรียน / อ้างถึง — rendered in the given order. */
  fields: LetterField[]
  /** Filled by wrapLetterArgs — the label column is sized to the WIDEST label
   *  ('อ้างถึง' is wider than 'เรื่อง') so every value still lines up. */
  labelWidth?: number
  paragraphs: LetterParagraph[]
  /** 'ขอแสดงความนับถือ' and the signature block under it. */
  closing: string
  signerName?: string
  signerPosition?: string
  /** Bottom-left originating-division block (division, phone, email, site). */
  footerLines?: string[]
  /** Centered italic slogan on the very last line of the letter page. */
  tagline?: string
  /** Extra sheets appended after the letter — the maintenance letter uses one
   *  for รูปภาพสถานะการทำงานของอุปกรณ์. Sources may be remote URLs; they are
   *  fetched to data URLs at export time and an image that fails to load is
   *  simply skipped (never a failed export). */
  attachments?: LetterAttachment[]
}

export interface LetterAttachment {
  title?: string
  images: string[]
  /** Filled by exportLetterPdf — the fetched data URLs actually rendered. */
  imageDataUrls?: string[]
}

// A4 portrait in points; งานสารบรรณ margins: left 3cm, right 2cm.
const PAGE_W = 595.28
const MARGIN_LEFT = 85 // 3cm
const MARGIN_RIGHT = 57 // 2cm
const CONTENT_W = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT
const BODY_SIZE = 16
const PARA_INDENT = 71 // 2.5cm first-line indent
const LABEL_GAP = 10 // gutter between a head label and its value
// Body justification (see justifySpacing): how much per-glyph stretch is
// tolerable, and how much width to leave unfilled so the engine never re-breaks
// a line the pre-wrap already sized.
const MAX_LETTER_SPACING_PT = 1.5
const JUSTIFY_SAFETY_PT = 0.6
// One rendered body line — the page's own leading (BODY_SIZE × lineHeight).
// Measured against real output: footer lines sit exactly 16.8pt apart.
const LINE_H = BODY_SIZE * 1.05
// How far the tagline's baseline sits above the page edge, and the strip it
// occupies. Both were one line lower until the user matched them to the
// department's sample form (2026-09-22).
const TAGLINE_BOTTOM = 6 + LINE_H
// Gap the originating-division block leaves above the page edge: what it used
// to have (18) plus the two-line lift, which is measured from the block's own
// old position — NOT stacked on top of the tagline's lift.
const FOOTER_CLEARANCE = 18 + LINE_H * 2
// 3cm tall — the ครุฑ size ระเบียบงานสารบรรณ specifies for หนังสือภายนอก.
const EMBLEM_H = 85
const EMBLEM_W = Math.round((EMBLEM_H * 420) / 447) // asset is 420×447

const s = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 20,
    paddingLeft: MARGIN_LEFT,
    paddingRight: MARGIN_RIGHT,
    fontFamily: 'THSarabunNew',
    fontSize: BODY_SIZE,
    // 16pt / ~17pt leading — งานสารบรรณ single spacing, and what makes the
    // whole letter land on one page. Safe to compress because TH Sarabun New
    // places วรรณยุกต์ by glyph substitution (uni0E48.alt2 etc.) with a zero
    // GPOS offset, so marks ride in the same text run as their base glyph and
    // leading can't shift them. See the FONT NOTE above before swapping fonts.
    lineHeight: 1.05,
    color: '#000000',
  },
  emblem: { width: EMBLEM_W, height: EMBLEM_H, alignSelf: 'center', marginBottom: 6, objectFit: 'contain' },
  headRow: { flexDirection: 'row', justifyContent: 'space-between' },
  refNo: { width: '46%' },
  // No fixed width: the block shrink-wraps its longest line so `space-between`
  // parks its right edge on the right margin. A fixed 50% left the address
  // sitting mid-page with dead space to its right. maxWidth matches the width
  // wrapLetterArgs measures the lines against.
  sender: { maxWidth: '52%' },
  date: { textAlign: 'center', marginTop: 10, marginBottom: 10 },
  fieldRow: { flexDirection: 'row', marginBottom: 4 },
  // Regular weight, not bold — งานสารบรรณ sets เรื่อง/เรียน/อ้างถึง in the
  // same face as the body.
  fieldLabel: {},
  fieldValue: { flex: 1 },
  paragraph: { marginTop: 8 },
  closing: { marginTop: 16, marginLeft: '52%' },
  signName: { marginTop: 32, marginLeft: '52%' },
  signPosition: { marginLeft: '52%' },
  footerBlock: { marginTop: 'auto', marginBottom: FOOTER_CLEARANCE },
  footerLine: { fontSize: 14 },
  // Pinned to the page edge (not the flow) and `fixed` at render time, so it
  // repeats on every printed page — the letter and each attachment sheet
  // (user 2026-09-22). Bold #BFBFBF per the department's letterhead.
  tagline: {
    position: 'absolute',
    bottom: TAGLINE_BOTTOM,
    left: MARGIN_LEFT,
    right: MARGIN_RIGHT,
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: 700,
    color: '#BFBFBF',
    textAlign: 'center',
  },
  attachTitle: { fontSize: BODY_SIZE, textAlign: 'center', marginBottom: 12 },
  // Contact sheets are wide; fit to the content column and cap the height so
  // two of them still share a page instead of overflowing it.
  attachImage: { width: CONTENT_W, maxHeight: 640, objectFit: 'contain', marginBottom: 12 },
})

/** The ครุฑ letterhead. Fetched to a data URL by the caller-side helper below
 *  so a missing asset degrades to a letter without the emblem, never a
 *  failed export. */
export const GARUDA_EMBLEM_URL = `${BASE_PATH}/images/export/garuda-emblem.png`

/** The department's slogan, repeated at the foot of every printed page.
 *  `fixed` makes @react-pdf re-emit it on each page the parent <Page> breaks
 *  into, so a letter that spills past one sheet still carries it. */
const Tagline: React.FC<{ text?: string }> = ({ text }) =>
  text ? <Text fixed style={s.tagline}>{`${text} `}</Text> : null

export function LetterDocument({
  emblemDataUrl,
  ...args
}: ExportLetterPdfArgs & { emblemDataUrl: string | null }) {
  const { refNo, senderAddress, date, fields, labelWidth, paragraphs, closing, signerName, signerPosition, footerLines, tagline } = args

  return (
    <Document>
      <Page size='A4' style={s.page}>
        {emblemDataUrl ? (
          // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf primitive, not a DOM <img>
          <Image src={emblemDataUrl} style={s.emblem} />
        ) : null}

        <View style={s.headRow}>
          <Text style={s.refNo}>{`${refNo} `}</Text>
          <View style={s.sender}>
            {senderAddress.map((line, i) => (
              <Text key={i}>{`${line} `}</Text>
            ))}
          </View>
        </View>

        <Text style={s.date}>{`${date} `}</Text>

        {fields.map((f, i) => (
          <View style={s.fieldRow} key={i}>
            <Text style={{ ...s.fieldLabel, width: labelWidth ?? 60 }}>{`${f.label} `}</Text>
            <Text style={s.fieldValue}>{`${f.value} `}</Text>
          </View>
        ))}

        {paragraphs.map((p, i) => (
          <View key={i} style={s.paragraph}>
            {(p.lines ?? [{ runs: [{ text: p.text }], letterSpacing: 0 }]).map((line, li) => (
              <Text
                key={li}
                style={{
                  ...(li === 0 && p.indent !== false ? { marginLeft: PARA_INDENT } : {}),
                  ...(line.letterSpacing ? { letterSpacing: line.letterSpacing } : {}),
                }}
              >
                {line.runs.map((run, ri) =>
                  run.bold
                    ? <Text key={ri} style={{ fontWeight: 700 }}>{run.text}</Text>
                    : <Text key={ri}>{run.text}</Text>,
                )}
                {/* A justified line ends exactly at the margin, so it gets NO
                    trailing space — that space is the final-glyph clip
                    workaround, and here it would leave a visible ragged gap.
                    Ragged (last) lines keep it. */}
                {line.letterSpacing ? '' : ' '}
              </Text>
            ))}
          </View>
        ))}

        <Text style={s.closing}>{`${closing} `}</Text>
        {signerName ? <Text style={s.signName}>{`${signerName} `}</Text> : null}
        {signerPosition ? <Text style={s.signPosition}>{`${signerPosition} `}</Text> : null}

        {footerLines?.length ? (
          <View style={s.footerBlock}>
            {footerLines.map((line, i) => (
              <Text key={i} style={s.footerLine}>{`${line} `}</Text>
            ))}
          </View>
        ) : null}
        <Tagline text={tagline} />
      </Page>

      {/* Attachment sheets (รูปภาพสถานะการทำงานของอุปกรณ์). One page per
          attachment, images stacked — a sheet with no loadable image is
          dropped so the letter never prints an empty page. */}
      {(args.attachments ?? [])
        .filter((a) => (a.imageDataUrls?.length ?? 0) > 0)
        .map((attachment, ai) => (
          <Page size='A4' style={s.page} key={`attach-${ai}`}>
            {attachment.title ? <Text style={s.attachTitle}>{`${attachment.title} `}</Text> : null}
            {(attachment.imageDataUrls ?? []).map((src, ii) => (
              // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf primitive, not a DOM <img>
              <Image key={ii} src={src} style={s.attachImage} />
            ))}
            <Tagline text={tagline} />
          </Page>
        ))}
    </Document>
  )
}

/** Pre-wrap every Thai string to the width it will actually render at — the
 *  same rule as prewrapTableArgs, see the hyphenation note in pdf.tsx. */
export async function wrapLetterArgs(args: ExportLetterPdfArgs): Promise<ExportLetterPdfArgs> {
  const [fk, fkBold] = await Promise.all([
    loadMeasureFont('THSarabunNew__measure'),
    loadMeasureFont('THSarabunNew__measureBold'),
  ])
  if (!fk) return args
  const wrap = (text: string, maxPt: number, size = BODY_SIZE, firstMaxPt?: number) =>
    wrapPdfText(fk, text, maxPt, size, firstMaxPt)
  const measure = (text: string, size = BODY_SIZE) =>
    fk.layout(text).advanceWidth * (size / fk.unitsPerEm)
  /** Width of a mixed-weight line — each run on its own face. Falling back to
   *  the regular face if the bold twin failed to load only costs accuracy, not
   *  correctness: the budget loop below still shrinks until the line fits. */
  const measureRuns = (runs: LetterRun[], size = BODY_SIZE) =>
    runs.reduce((sum, run) => {
      const face = run.bold && fkBold ? fkBold : fk
      return sum + face.layout(run.text).advanceWidth * (size / face.unitsPerEm)
    }, 0)

  /** Split `[from, to)` of a paragraph at its bold boundary. */
  const runsBetween = (text: string, boldFrom: number, boldTo: number, from: number, to: number): LetterRun[] => {
    if (boldFrom < 0 || boldTo <= from || boldFrom >= to) return [{ text: text.slice(from, to) }]
    const out: LetterRun[] = []
    if (from < boldFrom) out.push({ text: text.slice(from, boldFrom) })
    out.push({ text: text.slice(Math.max(from, boldFrom), Math.min(to, boldTo)), bold: true })
    if (to > boldTo) out.push({ text: text.slice(boldTo, to) })
    return out.filter((r) => r.text.length > 0)
  }

  /** Map wrapped lines back onto the paragraph so each one knows which of its
   *  characters are bold. Every line is a verbatim slice of `text` (wrapPdfText
   *  only ever concatenates whole tokens), so a forward-scanning indexOf finds
   *  each one exactly. */
  const lineRuns = (text: string, lines: string[], boldFrom: number, boldTo: number): LetterRun[][] => {
    let cursor = 0
    return lines.map((line) => {
      if (!line) return [{ text: '' }]
      const at = text.indexOf(line, cursor)
      if (at < 0) return [{ text: line }] // shouldn't happen; render it plain
      cursor = at + line.length
      return runsBetween(text, boldFrom, boldTo, at, at + line.length)
    })
  }

  const wrapParagraph = (p: LetterParagraph): LetterParagraph => {
    const firstW = p.indent === false ? CONTENT_W : CONTENT_W - PARA_INDENT
    const boldFrom = p.bold ? p.text.indexOf(p.bold) : -1
    const boldTo = boldFrom >= 0 ? boldFrom + (p.bold as string).length : -1
    const avail = (li: number) => (li === 0 ? firstW : CONTENT_W)

    // Bold Sarabun is ~4.9% wider than regular, so wrapping a mixed paragraph
    // against the regular face alone produces lines that overflow once they
    // render — and an overflowing line gets re-broken by textkit, which is the
    // failure that eats Thai glyphs. Shrink the wrap budget until every line
    // measures inside the column FOR REAL, on its own mix of faces.
    let runsPerLine: LetterRun[][] = []
    let texts: string[] = []
    let budget = CONTENT_W
    for (let attempt = 0; attempt < 8; attempt++) {
      const scale = budget / CONTENT_W
      texts = wrap(p.text, budget, BODY_SIZE, firstW * scale)
        .split('\n')
        .map((line) => line.trimEnd())
      runsPerLine = lineRuns(p.text, texts, boldFrom, boldTo)
      if (boldFrom < 0) break
      const overflows = runsPerLine.some(
        (runs, li) => measureRuns(runs) > avail(li) - JUSTIFY_SAFETY_PT,
      )
      if (!overflows) break
      budget *= 0.97
    }

    return {
      ...p,
      lines: runsPerLine.map((runs, li) => ({
        runs,
        letterSpacing: li === texts.length - 1 ? 0 : justifySpacing(runs, avail(li)),
      })),
    }
  }

  /** Justify a body line to `avail` by spreading the leftover width across its
   *  glyphs — Thai has no inter-word spaces to stretch, so `textAlign:
   *  'justify'` is a no-op on these single-line <Text>s (measured: identical
   *  output) and per-glyph advance is what Word does for Thai too.
   *
   *  Dividing by the FULL glyph count (not count-1) keeps the result strictly
   *  under `avail` — go over and textkit re-breaks the line, which undoes the
   *  pre-wrap. MAX guards the one bad case: a line cut short because the next
   *  token was a long unbreakable device name; it stays a little ragged rather
   *  than turning into spaced-out letters. */
  const justifySpacing = (runs: LetterRun[], avail: number): number => {
    const glyphs = Array.from(runs.map((r) => r.text).join('')).length
    if (glyphs < 2) return 0
    const deficit = avail - JUSTIFY_SAFETY_PT - measureRuns(runs)
    return Math.max(0, Math.min(MAX_LETTER_SPACING_PT, deficit / glyphs))
  }

  // Labels are bold and measured on the regular face — bold Sarabun runs a few
  // percent wider, so LABEL_GAP absorbs the difference.
  const labelWidth = Math.ceil(Math.max(...args.fields.map((f) => measure(f.label))) + LABEL_GAP)
  const fieldValueW = CONTENT_W - labelWidth - 4

  return {
    ...args,
    refNo: wrap(args.refNo, CONTENT_W * 0.46 - 4),
    senderAddress: args.senderAddress.map((line) => wrap(line, CONTENT_W * 0.5 - 4)),
    labelWidth,
    fields: args.fields.map((f) => ({ label: f.label, value: wrap(f.value, fieldValueW) })),
    // The first line is PARA_INDENT narrower and gets that same marginLeft at
    // render time, so both edges line up with the rest of the paragraph.
    paragraphs: args.paragraphs.map(wrapParagraph),
    footerLines: args.footerLines?.map((line) => wrap(line, CONTENT_W, 14)),
    tagline: args.tagline ? wrap(args.tagline, CONTENT_W, 14) : args.tagline,
  }
}

/** Read the emblem straight through as a PNG data URL. Deliberately NOT
 *  fetchImageAsDataUrl(): that re-encodes to JPEG, which smears the ครุฑ's
 *  hairline engraving. The asset is same-origin and already flattened onto
 *  white, so a byte-for-byte pass-through is both lossless and CORS-safe.
 *  Any failure returns null → the letter prints without the emblem rather
 *  than failing the export. */
async function fetchEmblemDataUrl(): Promise<string | null> {
  try {
    const res = await fetch(GARUDA_EMBLEM_URL)
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

/** Attachment images, fetched to data URLs (they live on the media host, so
 *  @react-pdf can't load them by URL). Anything that fails is dropped. */
async function loadAttachments(
  attachments: LetterAttachment[] | undefined,
): Promise<LetterAttachment[] | undefined> {
  if (!attachments?.length) return attachments
  const { fetchImageAsDataUrl } = await import('./image')
  return Promise.all(
    attachments.map(async (attachment) => ({
      ...attachment,
      imageDataUrls: (
        // 1600px, not the 640 default: a device-status contact sheet is a grid
        // of labelled camera frames and has to stay readable in print.
        await Promise.all(attachment.images.map((url) => fetchImageAsDataUrl(url, 1600)))
      )
        .filter((v): v is NonNullable<typeof v> => !!v)
        .map((img) => img.dataUrl),
    })),
  )
}

/** Render the official-letter report and trigger the download. */
export async function exportLetterPdf(args: ExportLetterPdfArgs): Promise<void> {
  const [emblemDataUrl, prepared, attachments] = await Promise.all([
    fetchEmblemDataUrl(),
    wrapLetterArgs(args),
    loadAttachments(args.attachments),
  ])
  const blob = await pdf(
    <LetterDocument {...prepared} attachments={attachments} emblemDataUrl={emblemDataUrl} />,
  ).toBlob()
  download(blob, `${args.filenameBase}_${dayjs().format('YYYYMMDD_HHmmss')}.pdf`)
}
