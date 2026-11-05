import dayjs, { type Dayjs } from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import type { ElectricityAggItem, ElectricityPhaseData } from '@/types/lighting'
import { electricityPeriod, type ElectricityReportType } from '@/hooks/queries/lighting/electricityRange'

dayjs.extend(buddhistEra)

/** Single-line accents for single-phase devices, and the per-metric accent for
 *  SummaryReportSection's chart icon/title + AvgFooter value. */
export const COLOR_VOLTAGE_CYAN = '#66AEFF'
export const COLOR_AMP_ORANGE = '#FF9F43'

/** Per-phase line colors for the 24h Volt / Amp charts. Mirror bridge-lighting's
 *  VOLTAGE_LINES / CURRENT_LINES (ChartElectricalBridgeLighting.tsx) so the two
 *  features' identically-titled "…ภายในตู้ควบคุม 24 ชั่วโมง" charts read the
 *  same. Keep in sync with that file — do not re-pick these per component. */
export const COLOR_VOLT_PHASE_1 = '#00AEFF'
export const COLOR_VOLT_PHASE_2 = '#05F2DB'
export const COLOR_VOLT_PHASE_3 = '#7BFF66'
export const COLOR_AMP_PHASE_1 = '#FFE100'
export const COLOR_AMP_PHASE_2 = '#FF6200'
export const COLOR_AMP_PHASE_3 = '#FF66CC'

/** One row per (date, phase) — multi-phase devices get one colored row per
 *  phase with the date cell row-spanned across them; single-phase devices
 *  get exactly one row per date (dateRowSpan always 1), unchanged from before. */
export interface VoltageAmpTableRow {
  key: string
  date: string
  /** antd Table onCell rowSpan for the วันที่ column: N on the first phase-row
   *  of a date group, 0 on the rest (hides the cell so it visually merges). */
  dateRowSpan: number
  /** 0-based index into the phase color palette. */
  phaseIndex: number
  /** Raw phase label from the API (e.g. "1"/"2"/"3"). */
  phaseLabel: string
  voltage: number
  amp: number
  watt: number
  powerFactor: number
  /** Energy of the row's period — see {@link periodEnergyKwh}. `null` while a
   *  monthly / yearly row's daily rows are still loading, or it has none. */
  kwh: number | null
  frequency: number
}

/** Hours of [start, end] already gone by at `now`: a past day is 24, today
 *  counts up to now, a period still ahead 0. */
export const elapsedHours = (start: Dayjs, end: Dayjs, now: Dayjs): number => {
  const until = now.isBefore(end) ? now : end.add(1, 'millisecond')
  return Math.max(0, until.diff(start, 'hour', true))
}

/** kWh of one report row: the period's average watt held over the hours of it
 *  that have gone by. The endpoint sends no energy, only averages over every
 *  reading of the period (one per hour per phase), so the old
 *  `watt * 3600 / 3,600,000` — one hour's worth — was right only for hourly
 *  rows: a day read 24× low (2026-10-26: a 2,371 W day showed 2.37 kWh; its 24
 *  hourly rows add up to 56.9). An estimate until the backend sends kWh: hours
 *  a cabinet was offline count at the period's average power. */
export const periodEnergyKwh = (
  watt: number,
  label: string,
  type: ElectricityReportType,
  now: Dayjs,
): number => {
  const [start, end] = electricityPeriod(label, type)
  return start.isValid() ? (watt * elapsedHours(start, end, now)) / 1000 : 0
}

export type SummaryReportPeriod = 'HOURLY' | 'DAILY' | 'MONTHLY' | 'YEARLY'

/** The backend report each type reads — รายเดือน / รายปี are the backend's
 *  own whole-month / whole-year averages. */
export const REPORT_TYPE: Record<SummaryReportPeriod, ElectricityReportType> = {
  HOURLY: 'hourly',
  DAILY: 'daily',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
}

const DISPLAY_FORMAT: Record<SummaryReportPeriod, string> = {
  HOURLY: 'DD MMM BBBB HH:mm',
  DAILY: 'DD MMM BBBB',
  MONTHLY: 'MMM BBBB',
  YEARLY: 'BBBB',
}

export interface ReportPhase extends ElectricityPhaseData {
  kwh: number | null
}

/** One row of the summary table / one bar of its charts. */
export interface ReportRow {
  key: string
  /** วันที่ cell and export text. */
  display: string
  /** Chart x-axis label (hourly: compact two lines) and its tooltip header. */
  chartLabel: string
  chartTooltip?: string
  phases: ReportPhase[]
}

const th = (d: Dayjs) => d.locale('th')
const byPhase = (a: { phase: string }, b: { phase: string }) => a.phase.localeCompare(b.phase)

/** Monthly / yearly kWh per `${label}|${phase}` — the label as the backend
 *  writes it ("10/2026", "2026") — summed from the DAILY rows of the same
 *  range, so a cabinet that started mid-year, or sat dark for whole days,
 *  isn't credited with power for days it sent nothing. */
export const energyFromDailyRows = (
  dailyRows: ElectricityAggItem[],
  period: 'MONTHLY' | 'YEARLY',
  now: Dayjs,
): Map<string, number> => {
  const out = new Map<string, number>()
  for (const day of dailyRows) {
    const [dayStart] = electricityPeriod(day.label, 'daily')
    if (!dayStart.isValid()) continue
    const label = dayStart.format(period === 'MONTHLY' ? 'MM/YYYY' : 'YYYY')
    for (const phase of day.phases ?? []) {
      const key = `${label}|${phase.phase}`
      out.set(key, (out.get(key) ?? 0) + periodEnergyKwh(phase.watt, day.label, 'daily', now))
    }
  }
  return out
}

/** The summary report's rows from the backend rows of the report type, with
 *  Thai labels and each row's kWh: hourly / daily from the row's own average
 *  ({@link periodEnergyKwh}), monthly / yearly from `dailyEnergy` (see
 *  {@link energyFromDailyRows}) — `null` until that has loaded. */
export const buildReportRows = (
  rows: ElectricityAggItem[],
  period: SummaryReportPeriod,
  now: Dayjs,
  dailyEnergy?: Map<string, number> | null,
): ReportRow[] => {
  const type = REPORT_TYPE[period]
  const hourly = period === 'HOURLY'
  const fromDays = period === 'MONTHLY' || period === 'YEARLY'
  return rows.flatMap((row): ReportRow[] => {
    const [start] = electricityPeriod(row.label, type)
    if (!start.isValid() || !(row.phases ?? []).length) return []
    const display = th(start).format(DISPLAY_FORMAT[period])
    return [{
      key: row.label,
      display,
      // Hourly spans hundreds of columns — a compact two-line axis label,
      // the full text in the tooltip (2026-08-17).
      chartLabel: hourly ? `${th(start).format('DD MMM BB')}\n${start.format('HH:mm')}` : display,
      chartTooltip: hourly ? display : undefined,
      phases: [...row.phases].sort(byPhase).map((p) => ({
        ...p,
        kwh: fromDays ? dailyEnergy?.get(`${row.label}|${p.phase}`) ?? null : periodEnergyKwh(p.watt, row.label, type, now),
      })),
    }]
  })
}
