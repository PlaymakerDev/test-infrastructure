// App-wide display flags — flip here, no code changes needed at call sites.

/** ชื่อโครงการ column/card field on the overall pages (10 menus) + their
 *  exports. Hidden per 2026-07-21 request ("ตอนนี้ยังไม่ใช้") — flip to true
 *  to bring it back everywhere at once. Does NOT affect settings' project
 *  management table (project name is the subject there) or the search boxes
 *  (searching by project name still works while hidden). */
export const SHOW_PROJECT_NAME = false

/** Drop the ชื่อโครงการ column from an export column config when the flag is
 *  off, rescaling the remaining PDF `widthPct` so they still sum to ~100
 *  (Excel char widths need no rescale). Generic over the per-page column
 *  shapes — pass any array whose items carry `header` (+ optional widthPct). */
export function hideProjectNameColumns<T extends { header: string; widthPct?: number }>(
  columns: T[],
): T[] {
  if (SHOW_PROJECT_NAME) return columns
  const kept = columns.filter((c) => c.header !== 'ชื่อโครงการ')
  if (kept.length === columns.length) return columns
  const sum = kept.reduce((s, c) => s + (c.widthPct ?? 0), 0)
  if (sum <= 0) return kept
  const scale = 100 / sum
  return kept.map((c) =>
    c.widthPct != null ? { ...c, widthPct: Math.round(c.widthPct * scale * 10) / 10 } : c,
  )
}
