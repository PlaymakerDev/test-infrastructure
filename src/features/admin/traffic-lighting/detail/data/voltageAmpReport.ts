export const COLOR_VOLTAGE_CYAN = '#66AEFF'
export const COLOR_PHASE_GREEN = '#7BFF66'
export const COLOR_PHASE_YELLOW = '#FCD116'
export const COLOR_AMP_ORANGE = '#FF9F43'

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
