import dayjs from 'dayjs'
import React, { useMemo } from 'react'
import { TbWind } from 'react-icons/tb'
import LineChart, { type LineChartDataPoint } from '@/components/chart/LineChart'
import { APIResponseVMSDetail } from '@/types/vms/detail-api'

interface Props {
  data?: APIResponseVMSDetail
}

const TemperatureChart: React.FC<Props> = ({ data }) => {
  const chartData = useMemo<LineChartDataPoint[]>(() => {
    const logs = data?.vms_weather?.weather_logs
    if (!logs?.length) return []
    return logs.map((log) => ({
      label: `${dayjs(log.hour_timestamp).format('HH')}.00`,
      windSpeed: log.wind_speed,
      humidity: log.humidity,
    }))
  }, [data?.vms_weather?.weather_logs])

  return (
    <LineChart
      title='สถิติความชื้นและความเร็วลมรายชั่วโมงประจำวัน'
      subtitle='เปรียบเทียบความชื้นและความเร็วลมรายชั่วโมง'
      icon={<TbWind className='fs-22' />}
      iconCircle={false}
      accentColor='var(--default-blue)'
      cardBackground='#00000080'
      cardBorderColor='transparent'
      showGlow={false}
      data={chartData}
      lines={[
        // windSpeed (km/h, single digits) shares almost nothing in scale with
        // humidity (%RH, 0-100) — on one shared axis one line always renders
        // as a flat, unreadable line. Give it its own (right) axis instead.
        { dataKey: 'windSpeed', color: '#A78BFA', label: 'ความเร็วลม', unit: 'km/h', yAxisIndex: 1 },
        { dataKey: 'humidity', color: '#60A5FA', label: 'ความชื้น', unit: '%RH' },
      ]}
      yAxisDomain={[0, 'auto']}
      secondaryYAxisDomain={[0, 'auto']}
      tooltipShowDot
      height={220}
    />
  )
}

export default React.memo(TemperatureChart)
