/** Drop one column, found by its header text, from a report the BACKEND built
 *  — for exports whose columns the FE can't choose (e.g. the settings
 *  ผู้รับจ้าง report, `/manage/contractor/export`). FE-built exports should
 *  simply leave the column out of their `columns` list instead. */

const colToNum = (col: string) => [...col].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0)
const numToCol = (n: number) => {
  let col = ''
  for (; n > 0; n = Math.floor((n - 1) / 26)) col = String.fromCharCode(65 + ((n - 1) % 26)) + col
  return col
}

/** Moves a ref's column by `delta`, keeping `$` anchors ("$L$1" → "$K$1"). */
const moveCol = (ref: string, delta: number) =>
  ref.replace(/^(\$?)([A-Z]+)/, (_m, anchor: string, col: string) => `${anchor}${numToCol(colToNum(col) + delta)}`)

const colOf = (ref: string) => colToNum(ref.replace(/^\$?([A-Z]+).*$/, '$1'))

/** A cell ref or range after column `target` (1-based) is deleted — null when
 *  nothing is left of it (it lay wholly in that column, or a range shrank to a
 *  single cell). Everything right of the column slides one to the left. */
export const shiftRange = (range: string, target: number): string | null => {
  const [start, end] = range.split(':')
  const startCol = colOf(start)
  if (end === undefined) {
    if (startCol === target) return null
    return startCol > target ? moveCol(start, -1) : start
  }
  const endCol = colOf(end)
  if (startCol === target && endCol === target) return null
  const nextStart = startCol > target ? moveCol(start, -1) : start
  const nextEnd = endCol >= target ? moveCol(end, -1) : end
  return nextStart.replace(/\$/g, '') === nextEnd.replace(/\$/g, '') ? null : `${nextStart}:${nextEnd}`
}

const decodeXml = (text: string) =>
  text
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_m, code: string) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, '&')

const textOf = (xml: string) => [...xml.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((m) => decodeXml(m[1])).join('')

const CELL = /<c\b([^>]*?)(\/>|>([\s\S]*?)<\/c>)/g

/** Column (1-based) of the first cell whose text is `header`, or null. */
export const findHeaderColumn = (sheetXml: string, header: string, sharedStrings: string[]): number | null => {
  for (const m of sheetXml.matchAll(CELL)) {
    const attrs = m[1]
    const inner = m[3] ?? ''
    const ref = attrs.match(/\br="([A-Z]+)\d+"/)?.[1]
    if (!ref) continue
    const type = attrs.match(/\bt="([^"]+)"/)?.[1]
    const text =
      type === 's' ? sharedStrings[Number(inner.match(/<v>(\d+)<\/v>/)?.[1])]
        : type === 'inlineStr' ? textOf(inner)
          : undefined
    if (text?.trim() === header) return colToNum(ref)
  }
  return null
}

/** Worksheet XML with column `target` removed: its cells, its width, and its
 *  share of every merge / filter / dimension range. */
export const removeSheetColumn = (xml: string, target: number): string => {
  let out = xml.replace(CELL, (cell, attrs: string, rest: string) => {
    const m = attrs.match(/\br="([A-Z]+)(\d+)"/)
    if (!m) return cell
    const col = colToNum(m[1])
    if (col === target) return ''
    return col > target ? `<c${attrs.replace(m[0], `r="${numToCol(col - 1)}${m[2]}"`)}${rest}` : cell
  })

  // Row `spans` hints ("1:12").
  out = out.replace(/(<row\b[^>]*?\bspans=")(\d+):(\d+)(")/g, (_m, a: string, lo: string, hi: string, b: string) => {
    const from = Number(lo) > target ? Number(lo) - 1 : Number(lo)
    const to = Number(hi) >= target ? Number(hi) - 1 : Number(hi)
    return `${a}${from}:${Math.max(from, to)}${b}`
  })

  // Column widths — each <col> covers min..max.
  out = out.replace(/<col\b([^>]*?)(\/>|><\/col>)/g, (el, attrs: string, close: string) => {
    const min = Number(attrs.match(/\bmin="(\d+)"/)?.[1])
    const max = Number(attrs.match(/\bmax="(\d+)"/)?.[1])
    if (!min || !max || max < target) return el
    if (min === target && max === target) return ''
    const next = attrs
      .replace(/\bmin="\d+"/, `min="${min > target ? min - 1 : min}"`)
      .replace(/\bmax="\d+"/, `max="${max - 1}"`)
    return `<col${next}${close}`
  })
  out = out.replace(/<cols>\s*<\/cols>|<cols\/>/g, '')

  // Merges — drop the ones that vanish, then re-count.
  let merges = 0
  out = out.replace(/<mergeCell\b([^>]*?)\bref="([^"]+)"([^>]*?)(\/>|><\/mergeCell>)/g, (_el, pre: string, ref: string, post: string, close: string) => {
    const next = shiftRange(ref, target)
    if (!next) return ''
    merges++
    return `<mergeCell${pre}ref="${next}"${post}${close}`
  })
  out = merges
    ? out.replace(/(<mergeCells\b[^>]*?\bcount=")\d+(")/, `$1${merges}$2`)
    : out.replace(/<mergeCells\b[^>]*>\s*<\/mergeCells>|<mergeCells\b[^>]*\/>/g, '')

  // Ranges that span the sheet's columns.
  out = out.replace(/(<(?:dimension|autoFilter)\b[^>]*?\bref=")([^"]+)(")/g, (el, a: string, ref: string, b: string) => {
    const next = shiftRange(ref, target)
    return next ? `${a}${next}${b}` : el
  })

  return out
}

