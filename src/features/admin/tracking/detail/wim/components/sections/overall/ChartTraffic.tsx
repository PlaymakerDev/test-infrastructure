"use client"
import React, { useMemo, useState } from 'react'
import LineChart from '@/components/chart/LineChart'
import { TbCar, TbMoon, TbSun } from 'react-icons/tb'
import { useTrafficAvgSpeed } from '@/features/admin/tracking/detail/wim/hooks'
import { useWIMContext } from '@/features/admin/tracking/detail/wim/context'
import QueryBoundary from '@/components/common/QueryBoundary'
import dayjs from 'dayjs';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import 'dayjs/locale/th';

dayjs.extend(buddhistEra)
dayjs.locale('th')

interface Props {

}

type Period = 'กลางวัน' | 'กลางคืน'

const LINES = [
  { dataKey: 'total', color: '#66AEFF', label: 'รถทั้งหมด' },
]

const ChartTraffic: React.FC<Props> = () => {
  const { id: stationId, stationType } = useWIMContext()
  const [period, setPeriod] = useState<Period>('กลางวัน')

  const { data, isLoading, isError } = useTrafficAvgSpeed(
    stationId as string | number | undefined,
    stationType === 'WIM'
  )

  const chartData = useMemo(() => {
    return (data?.data ?? []).map(item => ({
      label: item.period_name,
      total: Number(item.vehicle_count),
      pid: item.pid,
    }))
  }, [data?.data])

  // Boundary hours (06:00, 18:00) are shared by both tabs so each line touches
  // the other's edge. กลางคืน wraps past midnight, so it's reassembled as
  // 18:00..23:00 followed by 00:00..06:00 rather than relying on the API's
  // ascending pid order (a plain filter would leave it as 00:00..06:00, 18:00..23:00).
  const periodData = useMemo(() => {
    if (period === 'กลางวัน') {
      return chartData.filter(item => item.pid >= 6 && item.pid <= 18)
    }
    const evening = chartData.filter(item => item.pid >= 18)
    const earlyMorning = chartData.filter(item => item.pid <= 6)
    return [...evening, ...earlyMorning]
  }, [chartData, period])

  return (
    <QueryBoundary isLoading={isLoading} isError={isError} skeletonRows={10}>
      <LineChart
        title='ข้อมูลจราจรรายชั่วโมง'
        icon={<TbCar className='fs-22' />}
        iconCircle={false}
        accentColor='#FCD116'
        cardBackground='#00000080'
        cardBorderColor='transparent'
        showGlow={false}
        data={periodData}
        lines={LINES}
        periods={['กลางวัน', 'กลางคืน']}
        periodIcons={{
          'กลางวัน': <TbSun className='fs-14' />,
          'กลางคืน': <TbMoon className='fs-14' />,
        }}
        activePeriod={period}
        onPeriodChange={(p) => setPeriod(p as Period)}
        tooltipDate={dayjs().format('DD MMM BBBB')}
        tooltipUnit='คัน'
        tooltipShowDot
        fillHeight
      />
    </QueryBoundary>
  )
}

export default React.memo(ChartTraffic)
