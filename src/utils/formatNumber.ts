/** Format a number with thousand-separator commas + fixed decimals.
 *  Centralised here so dashboard values stay consistent (e.g. 1,234.56 vs
 *  1234.56). Renders "-" for nullish / NaN inputs so the UI never shows
 *  "NaN" or empty cells. */
export const fmtNumber = (
  value: number | null | undefined,
  decimals = 0,
): string => {
  if (value == null || Number.isNaN(value)) return '-'
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}
