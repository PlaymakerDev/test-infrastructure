import type { BarChartDataPoint } from '@/components/chart/Barchart'
import type { LineChartDataPoint } from '@/components/chart/LineChart'

/** Mock — 7-day lamp UP/DOWN history (until API is wired). */
export const LAMP_STATUS_7D: BarChartDataPoint[] = [
  { label: '20\nเม.ย.', up: 286, down: 128 },
  { label: '21\nเม.ย.', up: 290, down: 124 },
  { label: '22\nเม.ย.', up: 282, down: 132 },
  { label: '23\nเม.ย.', up: 288, down: 126 },
  { label: '24\nเม.ย.', up: 284, down: 130 },
  { label: '25\nเม.ย.', up: 292, down: 122 },
  { label: '26\nเม.ย.', up: 286, down: 128 },
]

/** Mock — 24-hour average current (Amp), 2-hour buckets. */
export const AMP_24H: LineChartDataPoint[] = [
  { label: '00.00', amp: 42, date: '20 เม.ย. 2569' },
  { label: '02.00', amp: 38, date: '20 เม.ย. 2569' },
  { label: '04.00', amp: 35, date: '20 เม.ย. 2569' },
  { label: '06.00', amp: 48, date: '20 เม.ย. 2569' },
  { label: '08.00', amp: 75.2, date: '20 เม.ย. 2569' },
  { label: '10.00', amp: 68, date: '20 เม.ย. 2569' },
  { label: '12.00', amp: 72, date: '20 เม.ย. 2569' },
  { label: '14.00', amp: 65, date: '20 เม.ย. 2569' },
  { label: '16.00', amp: 58, date: '20 เม.ย. 2569' },
  { label: '18.00', amp: 52, date: '20 เม.ย. 2569' },
  { label: '20.00', amp: 46, date: '20 เม.ย. 2569' },
  { label: '22.00', amp: 40, date: '20 เม.ย. 2569' },
  { label: '24.00', amp: 38, date: '20 เม.ย. 2569' },
]
