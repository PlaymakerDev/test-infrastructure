import type { BarChartDataPoint } from '@/components/chart/Barchart'

export const COLOR_VOLTAGE_CYAN = '#66AEFF'
export const COLOR_PHASE_GREEN = '#7BFF66'
export const COLOR_PHASE_YELLOW = '#FCD116'
export const COLOR_AMP_ORANGE = '#FF9F43'

export const VOLTAGE_AVG = 258.29
export const AMP_AVG = 2.93

export const VOLTAGE_BARS = [
  { dataKey: 'p1', color: COLOR_VOLTAGE_CYAN, label: 'Phase 1' },
  { dataKey: 'p2', color: COLOR_PHASE_GREEN, label: 'Phase 2' },
  { dataKey: 'p3', color: COLOR_PHASE_YELLOW, label: 'Phase 3' },
] as const

export const AMP_BARS = [
  { dataKey: 'p1', color: COLOR_VOLTAGE_CYAN, label: 'Phase 1' },
  { dataKey: 'p2', color: COLOR_PHASE_GREEN, label: 'Phase 2' },
  { dataKey: 'p3', color: COLOR_AMP_ORANGE, label: 'Phase 3' },
] as const

/** 7-day bar chart data — 20–26 เม.ย. 2569 */
export const VOLTAGE_CHART_DATA: BarChartDataPoint[] = [
  { label: '20\nเม.ย.', p1: 256.2, p2: 260.8, p3: 258.1 },
  { label: '21\nเม.ย.', p1: 257.5, p2: 259.4, p3: 257.9 },
  { label: '22\nเม.ย.', p1: 255.8, p2: 261.2, p3: 259.6 },
  { label: '23\nเม.ย.', p1: 258.9, p2: 260.1, p3: 258.4 },
  { label: '24\nเม.ย.', p1: 259.1, p2: 258.7, p3: 257.2 },
  { label: '25\nเม.ย.', p1: 257.3, p2: 259.8, p3: 260.5 },
  { label: '26\nเม.ย.', p1: 258.6, p2: 260.3, p3: 259.0 },
]

export const AMP_CHART_DATA: BarChartDataPoint[] = [
  { label: '20\nเม.ย.', p1: 2.88, p2: 2.95, p3: 2.91 },
  { label: '21\nเม.ย.', p1: 2.92, p2: 2.89, p3: 2.94 },
  { label: '22\nเม.ย.', p1: 2.85, p2: 2.97, p3: 2.93 },
  { label: '23\nเม.ย.', p1: 2.94, p2: 2.91, p3: 2.88 },
  { label: '24\nเม.ย.', p1: 2.90, p2: 2.96, p3: 2.92 },
  { label: '25\nเม.ย.', p1: 2.93, p2: 2.87, p3: 2.95 },
  { label: '26\nเม.ย.', p1: 2.91, p2: 2.94, p3: 2.89 },
]

export interface VoltageAmpTableRow {
  key: string
  date: string
  voltage: number
  amp: number
  watt: number
  powerFactor: number
  kwh: number
  frequency: number
}

export const VOLTAGE_AMP_TABLE_ROWS: VoltageAmpTableRow[] = [
  { key: '1', date: '20 เม.ย. 2569', voltage: 258.45, amp: 2.91, watt: 752.50, powerFactor: 0.97, kwh: 18.06, frequency: 50.02 },
  { key: '2', date: '21 เม.ย. 2569', voltage: 258.12, amp: 2.92, watt: 753.71, powerFactor: 0.97, kwh: 18.12, frequency: 50.01 },
  { key: '3', date: '22 เม.ย. 2569', voltage: 258.67, amp: 2.90, watt: 750.14, powerFactor: 0.96, kwh: 18.00, frequency: 50.03 },
  { key: '4', date: '23 เม.ย. 2569', voltage: 258.29, amp: 2.94, watt: 759.37, powerFactor: 0.97, kwh: 18.22, frequency: 50.02 },
  { key: '5', date: '24 เม.ย. 2569', voltage: 258.01, amp: 2.93, watt: 755.97, powerFactor: 0.97, kwh: 18.14, frequency: 50.04 },
  { key: '6', date: '25 เม.ย. 2569', voltage: 258.88, amp: 2.91, watt: 753.34, powerFactor: 0.97, kwh: 18.08, frequency: 50.01 },
  { key: '7', date: '26 เม.ย. 2569', voltage: 258.42, amp: 2.92, watt: 754.59, powerFactor: 0.97, kwh: 18.10, frequency: 50.03 },
]

export const VOLTAGE_AMP_TABLE_AVERAGES = {
  voltage: 258.29,
  amp: 2.93,
  watt: 754.23,
  powerFactor: 0.97,
  kwh: 18.10,
  frequency: 50.02,
}
