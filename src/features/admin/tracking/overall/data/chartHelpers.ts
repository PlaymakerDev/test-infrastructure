import { BarChartDataPoint } from '@/components/chart/Barchart'
import { WeightInspectionData } from '@/types/tracking/overall-api'
import dayjs from 'dayjs'

const DAY_TH = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.']
const MONTH_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

export function toWeightInspectionChartData(
  items: WeightInspectionData[],
  dateType: '7Day' | 'month' | 'year'
): BarChartDataPoint[] {
  return items.map((item) => {
    const parts = item.create_date?.split('/')
    let label: string

    if (parts?.length === 2) {
      // Year view: backend returns "YYYY/MM" — show Thai month abbreviation
      const d = dayjs(item.create_date, 'YYYY/MM')
      label = d.isValid() ? MONTH_TH[d.month()] : item.create_date
    } else {
      // Daily/monthly view: backend returns "DD/MM/YYYY_BE" — use date_value (ISO) for dayjs
      const d = dayjs(item.date_value)
      label = dateType === '7Day'
        ? `${DAY_TH[d.day()]}\n${d.format('DD/MM')}`
        : d.format('D/M')
    }

    return { label, total: Number(item.total), overweight: Number(item.over) }
  })
}
