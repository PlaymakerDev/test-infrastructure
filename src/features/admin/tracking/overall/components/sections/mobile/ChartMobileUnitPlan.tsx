"use client"
import React, { useMemo } from 'react'
import LineChart from '@/components/chart/LineChart'
import { APIResponseTrackingViewSumPlanChart } from '@/types/tracking/overall-api'

const LINES = [
  { dataKey: 'plan', color: '#4ADE80', label: 'แผนการดำเนินงาน' },
  { dataKey: 'result', color: '#F472B6', label: 'ผลการดำเนินงาน' },
]

interface Props {
  data?: APIResponseTrackingViewSumPlanChart
}

const ChartMobileUnitPlan: React.FC<Props> = (props) => {
  const { data } = props

  const chartData = useMemo(() => {
    return (data?.item ?? []).map((item) => {
      const diff = item.plan - item.result
      const total = item.plan + item.result
      const percent = total > 0 ? Math.round((Math.abs(diff) / total) * 1000) / 10 : 0
      const sign = diff >= 0 ? '+' : '-'
      const color = diff >= 0 ? 'var(--default-blue)' : 'var(--red)'
      return {
        label: item.month,
        plan: item.plan,
        result: item.result,
        diff: `${diff.toLocaleString()} <span style="color:${color};font-weight:700">(${sign}${percent}%)</span>`,
      }
    })
  }, [data])

  return (
    <LineChart
      className='relative w-full h-full overflow-hidden'
      accentColor='transparent'
      cardBackground='transparent'
      cardBorderColor='transparent'
      showGlow={false}
      data={chartData}
      lines={LINES}
      tooltipShowDot
      tooltipExtras={[
        { dataKey: 'diff', label: 'เปรียบเทียบแผน-ผล', color: '#8a9ab5' },
      ]}
      height={280}
    />
  )
}

export default React.memo(ChartMobileUnitPlan)
