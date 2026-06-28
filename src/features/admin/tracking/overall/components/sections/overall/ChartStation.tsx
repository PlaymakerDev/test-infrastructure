import Barchart from '@/components/chart/Barchart'
import { toWeightInspectionChartData } from '@/features/admin/tracking/overall/data/chartHelpers'
import { getTrackingWeightInspectionAPI } from '@/services/routes/TrackingService'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Empty, Skeleton } from 'antd'
import dayjs from 'dayjs'
import React, { useCallback, useMemo, useState } from 'react'
import { TbMapPin } from 'react-icons/tb'

interface Props { }

const BARS = [
  { color: '#66AEFF', dataKey: 'total', label: 'รถเข้าชั่งทั้งหมด' },
  { color: '#E94C4C', dataKey: 'overweight', label: 'รถเข้าชั่งน้ำหนักเกิน' },
]

const ChartStation: React.FC<Props> = () => {
  const [dateType, setDateType] = useState<'7Day' | 'month' | 'year'>('7Day')

  const handlePeriodChange = useCallback((period: 'วัน' | 'เดือน' | 'ปี') => {
    if (period === 'วัน') setDateType('7Day')
    else if (period === 'เดือน') setDateType('month')
    else setDateType('year')
  }, [])

  const { data, isLoading, isError, isPlaceholderData } = useQuery({
    queryKey: ['vehicle_weight_inspection', 'station', dateType],
    queryFn: () => getTrackingWeightInspectionAPI({
      date: dayjs().format('YYYY-MM-DD'),
      number_day: 6,
      date_type: dateType,
      station_type_id: 1,
    }),
    placeholderData: keepPreviousData,
  })

  const chartData = useMemo(
    () => toWeightInspectionChartData(data?.data?.data ?? [], dateType),
    [data, dateType]
  )

  const renderChart = useMemo(() => {
    if (isLoading || isPlaceholderData) return <Skeleton loading active paragraph={{ rows: 10 }} />
    if (isError) return <Empty description="ไม่พบข้อมูล" />
    return (
      <Barchart
        title='สถานีตรวจสอบน้ำหนัก'
        subtitle='สถิติผลการตรวจสอบน้ำหนัก'
        icon={<TbMapPin className='fs-22 shrink-0' />}
        iconCircle={false}
        bars={BARS}
        data={chartData}
        periods={['วัน', 'เดือน', 'ปี']}
        defaultPeriod='วัน'
        onPeriodChange={(item) => handlePeriodChange(item as 'วัน' | 'เดือน' | 'ปี')}
        cardBorderColor='transparent'
      />
    )
  }, [isLoading, isPlaceholderData, isError, chartData, handlePeriodChange])

  return renderChart
}

export default React.memo<Props>(ChartStation)
