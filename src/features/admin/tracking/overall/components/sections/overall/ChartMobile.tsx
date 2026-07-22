import Barchart from '@/components/chart/Barchart'
import { toWeightInspectionChartData } from '@/features/admin/tracking/overall/data/chartHelpers'
import { useWeightInspection } from '@/features/admin/tracking/overall/hooks'
import { Empty, Skeleton } from 'antd'
import dayjs from 'dayjs'
import React, { useMemo, useState } from 'react'
import { TbUserCheck } from 'react-icons/tb'

interface Props { }

type Period = 'วัน' | 'เดือน' | 'ปี'
type DateType = '7Day' | 'month' | 'year'

const PERIOD_DATE_TYPE: Record<Period, DateType> = {
  'วัน': '7Day',
  'เดือน': 'month',
  'ปี': 'year',
}

const BARS = [
  { color: '#66AEFF', dataKey: 'total', label: 'รถเข้าชั่งทั้งหมด' },
  { color: '#E94C4C', dataKey: 'overweight', label: 'รถเข้าชั่งน้ำหนักเกิน' },
]

const ChartMobile: React.FC<Props> = () => {
  const [period, setPeriod] = useState<Period>('วัน')
  const dateType = PERIOD_DATE_TYPE[period]

  const { data, isLoading, isError, isPlaceholderData } = useWeightInspection({
    date: dayjs().format('YYYY-MM-DD'),
    number_day: 6,
    date_type: dateType,
    station_type_id: 2,
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
        title='หน่วยตรวจสอบน้ำหนักเคลื่อนที่'
        subtitle='สถิติผลการตรวจสอบน้ำหนัก'
        icon={<TbUserCheck className='fs-22 shrink-0' />}
        iconCircle={false}
        bars={BARS}
        data={chartData}
        periods={['วัน', 'เดือน', 'ปี']}
        activePeriod={period}
        onPeriodChange={(item) => setPeriod(item as Period)}
        cardBorderColor='transparent'
      />
    )
  }, [isLoading, isPlaceholderData, isError, chartData, period])

  return renderChart
}

export default React.memo<Props>(ChartMobile)
