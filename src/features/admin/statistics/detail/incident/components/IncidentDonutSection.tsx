"use client"

import React, { useMemo } from 'react'
import { Alert, Button, Spin } from 'antd'
import { TbTrafficCone } from 'react-icons/tb'
import PieChart, { type PieChartDataPoint } from '@/components/chart/PieChart'
import {
  getEventTypeColor,
  getEventTypeLabel,
} from '@/features/admin/incident-detection/components/eventTypes'
import { useIncidentTransactions } from '@/hooks/queries/incident-detection'

interface IncidentDonutSectionProps {
  solutionId: string
  startDate?: string
  endDate?: string
}

const cardStyle: React.CSSProperties = {
  minHeight: 260,
  background: '#000000CC',
  border: '1px solid #1f2d3d',
  borderRadius: 16,
}

/** Statistics-specific donut with explicit query states. The generic incident
 * chart renders an empty series while its request fails, which looks like a
 * genuine zero-event response on this report page. */
const IncidentDonutSection: React.FC<IncidentDonutSectionProps> = ({
  solutionId,
  startDate,
  endDate,
}) => {
  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useIncidentTransactions({
    solution_id: solutionId,
    start_date: startDate,
    end_date: endDate,
  })

  const chartData = useMemo<PieChartDataPoint[]>(() => (
    (data?.summary?.type_details ?? [])
      .filter((item) => item.count > 0)
      .map((item) => ({
        name: getEventTypeLabel(item.analytic_type, item.type_name_th),
        value: item.count,
        color: getEventTypeColor(item.analytic_type),
      }))
  ), [data?.summary?.type_details])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={cardStyle}>
        <Spin size="large" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center p-4" style={cardStyle}>
        <Alert
          className="w-full"
          type="error"
          showIcon
          message="ไม่สามารถโหลดสัดส่วนประเภทเหตุการณ์ได้"
          action={<Button size="small" onClick={() => void refetch()}>ลองใหม่</Button>}
        />
      </div>
    )
  }

  return (
    <Spin spinning={isFetching}>
      <PieChart
        title="สัดส่วนประเภทเหตุการณ์"
        icon={<TbTrafficCone size={22} />}
        iconCircle={false}
        cardBackground="#000000CC"
        cardBorderColor="#1f2d3d"
        showGlow={false}
        data={chartData}
        centerLabel="ทั้งหมด"
        centerUnit="เหตุการณ์"
        donutSize={130}
        height={150}
        radius={['70%', '98%']}
        centerValueSize={28}
        centerLabelSize={14}
        centerUnitSize={14}
        centerLabelColor="#ffffff"
        centerUnitColor="#ffffff"
        legendMaxHeight={260}
      />
    </Spin>
  )
}

export default React.memo(IncidentDonutSection)
