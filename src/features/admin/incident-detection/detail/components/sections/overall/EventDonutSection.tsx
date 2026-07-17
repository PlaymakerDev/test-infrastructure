"use client"
import React, { useMemo } from 'react'
import { useParams } from 'next/navigation'
import dayjs from 'dayjs'
import { TbTrafficCone } from 'react-icons/tb'
import PieChart, { type PieChartDataPoint } from '@/components/chart/PieChart'
import {
  getEventTypeColor,
  getEventTypeLabel,
} from '@/features/admin/incident-detection/components/eventTypes'
import { useIncidentTransactions } from '@/hooks/queries/incident-detection'

interface Props {
  /** Overrides the route `[id]` param — lets other features (e.g. statistics'
   *  incident detail page, scoped by `?detail=<solutionId>`) reuse this same
   *  real-data section without being on the incident-detection detail route. */
  solutionId?: string
  /** Card height — default (170) matches the compact incident-detection
   *  detail-page rail; other consumers can size it to their own layout. */
  height?: number
  /** Donut circle size (px, square) — default (144) matches the compact rail. */
  donutSize?: number
  /** Legend scroll cap (px) — default (160) matches the compact rail. */
  legendMaxHeight?: number
  /** Override the date range (YYYY-MM-DD). Defaults to today. */
  startDate?: string
  endDate?: string
}

/** "สัดส่วนประเภทเหตุการณ์" — donut + legend (count + %).
 *  Source: /details/transactions summary.type_details — counts per event type
 *  for this solution's day. */
const EventDonutSection: React.FC<Props> = ({ solutionId: solutionIdProp, height = 170, donutSize = 144, legendMaxHeight = 160, startDate, endDate }) => {
  const params = useParams()
  const solutionId = solutionIdProp ?? (Array.isArray(params.id) ? params.id[0] : params.id)
  const today = dayjs().format('YYYY-MM-DD')
  const start_date = startDate ?? today
  const end_date = endDate ?? today
  const { data } = useIncidentTransactions({
    solution_id: solutionId,
    start_date,
    end_date,
  })

  // Drop zero-count types so the donut/legend show only types that actually
  // occurred — keeps small datasets readable.
  const chartData: PieChartDataPoint[] = useMemo(() => {
    const items = data?.summary?.type_details ?? []
    return items
      .filter((t) => t.count > 0)
      .map((t) => ({
        name: getEventTypeLabel(t.analytic_type, t.type_name_th),
        value: t.count,
        color: getEventTypeColor(t.analytic_type),
      }))
  }, [data?.summary])

  return (
    <PieChart
      title='สัดส่วนประเภทเหตุการณ์'
      icon={<TbTrafficCone size={22} />}
      iconCircle={false}
      cardBackground='#000000CC'
      cardBorderColor='#1f2d3d'
      showGlow={false}
      data={chartData}
      centerLabel='ทั้งหมด'
      centerUnit='เหตุการณ์'
      donutSize={130}
      height={150}
      // Thicker ring — grow the OUTER radius (like the hover expand) while
      // keeping the inner hole roughly the same so the center text still fits.
      radius={['70%', '98%']}
      centerValueSize={28}
      centerLabelSize={10}
      centerUnitSize={10}
      centerLabelColor='#ffffff'
      centerUnitColor='#ffffff'
      legendMaxHeight={legendMaxHeight}
    />
  )
}

export default React.memo(EventDonutSection)
