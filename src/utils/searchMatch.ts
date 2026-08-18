/**
 * Shared search matcher for the solution tables on every menu's overall page.
 *
 * Why this isn't a flat `haystack.includes(term)` (the previous implementation):
 * Thai bureau names collide with road-code prefixes. `ขทช.ลพบุรี`'s roads are
 * `ลบ.xxxx`, so typing `ลพ` (hunting ลำพูน's `ลพ.xxxx` roads) substring-matched
 * the *bureau* name and dragged every Lopburi row into the table. It read as if
 * the search box were one keystroke behind (reported 2026-08-17) — it wasn't;
 * `ล` and `ลพ` simply produced near-identical result sets.
 *
 * Rule: a **road-code-shaped** term — exactly two Thai consonants, optionally
 * followed by `.` and digits (`ลพ`, `ลพ.`, `ลพ.30`, `ลพ.3083`) — is matched as a
 * token PREFIX of the row's code fields (รหัสสายทาง / จุดติดตั้ง) only. Every
 * other term (full bureau name, project name, contract no, digits, latin text)
 * keeps the old substring-across-all-fields behaviour, so `ลพบุรี` still finds
 * the bureau and `3083` still finds `ลพ.3083`.
 */

/** Two Thai consonants, optionally `.` + digits. Vowels/tone marks disqualify —
 *  `ลำ` (ลำพูน) is not a road code, `ลพ` is. */
const ROAD_CODE_TERM = /^[ก-ฮ]{2}\.?\d*$/

export const isRoadCodeTerm = (term: string): boolean => ROAD_CODE_TERM.test(term.trim())

export interface SearchFields {
  /** Fields that start with a road code — รหัสสายทาง, จุดติดตั้ง. Matched by token prefix. */
  codes: (string | null | undefined)[]
  /** Everything else the table shows — หน่วยงาน, ชื่อโครงการ, เลขที่สัญญา. Substring only. */
  text: (string | null | undefined)[]
}

const matchesCodePrefix = (value: string | null | undefined, term: string): boolean =>
  (value ?? '')
    .toLowerCase()
    .split(/\s+/)
    .some((token) => token.startsWith(term))

/**
 * @param term raw search box value (trimmed/lowercased internally)
 * @returns true when the row should be shown — an empty term matches everything
 */
export function matchesSearchTerm(term: string, fields: SearchFields): boolean {
  const t = term.trim().toLowerCase()
  if (!t) return true

  if (isRoadCodeTerm(t)) return fields.codes.some((c) => matchesCodePrefix(c, t))

  const haystack = [...fields.codes, ...fields.text].map((v) => v ?? '').join(' ').toLowerCase()
  return haystack.includes(t)
}
