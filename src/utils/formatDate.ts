/** Map an English weekday name (as sent by the API) to its Thai full name.
 *  Returns the original string if not recognised so the UI never blanks out. */
const THAI_DAY_FULL: Record<string, string> = {
  sunday: 'อาทิตย์',
  monday: 'จันทร์',
  tuesday: 'อังคาร',
  wednesday: 'พุธ',
  thursday: 'พฤหัสบดี',
  friday: 'ศุกร์',
  saturday: 'เสาร์',
}

const THAI_DAY_SHORT: Record<string, string> = {
  sunday: 'อา.',
  monday: 'จ.',
  tuesday: 'อ.',
  wednesday: 'พ.',
  thursday: 'พฤ.',
  friday: 'ศ.',
  saturday: 'ส.',
}

/** "Tuesday" → "อังคาร". Case-insensitive. */
export const thaiDayName = (day: string | null | undefined): string => {
  if (!day) return ''
  return THAI_DAY_FULL[day.toLowerCase()] ?? day
}

/** "Tuesday" → "อ." — used for compact x-axis labels. */
export const thaiDayShort = (day: string | null | undefined): string => {
  if (!day) return ''
  return THAI_DAY_SHORT[day.toLowerCase()] ?? day.charAt(0) + '.'
}
