/** Image list off a case payload.
 *
 *  The backend switched these fields from a JSON-stringified array to a real
 *  array (2026-09-18: "Always an array — [] when there are none, never null"),
 *  so both shapes are accepted: older responses (and anything cached) still
 *  arrive as `"[\"https://…\"]"`, `"null"` or `""`. */
export const parseImageUrls = (raw: string[] | string | null | undefined): string[] => {
  const keep = (list: unknown[]): string[] =>
    list.filter((u): u is string => typeof u === 'string' && u.length > 0)

  if (Array.isArray(raw)) return keep(raw)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? keep(parsed) : []
  } catch {
    return []
  }
}
