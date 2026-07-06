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

/** "สัดส่วนประเภทเหตุการณ์" — donut + legend (count + %).
 *  Source: /details/transactions summary.type_details — counts per event type
 *  for this solution's day. */
const EventDonutSection: React.FC = () => {
  const params = useParams()
  const solutionId = Array.isArray(params.id) ? params.id[0] : params.id
  const today = dayjs().format('YYYY-MM-DD')
  const { data } = useIncidentTransactions({
    solution_id: solutionId,
    start_date: today,
    end_date: today,
    limit: 1,
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
      centerLabel='เหตุการณ์ทั้งหมด'
      centerUnit='เหตุการณ์'
      donutSize={144}
      height={170}
      // Thicker ring — grow the OUTER radius (like the hover expand) while
      // keeping the inner hole roughly the same so the center text still fits.
      radius={['70%', '98%']}
      centerValueSize={28}
      centerLabelSize={10}
      centerUnitSize={10}
      centerLabelColor='#ffffff'
      centerUnitColor='#ffffff'
      legendMaxHeight={160}
    />
  )
}

export default React.memo(EventDonutSection)
