import React from 'react'
import { Document, Font, Image, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import buddhistEra from 'dayjs/plugin/buddhistEra'

dayjs.extend(buddhistEra)

// Thai glyphs need an embedded font — same NotoSansThai the old drr-cm-fe
// reports used (public/fonts/). Raw URL is NOT basePath-prefixed by Next,
// so carry it explicitly ('/atlas' in prod+dev-with-env).
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
const FONT_SRC = `${BASE_PATH}/fonts/NotoSansThai-Regular.ttf`
Font.register({ family: 'NotoSansThai', fonts: [{ src: FONT_SRC }] })
// Same file registered AGAIN under a private family: wrapPdfText() measures on
// this copy. Measuring on the render family's fontkit instance corrupts its
// shaping cache — glyphs the measurement already laid out then vanish from
// the rendered PDF (title lost its leading "ร"). A separate FontSource means
// a separate fontkit instance and zero shared state with the renderer.
Font.register({ family: 'NotoSansThai__measure', fonts: [{ src: FONT_SRC }] })
// Never let textkit break inside a word: every mid-word break inserts a
// visible "-" glyph (wrong for Thai) AND corrupts the glyph mapping so the
// STRING'S FINAL glyphs get dropped ("ปทุมธานี" → "ปทุมธ") — one lost glyph
// per inserted hyphen. Line breaks are instead precomputed by wrapPdfText()
// below (real '\n' = paragraph break: no hyphen, no truncation); textkit only
// ever breaks at spaces, which is safe.
Font.registerHyphenationCallback((word) => [word])

// ICU segmenters: Thai has no inter-word spaces, so wrap points come from
// dictionary word segmentation; grapheme clusters are the hard-split unit
// for a single word wider than its column (never separates a consonant from
// its สระ/วรรณยุกต์).
const thaiWords =
  typeof Intl !== 'undefined' && 'Segmenter' in Intl
    ? new Intl.Segmenter('th', { granularity: 'word' })
    : null
const graphemes =
  typeof Intl !== 'undefined' && 'Segmenter' in Intl
    ? new Intl.Segmenter('th', { granularity: 'grapheme' })
    : null

/** Minimal slice of the fontkit face @react-pdf keeps in its Font store. */
interface FontLike {
  unitsPerEm: number
  layout(text: string): { advanceWidth: number }
}

async function loadReportFont(): Promise<FontLike | null> {
  try {
    const source = Font.getFont({ fontFamily: 'NotoSansThai__measure', fontStyle: 'normal', fontWeight: 400 })
    await source.load()
    return (source.data as unknown as FontLike) ?? null
  } catch {
    return null
  }
}

/** Greedy line-wrap `text` to `maxPt` points at `fontSize`, breaking at Thai
 *  word boundaries (grapheme hard-split only when a single word is wider than
 *  the column). Lines are joined with ' \n' — the trailing space per line is
 *  the same final-glyph clip workaround used on whole cells. */
function wrapPdfText(fk: FontLike, text: string, maxPt: number, fontSize: number): string {
  const scale = fontSize / fk.unitsPerEm
  const w = (s: string) => fk.layout(s).advanceWidth * scale
  const wrapParagraph = (para: string): string[] => {
    if (!para || w(para) <= maxPt) return [para]
    const tokens = thaiWords
      ? Array.from(thaiWords.segment(para), (s) => s.segment)
      : para.split(/(\s+)/).filter(Boolean)
    const lines: string[] = []
    let cur = ''
    for (const tok of tokens) {
      if (cur === '' && tok.trim() === '') continue // no leading spaces on a fresh line
      const candidate = cur + tok
      if (w(candidate) <= maxPt) {
        cur = candidate
        continue
      }
      if (cur !== '') {
        lines.push(cur)
        cur = ''
      }
      if (tok.trim() === '') continue
      if (w(tok) <= maxPt) {
        cur = tok
        continue
      }
      // Single word wider than the column — hard-split at grapheme clusters.
      const clusters = graphemes ? Array.from(graphemes.segment(tok), (s) => s.segment) : Array.from(tok)
      for (const cl of clusters) {
        if (cur !== '' && w(cur + cl) > maxPt) {
          lines.push(cur)
          cur = ''
        }
        cur += cl
      }
    }
    if (cur !== '') lines.push(cur)
    return lines.length ? lines : ['']
  }
  return text.split('\n').flatMap(wrapParagraph).join(' \n')
}

/** One PDF table column: Thai header, width as a % of the table, and how to
 *  pull the cell text from a row. Reuses the same `value` contract as the
 *  Excel export so pages define columns once for both formats. */
export interface PdfColumn<Row> {
  header: string
  /** Percent of table width, e.g. 20 → '20%'. Should sum to ~100. */
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: Row, index: number) => string | number
}

