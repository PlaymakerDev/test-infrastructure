import dayjs from 'dayjs'

export const DAILY_ROW_DATE_FORMAT = 'DD/MM/BBBB'

/** Fills a 7(ish)-day window so `TableLatestStation`/`TableLatestWIM` always render
 *  a full row per day even when the backend only returned data for some of them —
 *  days with no matching row are synthesized via `buildMissingRow`, then the whole
 *  set is sorted newest-first to match the tables' existing sort order. */
export function fillMissingDailyRows<T extends { date_time: string }>(
  rows: T[],
  days: number,
  buildMissingRow: (dateTime: string) => T
): T[] {
  const byDateKey = new Map<string, T>()
  rows.forEach((row) => {
    byDateKey.set(dayjs(row.date_time, DAILY_ROW_DATE_FORMAT).format('YYYY-MM-DD'), row)
  })

  const merged: T[] = []
  for (let i = 0; i < days; i++) {
    const day = dayjs().subtract(i, 'day')
    const existing = byDateKey.get(day.format('YYYY-MM-DD'))
    merged.push(existing ?? buildMissingRow(day.format(DAILY_ROW_DATE_FORMAT)))
  }

  return merged.sort((a, b) =>
    dayjs(b.date_time, DAILY_ROW_DATE_FORMAT).valueOf() - dayjs(a.date_time, DAILY_ROW_DATE_FORMAT).valueOf()
  )
}
