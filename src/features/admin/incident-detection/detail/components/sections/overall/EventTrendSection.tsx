"use client"
import React, { useMemo } from 'react'
import { useParams } from 'next/navigation'
import dayjs from 'dayjs'
import { TbCar } from 'react-icons/tb'
import LineChart, { type LineChartDataPoint } from '@/components/chart/LineChart'
import { thaiDateBE } from '@/utils/thaiDate'
import {
  getEventTypeColor,
  getEventTypeLabel,
} from '@/features/admin/incident-detection/components/eventTypes'
import { useIncidentDaily, useIncidentPeakHour } from '@/hooks/queries/incident-detection'

/** Short Thai weekday (0=Sun) — keeps all 7 x-axis labels visible (full names
 *  like "วันอาทิตย์" overlap and ECharts hides half of them). */
const THAI_DAY_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.']

interface Props {
  /** Overrides the route `[id]` param — lets other features (e.g. statistics'
   *  incident detail page, scoped by `?detail=<solutionId>`) reuse this same
   *  real-data section without being on the incident-detection detail route. */
  solutionId?: string
  /** Card height — default (146) matches the compact incident-detection
   *  detail-page rail; other consumers can size it to their own layout. */
  height?: number
  /** Show the "ช่วงเวลาที่มีปริมาณเหตุการณ์สูงสุดประจำวัน" (today's peak-hour)
   *  corner badge. Default false — incident-detection/detail already shows
   *  this same data in its own EventStatsSection card, so it stays off there
   *  to avoid showing it twice. */
  showPeakBadge?: boolean
  /** Override the date range (YYYY-MM-DD). Defaults to last 7 days. */
  startDate?: string
  endDate?: string
}

/** "แนวโน้มเหตุการณ์รายวัน" — 7-day trend, one line per event type that
 *  actually occurred. Source: /analytic/details?solution_id=&start_date=&end_date=. */
const EventTrendSection: React.FC<Props> = ({ solutionId: solutionIdProp, height = 146, showPeakBadge = false, startDate, endDate }) => {
  const params = useParams()
  const solutionId = solutionIdProp ?? (Array.isArray(params.id) ? params.id[0] : params.id)

  // Last 7 days inclusive (today − 6 .. today) unless overridden by props.
  const end = endDate ?? dayjs().format('YYYY-MM-DD')
  const start = startDate ?? dayjs().subtract(6, 'day').format('YYYY-MM-DD')
  const { data } = useIncidentDaily({
    solution_id: solutionId,
    start_date: start,
    end_date: end,
  })

  // Today's peak-hour window — GET /analytic/details/peak-hour?solution_id=.
  // Same source EventStatsSection's card already uses; TanStack Query dedupes
  // the request when both are mounted on the same page.
  const { data: peak } = useIncidentPeakHour(showPeakBadge ? solutionId : undefined)
  const peakBadge = showPeakBadge && peak?.label && peak.count > 0
    ? { range: `${peak.label} น.`, pct: peak.percentage }
    : null

  // Find every type that has at least one non-zero count across the range —
  // only those become lines. Skipping zeros avoids 9 flat-zero lines crowding
  // the chart on quiet days.
  const { chartData, lines, yMax } = useMemo(() => {
    // Fixed weekday axis order ส. อา. จ. อ. พ. พฤ. ศ. (Sat→Fri), not a
    // chronological rolling window — any 7-day range covers each weekday
    // exactly once, so this reorders them into a stable, always-the-same
    // axis layout instead of shifting with "today".
    const weekOrder = (dateStr: string) => (dayjs(dateStr).day() + 1) % 7
    const buckets = [...(data ?? [])].sort((a, b) => weekOrder(a.date) - weekOrder(b.date))
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
      // `label` = day name on the axis; `dateText` = full Thai BE date shown in
      // the tooltip header (e.g. "24 มิ.ย. 2569").
      const d = dayjs(bucket.date)
      const row: LineChartDataPoint = {
        // Short weekday on the axis so all 7 days fit; full BE date in tooltip.
        label: d.isValid() ? THAI_DAY_SHORT[d.day()] : (bucket.date_label || bucket.date),
        dateText: d.isValid() ? thaiDateBE(bucket.date) : bucket.date,
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

  // Evenly-spaced whole-number ticks (~4 steps). Round the TOP up to a multiple
  // of the step so the last gap matches the others — appending the raw max
  // produced an uneven final tick (e.g. …9,10 sitting cramped together).
  const yAxisTicks = useMemo(() => {
    if (yMax === 0) return [0, 1]
    const step = Math.max(1, Math.ceil(yMax / 4))
    const top = Math.ceil(yMax / step) * step
    const ticks: number[] = []
    for (let v = 0; v <= top; v += step) ticks.push(v)
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
      height={height}
      // Card has spare space — pull the plot down (default 28 leaves a big gap
      // under the labels) and up closer to the title.
      gridBottom={8}
      gridTop={4}
      tooltipShowDot
      // Show the full date in the tooltip header (axis label stays the day name).
      tooltipDateKey='dateText'
      tooltipDateSuffix=''
    />
  )
}

export default React.memo(EventTrendSection)
