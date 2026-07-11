import dayjs from 'dayjs'
import React, { useMemo } from 'react'
import { TbTemperaturePlus } from 'react-icons/tb'
import LineChart, { type LineChartDataPoint } from '@/components/chart/LineChart'
import { APIResponseVMSDetail } from '@/types/vms/detail-api'

interface Props {
  data?: APIResponseVMSDetail
}

const WeatherChart: React.FC<Props> = (props) => {
  const { data } = props

  const chartData = useMemo<LineChartDataPoint[]>(() => {
    const logs = data?.vms_weather?.weather_logs
    if (!logs?.length) return []
    return logs.map((log) => {
      const hour = dayjs(log.hour_timestamp).format('HH')
      return {
        label: `${hour}.00`,
        temp: log.temperature,
        pm25: log.pm2,
      }
    })
  }, [data?.vms_weather?.weather_logs])

  return (
    <LineChart
      title='สถิติอุณหภูมิรายชั่วโมงประจำวัน'
      subtitle='เปรียบเทียบอุณหภูมิและค่า PM 2.5 รายชั่วโมง'
      icon={<TbTemperaturePlus className='fs-18' />}
      iconCircle={false}
      accentColor='var(--default-blue)'
      cardBackground='#00000080'
      cardBorderColor='transparent'
      showGlow={false}
      data={chartData}
      lines={[
        { dataKey: 'temp', color: '#FF8C00', label: 'อุณหภูมิ', unit: '°C' },
        { dataKey: 'pm25', color: '#FCD116', label: 'PM 2.5', unit: 'μg/m³' },
      ]}
      yAxisTicks={[0, 10, 20, 30, 40]}
      tooltipShowDot
      height={220}
    />
  )
}

export default React.memo(WeatherChart)
