import dayjs, { type Dayjs } from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import type { ElectricityAggItem } from '@/types/lighting'

dayjs.extend(customParseFormat)

export type ElectricityReportType = 'hourly' | 'daily' | 'monthly' | 'yearly'

/** `label` format per report_type (checked live 2026-10-26). */
const LABEL_FORMAT: Record<ElectricityReportType, string> = {
  hourly: 'YYYY-MM-DD HH:mm',
  daily: 'YYYY-MM-DD',
  monthly: 'MM/YYYY',
  yearly: 'YYYY',
}

const PERIOD_UNIT: Record<ElectricityReportType, 'hour' | 'day' | 'month' | 'year'> = {
  hourly: 'hour',
  daily: 'day',
  monthly: 'month',
  yearly: 'year',
}

/** First and last instant (Thai time) of the period a report row covers.
 *  Every row is that WHOLE period's average — the backend joins all readings
 *  of the hour / day / month / year, whatever start_date and end_date were. */
export const electricityPeriod = (label: string, type: ElectricityReportType): [Dayjs, Dayjs] => {
  const start = dayjs(label, LABEL_FORMAT[type], true)
  return [start, start.endOf(PERIOD_UNIT[type])]
}

/** start_date to send: one day early. The backend reads start_date / end_date
 *  as UTC days — 07:00 to 06:59 the next morning in Thai time (2026-10-26: an
 *  hourly report for 24/10 came back 24/10 07:00 – 25/10 06:00, so the first
 *  seven night hours were missing; a daily 23–24/10 report carried a 25/10
 *  row). Asking from the day before brings those first hours in. */
export const electricityRequestStart = (startDate: string): string =>
  dayjs(startDate, 'YYYY-MM-DD').subtract(1, 'day').format('YYYY-MM-DD')

/** Only the rows whose period overlaps the Thai-time days picked — drops the
 *  extra day before (from {@link electricityRequestStart}) and the morning
 *  after that the UTC reading adds. Still right once the backend is fixed. */
export const trimElectricityToRange = (
  rows: ElectricityAggItem[],
  type: ElectricityReportType,
  startDate: string,
  endDate: string,
): ElectricityAggItem[] => {
  const from = dayjs(startDate, 'YYYY-MM-DD').startOf('day')
  const to = dayjs(endDate, 'YYYY-MM-DD').endOf('day')
  return rows.filter((row) => {
    const [start, end] = electricityPeriod(row.label, type)
    return start.isValid() && !start.isAfter(to) && !end.isBefore(from)
  })
}
