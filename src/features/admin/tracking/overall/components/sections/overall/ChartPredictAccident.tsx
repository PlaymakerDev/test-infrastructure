import LineChart from '@/components/chart/LineChart'
import { getTrackingViewSumPlanChartAPI } from '@/services/routes/TrackingService'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Empty, Skeleton } from 'antd'
import dayjs from 'dayjs'
import React, { useMemo } from 'react'
import { TbClockBolt } from 'react-icons/tb'

interface Props {}

const ChartPredictAccident: React.FC<Props> = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['sum_plan_chart'],
    queryFn: () => getTrackingViewSumPlanChartAPI({
      year: Number(dayjs().format('BBBB')),
    }),
    placeholderData: keepPreviousData,
  })

  const chartData = useMemo(() => {
    return (data?.data?.item ?? []).map((item) => ({
      label: item.month,
      plan: item.plan,
      result: item.result,
    }))
  }, [data])

  const allSum = data?.data?.all_sum

  const renderChart = useMemo(() => {
    if (isLoading) return <Skeleton loading active paragraph={{ rows: 10 }} />
    if (isError) return <Empty description="ไม่พบข้อมูล" />
    return (
      <LineChart
        title='คาดการณ์แนวโน้มการเกิดอุบัติเหตุ'
        subtitle='เปรียบเทียบจำนวนเที่ยวเดือนอุบัติการณ์ตามประเภทพาหนะ'
        icon={<TbClockBolt size={18} />}
        iconCircle={false}
        accentColor='#FFA94D'
        cardBackground='#00000080'
        cardBorderColor='transparent'
        showGlow={false}
        data={chartData}
        lines={[
          { dataKey: 'plan', color: '#4ADE80', label: 'เส้นเดือนอุบัติการณ์' },
          { dataKey: 'result', color: '#E94C4C', label: 'คาดการณ์เกิดเหตุ' },
        ]}
        stats={[
          { value: allSum ? allSum.plan_total.toLocaleString() : '-', label: 'เส้นเดือนอุบัติการณ์ (ครั้ง)', color: '#4ADE80' },
          { value: allSum ? allSum.result_total.toLocaleString() : '-', label: 'คาดการณ์เกิดเหตุ (จุด)', color: '#E94C4C' },
        ]}
        onPeriodChange={() => { }}
        height={260}
        tooltipShowDot
      />
    )
  }, [isLoading, isError, chartData, allSum])

  return renderChart
}

export default React.memo<Props>(ChartPredictAccident)
