"use client"
import React, { useMemo } from 'react'
import { useParams } from 'next/navigation'
import dayjs from 'dayjs'
import { TbCar } from 'react-icons/tb'
import LineChart, { type LineChartDataPoint } from '@/components/chart/LineChart'
import {
  getEventTypeColor,
  getEventTypeLabel,
} from '@/features/admin/incident-detection/components/eventTypes'
import { useIncidentDaily } from '@/hooks/queries/incident-detection'

/** "แนวโน้มเหตุการณ์รายวัน" — 7-day trend, one line per event type that
 *  actually occurred. Source: /analytic/details?solution_id=&start_date=&end_date=. */
const EventTrendSection: React.FC = () => {
  const params = useParams()
  const solutionId = Array.isArray(params.id) ? params.id[0] : params.id

  // Last 7 days inclusive (today − 6 .. today).
  const end = dayjs().format('YYYY-MM-DD')
  const start = dayjs().subtract(6, 'day').format('YYYY-MM-DD')
  const { data } = useIncidentDaily({
    solution_id: solutionId,
    start_date: start,
    end_date: end,
  })

  // Find every type that has at least one non-zero count across the range —
  // only those become lines. Skipping zeros avoids 9 flat-zero lines crowding
  // the chart on quiet days.
  const { chartData, lines, yMax } = useMemo(() => {
    // API returns buckets newest-first; sort ascending by date so the latest
    // day sits on the RIGHT of the x-axis (oldest → newest, left → right).
    const buckets = [...(data ?? [])].sort((a, b) => a.date.localeCompare(b.date))
    // typeId → row dataKey (`t-${id}`) → highest count seen.
    const activeTypes = new Map<number, { label: string; maxCount: number }>()
    for (const bucket of buckets) {
      for (const item of bucket.data) {
        if (item.count > 0) {
          const existing = activeTypes.get(item.analytic_type_id)
          if (existing) existing.maxCount = Math.max(existing.maxCount, item.count)
          else activeTypes.set(item.analytic_type_id, {
            label: getEventTypeLabel(item.analytic_type_id, item.analytic_name_th),
            maxCount: item.count,
          })
        }
      }
    }
    const linesOut = Array.from(activeTypes.entries()).map(([id, info]) => ({
      dataKey: `t-${id}`,
      color: getEventTypeColor(id),
      label: info.label,
    }))
    const rows: LineChartDataPoint[] = buckets.map((bucket) => {
      // `label` = day name on the axis; `dateText` = full BE date shown in the
      // tooltip header (e.g. "24/06/2569").
      const d = dayjs(bucket.date)
      const row: LineChartDataPoint = {
        label: bucket.date_label || bucket.date,
        dateText: d.isValid() ? `${d.format('DD/MM/')}${d.year() + 543}` : bucket.date,
      }
      for (const item of bucket.data) {
        row[`t-${item.analytic_type_id}`] = item.count
      }
      // Make sure every series has a numeric value (no missing points).
      for (const [id] of activeTypes) {
        if (row[`t-${id}`] == null) row[`t-${id}`] = 0
      }
      return row
    })
    const max = Math.max(0, ...Array.from(activeTypes.values()).map((t) => t.maxCount))
    return { chartData: rows, lines: linesOut, yMax: max }
  }, [data])

  // 0..max ticks (whole numbers). Cap to ~4 ticks so the y-axis stays compact.
  const yAxisTicks = useMemo(() => {
    if (yMax === 0) return [0, 1]
    const step = Math.max(1, Math.ceil(yMax / 4))
    const ticks: number[] = []
    for (let v = 0; v <= yMax; v += step) ticks.push(v)
    if (ticks[ticks.length - 1] !== yMax) ticks.push(yMax)
    return ticks
  }, [yMax])

  return (
    <LineChart
      title='แนวโน้มเหตุการณ์รายวัน'
      icon={<TbCar size={22} />}
      iconCircle={false}
      cardBackground='#000000CC'
      cardBorderColor='#1f2d3d'
      showGlow={false}
      data={chartData}
      lines={lines}
      yAxisTicks={yAxisTicks}
      height={180}
      tooltipShowDot
      // Show the full date in the tooltip header (axis label stays the day name).
      tooltipDateKey='dateText'
      tooltipDateSuffix=''
    />
  )
}

export default React.memo(EventTrendSection)
