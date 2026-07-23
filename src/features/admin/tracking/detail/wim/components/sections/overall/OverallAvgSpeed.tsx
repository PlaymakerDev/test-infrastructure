import React, { useMemo } from 'react'
import GaugeChart from '@/components/chart/GaugeChart'
import { TbGauge } from 'react-icons/tb'
import { useTrafficAvgSpeed } from '@/features/admin/tracking/detail/wim/hooks'
import { useWIMContext } from '@/features/admin/tracking/detail/wim/context'
import QueryBoundary from '@/components/common/QueryBoundary'

interface Props {

}

const OverallAvgSpeed: React.FC<Props> = () => {
  const { id: stationId, stationType } = useWIMContext()

  const { data, isLoading, isError } = useTrafficAvgSpeed(
    stationId as string | number | undefined,
    stationType === 'WIM'
  )

  const tableRows = useMemo(() => {
    return (data?.data ?? []).map((item, index) => ({
      time: item.period_name,
      value: Number(item.avg_speed),
      highlighted: index === 0,
    }))
  }, [data?.data])

  const avgSpeed = useMemo(() => {
    const speeds = (data?.data ?? []).map(item => Number(item.avg_speed))
    return speeds.length ? speeds.reduce((sum, value) => sum + value, 0) / speeds.length : 0
  }, [data?.data])

  return (
    <QueryBoundary isLoading={isLoading} isError={isError} skeletonRows={10}>
      <GaugeChart
        title='ความเร็วเฉลี่ยวันนี้'
        icon={<TbGauge className='fs-22 text-(--yellow) shrink-0' />}
        iconCircle={false}
        value={avgSpeed}
        unit='กม./ชม.'
        min={0}
        max={120}
        tableTitle='ความเร็วเฉลี่ยรายชั่วโมง'
        tableTimeLabel='เวลา'
        tableValueLabel='ความเร็วเฉลี่ย'
        tableRows={tableRows}
        height={270}
      />
    </QueryBoundary>
  )
}

export default React.memo<Props>(OverallAvgSpeed)
