"use client"
import React from 'react'
import { TbActivity } from 'react-icons/tb'
import LineChart, { type LineChartDataPoint } from '@/components/chart/LineChart'

interface Props { }

const COLOR_ET = '#05DEF2'
const COLOR_TIME = '#D000FF'
const COLOR_CO2 = '#FC169C'

/** Early Termination Analysis — visible chart shows only the ET Rate line.
 *  Time-saved + CO2-saved values come along in the tooltip via `tooltipExtras`. */
const HOURS: LineChartDataPoint[] = [
  { label: '00.00', et: 88, time: 35, co2: 6.5 },
  { label: '02.00', et: 86, time: 32, co2: 6.0 },
  { label: '04.00', et: 92, time: 38, co2: 7.2 },
  { label: '06.00', et: 96, time: 45, co2: 8.5 },
  { label: '08.00', et: 90, time: 40, co2: 7.6 },
  { label: '10.00', et: 86, time: 34, co2: 6.4 },
  { label: '12.00', et: 84, time: 30, co2: 5.8 },
  { label: '14.00', et: 78, time: 42, co2: 7.5 },
  { label: '16.00', et: 82, time: 33, co2: 6.5 },
  { label: '18.00', et: 88, time: 38, co2: 7.0 },
  { label: '20.00', et: 92, time: 40, co2: 7.4 },
  { label: '22.00', et: 80, time: 32, co2: 6.0 },
  { label: '24.00', et: 76, time: 28, co2: 5.4 },
]

const ChartETAnalysisTrafficSignal: React.FC<Props> = () => {
  return (
    <LineChart
      title='Early Termination Analysis'
      subtitle='เปรียบเทียบการประหยัดเวลาและพลังงานตามช่วงเวลา'
      icon={<TbActivity size={30} />}
      accentColor='#66AEFF'
      iconCircle={false}
      showGlow={false}
      data={HOURS}
      lines={[
        { dataKey: 'et', color: COLOR_ET, label: 'ET Rate', unit: '%' },
      ]}
      stats={[
        { value: '93%', label: 'Avg ET Rate', color: COLOR_ET },
        { value: '835 m', label: 'ประหยัดเวลา', color: COLOR_TIME },
        { value: '150 kg', label: 'ลดปริมาณ CO2', color: COLOR_CO2 },
      ]}
      tooltipExtras={[
        { dataKey: 'time', label: 'ประหยัดเวลา', color: COLOR_TIME, unit: 'm' },
        { dataKey: 'co2', label: 'ลด CO2', color: COLOR_CO2, unit: 'kg' },
      ]}
      yAxisTicks={[0, 25, 50, 75, 100]}
      height={260}
      tooltipDate='20 เม.ย. 2569'
      tooltipShowDot
    />
  )
}

export default React.memo<Props>(ChartETAnalysisTrafficSignal)
