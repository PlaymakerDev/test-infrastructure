import React from 'react'
import { TbTemperaturePlus } from 'react-icons/tb'
import LineChart, { type LineChartDataPoint } from '@/components/chart/LineChart'

const HOURS: LineChartDataPoint[] = [
  { label: '00.00', temp: 21, pm25: 0 },
  { label: '02.00', temp: 23, pm25: 0 },
  { label: '04.00', temp: 25, pm25: 1 },
  { label: '06.00', temp: 26, pm25: 1 },
  { label: '08.00', temp: 32, pm25: 3 },
  { label: '10.00', temp: 35, pm25: 5 },
  { label: '12.00', temp: 36, pm25: 7 },
  { label: '14.00', temp: 35, pm25: 9 },
  { label: '16.00', temp: 33, pm25: 11 },
  { label: '18.00', temp: 29, pm25: 15 },
  { label: '20.00', temp: 32, pm25: 14 },
  { label: '22.00', temp: 28, pm25: 12 },
]

const WeatherChart: React.FC = () => {
  return (
    <LineChart
      title='สถิติอุณหภูมิรายชั่วโมงประจำวัน'
      subtitle='เปรียบเทียบอุณหภูมิและค่า PM 2.5 รายชั่วโมง'
      icon={<TbTemperaturePlus size={20} />}
      accentColor='#FCD116'
      data={HOURS}
      lines={[
        { dataKey: 'temp', color: '#FF8C00', label: 'อุณหภูมิ', unit: '°C' },
        { dataKey: 'pm25', color: '#FCD116', label: 'PM 2.5', unit: 'μg/m³' },
      ]}
      yAxisTicks={[0, 10, 20, 30, 40]}
      tooltipDate='20 เม.ย. 2569'
      tooltipShowDot
      height={220}
    />
  )
}

export default React.memo(WeatherChart)
