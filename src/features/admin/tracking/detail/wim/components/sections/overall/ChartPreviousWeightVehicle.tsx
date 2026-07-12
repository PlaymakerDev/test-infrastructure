"use client"
import React, { useMemo, useState } from 'react'
import LineChart from '@/components/chart/LineChart'
import { TbCalendarMonth } from 'react-icons/tb'
import { useLast7Days } from '@/features/admin/tracking/detail/wim/hooks'
import { useWIMContext } from '@/features/admin/tracking/detail/wim/context'
import QueryBoundary from '@/components/common/QueryBoundary'
import dayjs from 'dayjs';

interface Props {

}

type Period = 'วันนี้' | 'เดือน' | 'ปี'
type DateType = 'day' | 'month' | 'year'

const PERIOD_DATE_TYPE: Record<Period, DateType> = {
  'วันนี้': 'day',
  'เดือน': 'month',
  'ปี': 'year',
}

const LINES = [
  { dataKey: 'current', color: '#66AEFF', label: 'สัปดาห์ปัจจุบัน' },
  { dataKey: 'previous', color: '#E94C4C', label: 'สัปดาห์ก่อน' },
]

const ChartPreviousWeightVehicle: React.FC<Props> = () => {
  const { id: stationId } = useWIMContext()
  const [period, setPeriod] = useState<Period>('วันนี้')
  const dateType = PERIOD_DATE_TYPE[period]

  // Endpoint is enabled for WIM stations only — mirrors the pre-existing
  // behavior for this component (not yet confirmed for STATION by backend).
  // const enabled = stationType === 'WIM'

  const currentReferenceDate = dayjs().format('YYYY-MM-DD')
  // "previous" window is the same length, ending exactly one window before the current one.
  const previousReferenceDate = dayjs().subtract(7, dateType).format('YYYY-MM-DD')

  const {
    data: current,
    isLoading: isCurrentLoading,
    isError: isCurrentError,
  } = useLast7Days({
    station_id: stationId as string,
    date_type: dateType,
    reference_date: currentReferenceDate,
  })

  const {
    data: previous,
    isLoading: isPreviousLoading,
    isError: isPreviousError,
  } = useLast7Days({
    station_id: stationId as string,
    date_type: dateType,
    reference_date: previousReferenceDate,
  })

  const isLoading = isCurrentLoading || isPreviousLoading
  const isError = isCurrentError || isPreviousError

  const chartData = useMemo(() => {
    const columns = current?.data.column ?? []
    return columns.map((label, index) => ({
      label,
      current: current?.data.total[index] ?? 0,
      previous: previous?.data.total[index] ?? 0,
    }))
  }, [current?.data, previous?.data])

  return (
    <QueryBoundary isLoading={isLoading} isError={isError} skeletonRows={10}>
      <LineChart
        title='เปรียบเทียบรถเข้าชั่งน้ำหนัก'
        subtitle='แนวโน้มย้อนหลัง 7 วัน'
        icon={<TbCalendarMonth size={18} />}
        iconCircle={false}
        // accentColor='#FCD116'
        // cardBackground='#00000080'
        cardBorderColor='transparent'
        showGlow={false}
        data={chartData}
        lines={LINES}
        periods={['วันนี้', 'เดือน', 'ปี']}
        defaultPeriod='วันนี้'
        onPeriodChange={(p) => setPeriod(p as Period)}
        tooltipShowDot
        height={260}
      />
    </QueryBoundary>
  )
}

export default React.memo(ChartPreviousWeightVehicle)
