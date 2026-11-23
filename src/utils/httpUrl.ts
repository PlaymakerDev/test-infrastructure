/**
 * `value` trimmed, if it is an absolute http(s) URL — otherwise `null`.
 *
 * Gate for links built from user-entered data (e.g. a camera's Public URL):
 * anything else — a relative path, `javascript:`, a typo with no scheme —
 * must never become a clickable `href`.
 */
export const toHttpUrl = (value?: string | null): string | null => {
  const trimmed = value?.trim()
  if (!trimmed) return null
  try {
    const { protocol } = new URL(trimmed)
    return protocol === 'http:' || protocol === 'https:' ? trimmed : null
  } catch {
    return null
  }
}
