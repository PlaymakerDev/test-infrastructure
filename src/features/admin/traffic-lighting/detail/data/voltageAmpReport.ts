export const COLOR_VOLTAGE_CYAN = '#66AEFF'
export const COLOR_PHASE_GREEN = '#7BFF66'
export const COLOR_PHASE_YELLOW = '#FCD116'
export const COLOR_AMP_ORANGE = '#FF9F43'

/** Flattened API row used by the report table. */
export interface VoltageAmpTableRow {
  key: string
  date: string
  voltage: number
  amp: number
  watt: number
  powerFactor: number
  /** The current electricity endpoint does not provide energy usage. */
  kwh: null
  frequency: number
}
