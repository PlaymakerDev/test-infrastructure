import LineChart from '@/components/chart/LineChart'
import { useSumPlanChart } from '@/features/admin/tracking/overall/hooks'
import { Empty, Skeleton } from 'antd'
import dayjs from 'dayjs'
import React, { useMemo } from 'react'
import { TbClockShield } from 'react-icons/tb'

interface Props { }

const ChartPredictAccident: React.FC<Props> = () => {
  const { data, isLoading, isError } = useSumPlanChart({
    year: Number(dayjs().format('BBBB')),
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
        subtitle='เปรียบเทียบจำนวนแจ้งเตือนอุบัติการณ์และคาดการณ์การเกิดเหตุ'
        icon={<TbClockShield className='fs-22 text-(--default-blue)' />}
        iconCircle={false}
        accentColor='var(--default-blue)'
        cardBackground='#00000080'
        cardBorderColor='transparent'
        showGlow={false}
        data={chartData}
        lines={[
          { dataKey: 'plan', color: '#4ADE80', label: 'แจ้งเตือนอุบัติการณ์ (ครั้ง)' },
          { dataKey: 'result', color: '#E94C4C', label: 'คาดการณ์การเกิดเหตุ (จุด)' },
        ]}
        stats={[
          { value: allSum ? allSum.plan_total.toLocaleString() : '-', label: 'แจ้งเตือนอุบัติการณ์ (ครั้ง)', color: '#4ADE80' },
          { value: allSum ? allSum.result_total.toLocaleString() : '-', label: 'คาดการณ์การเกิดเหตุ (จุด)', color: '#E94C4C' },
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
