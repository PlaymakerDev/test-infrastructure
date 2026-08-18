import LineChart from '@/components/chart/LineChart'
import { useSumPlanChart } from '@/features/admin/tracking/overall/hooks'
import { isFuturePlanMonth } from '@/features/admin/tracking/overall/data/planChart'
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
      monthYearLabel: `${item.month} ${item.year}`,
      plan: item.plan,
      // Backend carries the latest cumulative result into future months —
      // null it so the result line stops at the current month (planChart.ts).
      result: isFuturePlanMonth(item) ? null : item.result,
    }))
  }, [data])

  const allSum = data?.data?.all_sum

  const renderChart = useMemo(() => {
    if (isLoading) return <Skeleton loading active paragraph={{ rows: 10 }} />
    if (isError) return <Empty description="ไม่พบข้อมูล" />
    return (
      <LineChart
        title='แผนงานและผลการจัดตั้งหน่วยชั่งเคลื่อนที่'
        subtitle={`ประจำปีงบประมาณ ${data?.data.plan_year || '-'}`}
        icon={<TbClockShield className='fs-22 text-(--default-blue)' />}
        iconCircle={false}
        accentColor='var(--default-blue)'
        cardBackground='#00000080'
        cardBorderColor='transparent'
        showGlow={false}
        data={chartData}
        lines={[
          { dataKey: 'plan', color: '#4ADE80', label: 'แผนที่วางไว้' },
          { dataKey: 'result', color: '#E94C4C', label: 'ผลที่ดำเนินการ' },
        ]}
        stats={[
          { value: allSum ? allSum.plan_total.toLocaleString() : '-', label: 'แผนที่วางไว้', color: '#4ADE80' },
          { value: allSum ? allSum.result_total.toLocaleString() : '-', label: 'ผลที่ดำเนินการ', color: '#E94C4C' },
        ]}
        onPeriodChange={() => { }}
        height={260}
        // Future months carry result: null — render a gap, not a 0-plunge.
        preserveNullValues
        tooltipShowDot
        tooltipDateKey='monthYearLabel'
        tooltipSimpleHeader
      />
    )
  }, [isLoading, isError, chartData, allSum])

  return renderChart
}

export default React.memo<Props>(ChartPredictAccident)
