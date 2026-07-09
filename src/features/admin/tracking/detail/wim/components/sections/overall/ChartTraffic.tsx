"use client"
import React, { useMemo, useState } from 'react'
import LineChart from '@/components/chart/LineChart'
import { TbMoon, TbSun } from 'react-icons/tb'
import { useTrafficAvgSpeed } from '@/features/admin/tracking/detail/wim/hooks'
import QueryBoundary from '@/components/common/QueryBoundary'
import dayjs from 'dayjs';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import 'dayjs/locale/th';

dayjs.extend(buddhistEra)
dayjs.locale('th')

interface Props {
  stationId: string[] | string | number | undefined;
  stationType: string | null | undefined;
}

type Period = 'กลางวัน' | 'กลางคืน'

const LINES = [
  { dataKey: 'total', color: '#66AEFF', label: 'รถทั้งหมด' },
]

const ChartTraffic: React.FC<Props> = (props) => {
  const { stationId, stationType } = props
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

  // Boundary hour (noon) is shared by both tabs so each line touches the other's edge.
  const periodData = useMemo(() => {
    return period === 'กลางวัน'
      ? chartData.filter(item => item.pid <= 12)
      : chartData.filter(item => item.pid >= 12)
  }, [chartData, period])

  return (
    <QueryBoundary isLoading={isLoading} isError={isError} skeletonRows={10}>
      <LineChart
        title='ข้อมูลจราจรรายชั่วโมง'
        icon={
          period === 'กลางวัน'
            ? <TbSun size={18} />
            : <TbMoon size={18} />
        }
        iconCircle={false}
        accentColor='#FCD116'
        cardBackground='#00000080'
        cardBorderColor='transparent'
        showGlow={false}
        data={periodData}
        lines={LINES}
        periods={['กลางวัน', 'กลางคืน']}
        defaultPeriod='กลางวัน'
        onPeriodChange={(p) => setPeriod(p as Period)}
        tooltipDate={dayjs().format('DD MMM BBBB')}
        tooltipUnit='คัน'
        tooltipShowDot
        height={260}
      />
    </QueryBoundary>
  )
}

export default React.memo(ChartTraffic)
