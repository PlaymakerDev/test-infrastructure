/** วงเงินของโครงการ while it is typed: digits with thousands commas, one "."
 *  and at most two decimals — "1234567.5" → "1,234,567.5". Thai digits count
 *  as digits; anything else is dropped. `parseBudget` reads it back. */
export const formatBudgetInput = (raw: string): string => {
  const ascii = raw.replace(/[๐-๙]/g, (d) => String('๐๑๒๓๔๕๖๗๘๙'.indexOf(d)))
  const cleaned = ascii.replace(/[^\d.]/g, '')
  const dot = cleaned.indexOf('.')
  const whole = (dot < 0 ? cleaned : cleaned.slice(0, dot)).replace(/^0+(?=\d)/, '')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  if (dot < 0) return grouped
  const fraction = cleaned.slice(dot + 1).replace(/\./g, '').slice(0, 2)
  return `${grouped || '0'}.${fraction}`
}

/** How many digits (and the dot) sit before `caret` in what was typed. */
export const significantBefore = (typed: string, caret: number): number =>
  typed.slice(0, caret).replace(/[^\d.๐-๙]/g, '').length

/** Caret index in the formatted text that follows the same number of digits
 *  as before — so adding a comma doesn't throw the caret to the end. */
export const caretAfterFormat = (formatted: string, significant: number): number => {
  let seen = 0
  for (let i = 0; i < formatted.length; i++) {
    if (seen === significant) return i
    if (/[\d.]/.test(formatted[i])) seen++
  }
  return formatted.length
}
