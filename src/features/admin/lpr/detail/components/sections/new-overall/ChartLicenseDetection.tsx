"use client"
import React, { useMemo } from 'react'
import dayjs from 'dayjs'
import { IconLPR } from '@/components/icon'
import LineChart, { type LineChartDataPoint } from '@/components/chart/LineChart'
import { thaiDateBE } from '@/utils/thaiDate'
import { useLPRDetailContext } from '../../../context'
import { useQuery } from '@tanstack/react-query'
import { Empty, Skeleton } from 'antd'
import { getLPRHourlyCountAPI } from '@/services/routes/NewLPRService'

interface Props {

}

const ChartLicenseDetection: React.FC<Props> = () => {
  const { solutionId } = useLPRDetailContext()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['lpr-hourly-count', solutionId],
    queryFn: () => getLPRHourlyCountAPI(solutionId, {
      date: dayjs().format('YYYY-MM-DD')
    }),
    enabled: !!solutionId,
  })

  const dateLabel = useMemo(() => thaiDateBE(dayjs().format('YYYY-MM-DD')), [])

  // Fill all 24 hours so a quiet early-morning hour still renders as 0 instead
  // of being skipped — keeps the x-axis evenly spaced regardless of which
  // hours the backend actually returned data for.
  const hours = useMemo<LineChartDataPoint[]>(() => {
    const byHour = new Map((data?.data?.hourly ?? []).map((b) => [b.hour, b.count]))
    return Array.from({ length: 24 }, (_, h) => ({
      label: `${String(h).padStart(2, '0')}.00`,
      total: byHour.get(h) ?? 0,
    }))
  }, [data])

  if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 6 }} />
  if (isError) return <Empty description="เกิดข้อผิดพลาดในการโหลดข้อมูล" />

  return (
    <LineChart
      title='ปริมาณการตรวจจับป้ายทะเบียนรายชั่วโมง'
      icon={<IconLPR size={22} color='var(--yellow)' />}
      cardBorderColor='#00000080'
      iconCircle={false}
      showGlow={false}
      data={hours}
      lines={[
        { dataKey: 'total', color: '#66AEFF', label: 'รวมทั้งหมด', unit: 'คัน' },
      ]}
      tooltipDate={dateLabel}
    />
  )
}

export default React.memo<Props>(ChartLicenseDetection)
