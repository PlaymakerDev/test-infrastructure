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
  /** The electricity endpoint doesn't provide energy usage directly — derived
   *  from watt assuming the reading held for the full report period bucket:
   *  kWh = (watt * 3600) / 3,600,000 (reduces to watt / 1000). */
  kwh: number
  frequency: number
}