export interface ExportTablePdfArgs<Row> {
  /** File name base — saved as `<filenameBase>_YYYYMMDD_HHmmss.pdf`. */
  filenameBase: string
  /** Report heading, e.g. 'รายงานสรุปภาพรวมกล้องวงจรปิด (CCTV Overview)'. */
  title: string
  /** Optional "เงื่อนไข: …" line under the heading (active filters). */
  filterNote?: string
  columns: PdfColumn<Row>[]
  rows: Row[]
  orientation?: 'landscape' | 'portrait'
}

const styles = StyleSheet.create({
  page: { padding: 30, paddingBottom: 44, fontFamily: 'NotoSansThai', fontSize: 9 },
  title: { fontSize: 15, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 10, textAlign: 'center', marginBottom: 2, color: '#444' },
  filterNote: { fontSize: 9, textAlign: 'center', marginBottom: 8, color: '#666' },
  row: { flexDirection: 'row' },
  headCell: {
    backgroundColor: '#f0f0f0',
    borderStyle: 'solid',
    borderColor: '#999',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 1,
    padding: 4,
    fontSize: 9,
    textAlign: 'center',
  },
  cell: {
    borderStyle: 'solid',
    borderColor: '#999',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 4,
    fontSize: 9,
  },
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 30,
    right: 30,
    fontSize: 8,
    textAlign: 'center',
    color: '#888',
  },
})

