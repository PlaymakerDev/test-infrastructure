import dayjs from 'dayjs'

/** Thai month abbreviations (0-indexed to match dayjs `.month()`). */
export const THAI_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
] as const

/**
 * Format a date as "D ก.ค. 2569" — Thai month abbreviation + **Buddhist-era**
 * year (Gregorian + 543). Use for every chart tooltip / label so dates read the
 * same across the app (never the Gregorian year).
 */
export const thaiDateBE = (iso: string | number | Date): string => {
  const d = dayjs(iso)
  return `${d.date()} ${THAI_MONTHS[d.month()]} ${d.year() + 543}`
}

/** "D ก.ค. 2569 HH:mm น." — Thai BE date + time. */
export const thaiDateTimeBE = (iso: string | number | Date): string => {
  const d = dayjs(iso)
  return `${thaiDateBE(iso)} ${d.format('HH:mm')} น.`
}
