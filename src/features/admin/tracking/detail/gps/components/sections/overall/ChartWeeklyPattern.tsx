import React, { useMemo } from 'react'
import BarChart from '@/components/chart/Barchart'
import { useQuery } from '@tanstack/react-query'
import { getTrackingGPSAnalyticWeeklyPatternAPI } from '@/services/routes/TrackingGPSService'
import { Empty, Skeleton } from 'antd'
import dayjs from 'dayjs'

interface Props {

}

const WEEKDAY_COLOR = '#FCD116'
const WEEKEND_COLOR = '#05F2DB'

// dow: สมมติ convention เดียวกับ dayjs().day() คือ 0=อาทิตย์ ... 6=เสาร์ — ยังไม่ได้ยืนยัน
// กับ backend ว่าใช้ index เดียวกันหรือไม่ (ไม่มีตัวอย่าง response จริงตอนเขียน)
const DOW_LABELS: Record<number, string> = {
  0: 'อา.', 1: 'จ.', 2: 'อ.', 3: 'พ.', 4: 'พฤ.', 5: 'ศ.', 6: 'ส.',
}
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] // จ. -> อา.

const ChartWeeklyPattern: React.FC<Props> = (props) => {
  const { } = props

  const { data, isLoading, isError } = useQuery({
    queryKey: ['analytic_weekly_pattern'],
    queryFn: () => getTrackingGPSAnalyticWeeklyPatternAPI({})
  })

  const chartData = useMemo(() => {
    const list = data?.data.data ?? []
    const avgByDow = new Map(list.map((item) => [item.dow, item.avg_vehicles]))
    const monday = dayjs().day(1)
    return WEEK_ORDER.map((dow) => {
      const value = avgByDow.get(dow) ?? 0
      const isWeekend = dow === 0 || dow === 6
      const date = monday.add(dow === 0 ? 6 : dow - 1, 'day')
      return {
        label: `${DOW_LABELS[dow]}\n${date.format('DD/MM')}`,
        weekday: isWeekend ? 0 : value,
        weekend: isWeekend ? value : 0,
      }
    })
  }, [data])

  const weekdayTotal = useMemo(() => chartData.reduce((sum, d) => sum + d.weekday, 0), [chartData])
  const weekendTotal = useMemo(() => chartData.reduce((sum, d) => sum + d.weekend, 0), [chartData])

  const renderLineChart = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 4 }} />
    return (
      <BarChart
        data={chartData}
        bars={[
          { dataKey: 'weekday', color: WEEKDAY_COLOR, label: 'วันทำการ' },
          { dataKey: 'weekend', color: WEEKEND_COLOR, label: 'วันหยุดเสาร์-อาทิตย์' },
        ]}
        stats={[
          { value: weekdayTotal, label: 'วันทำการ', color: WEEKDAY_COLOR },
          { value: weekendTotal, label: 'วันหยุดเสาร์-อาทิตย์', color: WEEKEND_COLOR },
        ]}
        tooltipUnit='คัน'
        cardBorderColor='transparent'
        accentColor='transparent'
        cardBackground='transparent'
        height={260}
        cardClassName='p-0'
      />
    )
  }, [isLoading, chartData, weekdayTotal, weekendTotal])

  if (isError) return <Empty description="ไม่สามารถโหลดข้อมูลได้" />

  return renderLineChart
}

export default React.memo<Props>(ChartWeeklyPattern)