export function TableReportDocument<Row>({ title, filterNote, columns, rows, orientation }: ExportTablePdfArgs<Row>) {
  return (
    <Document>
      <Page size='A4' orientation={orientation ?? 'landscape'} style={styles.page}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          ข้อมูล ณ วันที่ {dayjs().locale('th').format('D MMMM BBBB เวลา HH:mm น.')}
        </Text>
        {filterNote ? <Text style={styles.filterNote}>เงื่อนไข: {filterNote}</Text> : null}

        {/* Header row — `fixed` repeats it on every page. The first column
            keeps its left border via borderLeftWidth override. */}
        <View style={styles.row} fixed>
          {columns.map((c, i) => (
            <Text
              key={c.header}
              style={{ ...styles.headCell, width: `${c.widthPct}%`, ...(i === 0 ? { borderLeftWidth: 1 } : {}) }}
            >
              {/* Trailing space: @react-pdf mis-measures Thai combining marks
                  (สระ/วรรณยุกต์) and clips the final glyph ("การค้ำประกัน" →
                  "การค้ำประกั") — the space absorbs the clip. Same workaround
                  the drr-cm-fe reports used. */}
              {`${c.header} `}
            </Text>
          ))}
        </View>
        {rows.map((row, ri) => (
          <View style={styles.row} key={ri} wrap={false}>
            {columns.map((c, ci) => (
              <Text
                key={c.header}
                style={{
                  ...styles.cell,
                  width: `${c.widthPct}%`,
                  textAlign: c.align ?? 'center',
                  ...(ci === 0 ? { borderLeftWidth: 1 } : {}),
                }}
              >
                {`${c.value(row, ri)} `}
              </Text>
            ))}
          </View>
        ))}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) => `หน้า ${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  )
}

// A4 in points, minus the page's 30pt left+right padding.
const PAGE_INNER_W = { landscape: 841.89 - 60, portrait: 595.28 - 60 } as const
const CELL_FONT_SIZE = 9
// padding 4×2 + right border + rounding safety.
const CELL_CHROME_PT = 12

/** Pre-wrap every header/cell (and the title/filter note) to its column
 *  width so TableReportDocument's <Text> never needs textkit to break a
 *  line mid-word — see the hyphenation note at the top of this file.
 *  Falls back to the raw args when the font can't be loaded. */
export async function prewrapTableArgs<Row>(args: ExportTablePdfArgs<Row>): Promise<ExportTablePdfArgs<Row>> {
  const fk = await loadReportFont()
  if (!fk) return args
  const pageW = PAGE_INNER_W[args.orientation ?? 'landscape']
  const spaceW = fk.layout(' ').advanceWidth * (CELL_FONT_SIZE / fk.unitsPerEm)
  const colMax = (pct: number) => Math.max(10, (pageW * pct) / 100 - CELL_CHROME_PT - spaceW)

  const columns = args.columns.map((c) => {
    const max = colMax(c.widthPct)
    const wrappedRows = args.rows.map((row, ri) => wrapPdfText(fk, String(c.value(row, ri)), max, CELL_FONT_SIZE))
    return {
      ...c,
      header: wrapPdfText(fk, c.header, max, CELL_FONT_SIZE),
      value: (_row: Row, ri: number) => wrappedRows[ri] ?? '',
    }
  })
  return {
    ...args,
    title: wrapPdfText(fk, args.title, pageW - 10, 15),
    filterNote: args.filterNote ? wrapPdfText(fk, args.filterNote, pageW - 60, CELL_FONT_SIZE) : args.filterNote,
    columns,
  }
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** Render the generic table report to a PDF blob and trigger the download. */
export async function exportTablePdf<Row>(args: ExportTablePdfArgs<Row>): Promise<void> {
  const prepared = await prewrapTableArgs(args)
  const blob = await pdf(<TableReportDocument {...prepared} />).toBlob()
  download(blob, `${args.filenameBase}_${dayjs().format('YYYYMMDD_HHmmss')}.pdf`)
}

// ═══════════════════════════════════════════════════════════════════════════
// Block-based report — for chart/analytic pages (PDF-only exports).
// A report is a flat list of blocks: key-value grids (stat cards as REAL,
// searchable text), chart images (captured via utils/export/chart.ts), and
// simple tables. All Thai text runs through the same wrapPdfText pipeline.
// ═══════════════════════════════════════════════════════════════════════════

export interface PdfKvItem {
  label: string
  value: string
}

export interface PdfSimpleColumn {
  header: string
  /** Percent of table width — should sum to ~100 within the block. */
  widthPct: number
  align?: 'left' | 'center' | 'right'
}

/** One photo-card entry (timeline events etc.): thumbnail on the left,
 *  heading/badge + field grid on the right — mirrors the on-screen cards. */
export interface PdfEntryItem {
  /** Pre-fetched data-URL image (see utils/export/image.ts); null → no photo. */
  image?: { dataUrl: string; width: number; height: number } | null
  heading: string
  subheading?: string
  badge?: string
  /** Badge border/text color — printable dark tones, e.g. '#1d4ed8'. */
  badgeColor?: string
  fields: PdfKvItem[]
}

export type PdfReportBlock =
  | { type: 'kv'; title?: string; items: PdfKvItem[]; columns?: 1 | 2 }
  | { type: 'image'; title?: string; dataUrl: string; width: number; height: number }
  | { type: 'table'; title?: string; columns: PdfSimpleColumn[]; rows: (string | number)[][] }
  | { type: 'entries'; title?: string; items: PdfEntryItem[] }

export interface ExportReportPdfArgs {
  /** File name base — saved as `<filenameBase>_YYYYMMDD_HHmmss.pdf`. */
  filenameBase: string
  title: string
  /** Optional context line under the heading (station name, selected date…). */
  subtitleNote?: string
  blocks: PdfReportBlock[]
  orientation?: 'landscape' | 'portrait'
}

const reportStyles = StyleSheet.create({
  blockTitle: {
    fontSize: 10.5,
    color: '#1f2937',
    fontWeight: 700,
    marginBottom: 3,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    borderBottomStyle: 'solid',
  },
  kvBlock: { marginBottom: 10 },
  kvGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  kvItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 2.5,
    borderBottomWidth: 0.75,
    borderBottomColor: '#eeeeee',
    borderBottomStyle: 'solid',
  },
  kvLabel: { fontSize: 9, color: '#6b7280' },
  kvValue: { fontSize: 9, color: '#111827', fontWeight: 700, textAlign: 'right' },
  imageBlock: { marginBottom: 10 },
  chartImage: { alignSelf: 'center' },
  tableBlock: { marginBottom: 10 },
  entryCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'solid',
    borderRadius: 4,
    padding: 6,
    marginBottom: 6,
  },
  entryThumb: {
    width: 132,
    height: 74,
    borderRadius: 3,
    backgroundColor: '#000000',
    objectFit: 'cover',
    marginRight: 8,
  },
  entryHeading: { fontSize: 9.5, color: '#111827', fontWeight: 700, flex: 1, paddingRight: 6 },
  entrySubheading: { fontSize: 8.5, color: '#6b7280', marginTop: 1 },
  entryBadge: {
    fontSize: 8,
    borderWidth: 0.75,
    borderStyle: 'solid',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  entryFieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 1.5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
    borderBottomStyle: 'solid',
  },
})

function ReportDocument({ title, subtitleNote, blocks, orientation }: ExportReportPdfArgs) {
  return (
    <Document>
      <Page size='A4' orientation={orientation ?? 'portrait'} style={styles.page}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          ข้อมูล ณ วันที่ {dayjs().locale('th').format('D MMMM BBBB เวลา HH:mm น.')}
        </Text>
        {subtitleNote ? <Text style={styles.filterNote}>{subtitleNote}</Text> : null}

        {blocks.map((block, bi) => {
          if (block.type === 'kv') {
            const cols = block.columns ?? 2
            const itemWidth = cols === 1 ? '100%' : '50%'
            const gutter = cols === 1 ? {} : { paddingRight: 10 }
            return (
              <View key={bi} style={reportStyles.kvBlock} wrap={false}>
                {block.title ? <Text style={reportStyles.blockTitle}>{`${block.title} `}</Text> : null}
                <View style={reportStyles.kvGrid}>
                  {block.items.map((item, ii) => (
                    <View key={ii} style={{ width: itemWidth, ...gutter }}>
                      <View style={reportStyles.kvItem}>
                        <Text style={{ ...reportStyles.kvLabel, maxWidth: '55%' }}>{`${item.label} `}</Text>
                        <Text style={{ ...reportStyles.kvValue, maxWidth: '45%' }}>{`${item.value} `}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )
          }

          if (block.type === 'image') {
            // Fit to content width, cap the height so two charts + stats can
            // share a page; aspect ratio preserved from the live chart.
            const pageW = PAGE_INNER_W[orientation ?? 'portrait']
            const maxH = 300
            let w = pageW
            let h = (block.height / block.width) * w
            if (h > maxH) {
              h = maxH
              w = (block.width / block.height) * h
            }
            return (
              <View key={bi} style={reportStyles.imageBlock} wrap={false}>
                {block.title ? <Text style={reportStyles.blockTitle}>{`${block.title} `}</Text> : null}
                {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf primitive, not a DOM <img> */}
                <Image src={block.dataUrl} style={{ ...reportStyles.chartImage, width: w, height: h }} />
              </View>
            )
          }

          if (block.type === 'entries') {
            return (
              <View key={bi} style={reportStyles.tableBlock}>
                {block.title ? <Text style={reportStyles.blockTitle}>{`${block.title} `}</Text> : null}
                {block.items.map((item, ii) => (
                  <View key={ii} style={reportStyles.entryCard} wrap={false}>
                    {item.image ? (
                      // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf primitive, not a DOM <img>
                      <Image src={item.image.dataUrl} style={reportStyles.entryThumb} />
                    ) : null}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        <Text style={reportStyles.entryHeading}>{`${item.heading} `}</Text>
                        {item.badge ? (
                          <Text
                            style={{
                              ...reportStyles.entryBadge,
                              color: item.badgeColor ?? '#374151',
                              borderColor: item.badgeColor ?? '#9ca3af',
                            }}
                          >
                            {`${item.badge} `}
                          </Text>
                        ) : null}
                      </View>
                      {item.subheading ? (
                        <Text style={reportStyles.entrySubheading}>{`${item.subheading} `}</Text>
                      ) : null}
                      <View style={{ ...reportStyles.kvGrid, marginTop: 3 }}>
                        {item.fields.map((f, fi) => (
                          <View key={fi} style={{ width: '50%', paddingRight: 8 }}>
                            <View style={reportStyles.entryFieldRow}>
                              <Text style={{ ...reportStyles.kvLabel, fontSize: 8.5, maxWidth: '55%' }}>{`${f.label} `}</Text>
                              <Text style={{ ...reportStyles.kvValue, fontSize: 8.5, maxWidth: '45%' }}>{`${f.value} `}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )
          }

          // table
          return (
            <View key={bi} style={reportStyles.tableBlock}>
              {block.title ? <Text style={reportStyles.blockTitle}>{`${block.title} `}</Text> : null}
              <View style={styles.row} wrap={false}>
                {block.columns.map((c, i) => (
                  <Text
                    key={c.header}
                    style={{ ...styles.headCell, width: `${c.widthPct}%`, ...(i === 0 ? { borderLeftWidth: 1 } : {}) }}
                  >
                    {`${c.header} `}
                  </Text>
                ))}
              </View>
              {block.rows.map((row, ri) => (
                <View style={styles.row} key={ri} wrap={false}>
                  {block.columns.map((c, ci) => (
                    <Text
                      key={c.header}
                      style={{
                        ...styles.cell,
                        width: `${c.widthPct}%`,
                        textAlign: c.align ?? 'center',
                        ...(ci === 0 ? { borderLeftWidth: 1 } : {}),
                      }}
                    >
                      {`${row[ci] ?? ''} `}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          )
        })}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) => `หน้า ${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  )
}

