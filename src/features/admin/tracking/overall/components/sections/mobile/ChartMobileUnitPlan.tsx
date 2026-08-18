"use client"
import React, { useMemo } from 'react'
import LineChart from '@/components/chart/LineChart'
import { APIResponseTrackingViewSumPlanChart } from '@/types/tracking/overall-api'
import { isFuturePlanMonth } from '../../../data/planChart'

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
      // Months that haven't happened yet: the backend carries the latest
      // cumulative `result` forward into them (see planChart.ts) — null the
      // result so the pink line STOPS at the current month instead of
      // pretending future months already have results. `plan` stays (a plan
      // covers the whole fiscal year).
      if (isFuturePlanMonth(item)) {
        return { label: item.month, plan: item.plan, result: null, diff: '-' }
      }
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
      // Future months carry result: null — keep them as a GAP (line stops at
      // the current month) instead of the default null→0 plunge.
      preserveNullValues
      tooltipShowDot
      tooltipExtras={[
        { dataKey: 'diff', label: 'เปรียบเทียบแผน-ผล', color: '#8a9ab5' },
      ]}
      height={280}
    />
  )
}

export default React.memo(ChartMobileUnitPlan)