/** Removes the column headed `header` from the workbook's first worksheet,
 *  leaving every other cell, style, merge and width untouched (the file is
 *  edited in place — no re-render through SheetJS, which would drop the
 *  backend's styling). Returns null when the header isn't there. SheetJS is
 *  loaded on demand, so the HTML variant below never pulls it in. */
export const removeXlsxColumnByHeader = async (data: ArrayBuffer | Uint8Array, header: string): Promise<Uint8Array | null> => {
  const { CFB } = await import('xlsx-js-style')
  const zip = CFB.read(data instanceof Uint8Array ? data : new Uint8Array(data), { type: 'array' })
  const read = (path: string): string | null => {
    const entry = CFB.find(zip, path)
    if (!entry?.content) return null
    return new TextDecoder().decode(entry.content instanceof Uint8Array ? entry.content : new Uint8Array(entry.content))
  }
  const write = (path: string, text: string) => {
    const entry = CFB.find(zip, path)
    if (!entry) return
    entry.content = new TextEncoder().encode(text)
    entry.size = entry.content.length
  }

  // First sheet, resolved the way Excel does: <sheets> order → its rel target.
  const workbook = read('/xl/workbook.xml')
  const rels = read('/xl/_rels/workbook.xml.rels')
  const relId = workbook?.match(/<sheet\b[^>]*?\br:id="([^"]+)"/)?.[1]
  const target = relId && rels?.match(new RegExp(`<Relationship\\b[^>]*?Id="${relId}"[^>]*?Target="([^"]+)"`))?.[1]
  if (!workbook || !target) return null
  const sheetPath = target.startsWith('/') ? target : `/xl/${target}`
  const sheet = read(sheetPath)
  if (!sheet) return null

  const sst = read('/xl/sharedStrings.xml')
  const strings = sst ? [...sst.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textOf(m[1])) : []
  const col = findHeaderColumn(sheet, header, strings)
  if (col === null) return null

  // The shared-string table stays as is — an unreferenced entry is harmless.
  write(sheetPath, removeSheetColumn(sheet, col))
  // The first sheet's filter range lives in workbook.xml too (_FilterDatabase).
  write('/xl/workbook.xml', workbook.replace(
    /(<definedName\b[^>]*?\blocalSheetId="0"[^>]*>)([^<]*)(<\/definedName>)/g,
    (el, open: string, body: string, close: string) => {
      const bang = body.lastIndexOf('!')
      if (bang < 0) return el
      const refs = body.slice(bang + 1).split(',').map((r) => shiftRange(r, col))
      return refs.some((r) => r === null) ? el : `${open}${body.slice(0, bang + 1)}${refs.join(',')}${close}`
    },
  ))

  // CFB.read adds a placeholder stream for its own container format; it is not
  // part of the xlsx package and must not be written back into the zip.
  CFB.utils.cfb_del(zip, '/Sh33tJ5')
  const out = CFB.write(zip, { fileType: 'zip', type: 'array' })
  return out instanceof Uint8Array ? out : new Uint8Array(out)
}

/** Removes the column headed `header` from every table in an HTML report
 *  (browser only — uses DOMParser). Colspans that straddle it shrink by one. */
export const removeHtmlTableColumnByHeader = (html: string, header: string): string => {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  let changed = false
  doc.querySelectorAll('table').forEach((table) => {
    const headRow = table.tHead?.rows[0] ?? table.rows[0]
    if (!headRow) return
    let target = -1
    let pos = 0
    for (const cell of Array.from(headRow.cells)) {
      if (cell.textContent?.trim() === header) { target = pos; break }
      pos += cell.colSpan
    }
    if (target < 0) return
    changed = true
    for (const row of Array.from(table.rows)) {
      let at = 0
      for (const cell of Array.from(row.cells)) {
        if (target >= at && target < at + cell.colSpan) {
          if (cell.colSpan > 1) cell.colSpan -= 1
          else cell.remove()
          break
        }
        at += cell.colSpan
      }
    }
  })
  if (!changed) return html
  const doctype = doc.doctype ? `<!DOCTYPE ${doc.doctype.name}>` : ''
  return doctype + doc.documentElement.outerHTML
}
