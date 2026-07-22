import React, { useMemo } from 'react'
import LineChart from '@/components/chart/LineChart'
import { useQuery } from '@tanstack/react-query'
import { getTrackingGPSHourlyTrafficAPI } from '@/services/routes/TrackingGPSService'
import { Empty, Skeleton } from 'antd'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'

dayjs.extend(buddhistEra)
dayjs.locale('th')

interface Props {

}

const ChartHourTraffic: React.FC<Props> = (props) => {
  const { } = props

  const { data, isLoading, isError } = useQuery({
    queryKey: ['hour_traffic'],
    queryFn: () => getTrackingGPSHourlyTrafficAPI({})
  })

  const chartData = useMemo(() => {
    const list = data?.data ?? []
    return list.map((item) => ({
      label: `${String(item.hour).padStart(2, '0')}.00`,
      total: item.total,
    }))
  }, [data])

  const renderLineChart = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 4 }} />
    return (
      <LineChart
        // title/subtitle/icon จัดการโดย TrafficAndVehicleSection (parent) แล้ว
        accentColor='transparent'
        cardBackground='transparent'
        cardBorderColor='transparent'
        showGlow={false}
        data={chartData}
        lines={[
          { dataKey: 'total', color: '#FCD116', label: 'รถบรรทุกทั้งหมด' },
        ]}
        tooltipDate={dayjs().format('DD MMM BBBB')}
        tooltipUnit='คัน'
        tooltipShowDot
        xAxisLabelInterval={1}
        height={319}
        className='p-0'
      />
    )
  }, [isLoading, chartData])

  if (isError) return <Empty description="ไม่สามารถโหลดข้อมูลได้" />

  return renderLineChart
}

export default React.memo<Props>(ChartHourTraffic)