/** Pre-wrap every text in the report blocks (same rules as prewrapTableArgs). */
async function prewrapReportArgs(args: ExportReportPdfArgs): Promise<ExportReportPdfArgs> {
  const fk = await loadReportFont()
  if (!fk) return args
  const pageW = PAGE_INNER_W[args.orientation ?? 'portrait']
  const spaceW = fk.layout(' ').advanceWidth * (CELL_FONT_SIZE / fk.unitsPerEm)
  const colMax = (pct: number) => Math.max(10, (pageW * pct) / 100 - CELL_CHROME_PT - spaceW)

  const blocks = args.blocks.map((block): PdfReportBlock => {
    if (block.type === 'kv') {
      const cols = block.columns ?? 2
      const itemW = (pageW - (cols === 1 ? 0 : 10 * cols)) / cols
      return {
        ...block,
        title: block.title ? wrapPdfText(fk, block.title, pageW - 10, 10.5) : block.title,
        items: block.items.map((it) => ({
          label: wrapPdfText(fk, it.label, itemW * 0.55 - 6, 9),
          value: wrapPdfText(fk, it.value, itemW * 0.45 - 6, 9),
        })),
      }
    }
    if (block.type === 'image') {
      return {
        ...block,
        title: block.title ? wrapPdfText(fk, block.title, pageW - 10, 10.5) : block.title,
      }
    }
    if (block.type === 'entries') {
      // Right column = page − thumb(132) − margins/padding; badge shares the
      // heading row, so reserve room for it there.
      const rightW = pageW - 132 - 8 - 14
      const fieldW = rightW / 2 - 8
      return {
        ...block,
        title: block.title ? wrapPdfText(fk, block.title, pageW - 10, 10.5) : block.title,
        items: block.items.map((item) => ({
          ...item,
          heading: wrapPdfText(fk, item.heading, rightW - 80, 9.5),
          subheading: item.subheading ? wrapPdfText(fk, item.subheading, rightW - 6, 8.5) : item.subheading,
          fields: item.fields.map((f) => ({
            label: wrapPdfText(fk, f.label, fieldW * 0.55 - 4, 8.5),
            value: wrapPdfText(fk, f.value, fieldW * 0.45 - 4, 8.5),
          })),
        })),
      }
    }
    return {
      ...block,
      title: block.title ? wrapPdfText(fk, block.title, pageW - 10, 10.5) : block.title,
      columns: block.columns.map((c) => ({ ...c, header: wrapPdfText(fk, c.header, colMax(c.widthPct), CELL_FONT_SIZE) })),
      rows: block.rows.map((row) =>
        row.map((cell, ci) => wrapPdfText(fk, String(cell), colMax(block.columns[ci]?.widthPct ?? 10), CELL_FONT_SIZE))
      ),
    }
  })

  return {
    ...args,
    title: wrapPdfText(fk, args.title, pageW - 10, 15),
    subtitleNote: args.subtitleNote ? wrapPdfText(fk, args.subtitleNote, pageW - 60, CELL_FONT_SIZE) : args.subtitleNote,
    blocks,
  }
}

/** Render a block-based report (stat grids + chart images + tables) to PDF
 *  and trigger the download. Used by the chart-style pages whose export
 *  offers PDF only. */
export async function exportReportPdf(args: ExportReportPdfArgs): Promise<void> {
  const prepared = await prewrapReportArgs(args)
  const blob = await pdf(<ReportDocument {...prepared} />).toBlob()
  download(blob, `${args.filenameBase}_${dayjs().format('YYYYMMDD_HHmmss')}.pdf`)
}
