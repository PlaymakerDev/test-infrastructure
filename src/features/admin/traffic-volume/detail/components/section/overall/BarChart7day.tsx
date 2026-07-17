"use client"
import React, { useMemo } from 'react'
import { TbCalendar } from 'react-icons/tb'
import dayjs from 'dayjs'
import BarChart, { type BarChartDataPoint } from '@/components/chart/Barchart'
import { useTrafficVolumeCountPrevious } from '@/hooks/queries/traffic-volume'
import { useDetailContext } from '../../../context'
import type { CountingPreviousDay } from '@/types/traffic-volume/detail-api'

interface Props { }

// Thai day-of-week abbreviations keyed by `Date.getDay()` (0 = Sunday).
// Hardcoded rather than using `dayjs.locale('th').format('dd')` so the
// abbreviation stays predictable regardless of which locale was last set
// globally elsewhere in the app.
const THAI_DAY_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'] as const

const dayToDataPoint = (d: CountingPreviousDay): BarChartDataPoint => {
  const dt = dayjs(d.date)
  return {
    label: `${THAI_DAY_SHORT[dt.day()]}\n${dt.format('DD/MM')}`,
    total: d.total,
  }
}

const BarChart7day: React.FC<Props> = () => {
  const { id } = useDetailContext()
  const { data } = useTrafficVolumeCountPrevious({ solution_id: id, last: 7 })

  const days = useMemo(() => {
    // Backend returns the 7 entries in arbitrary order — sort ASC so the
    // chart reads oldest → newest left → right.
    const sorted = [...(data ?? [])].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    return sorted.map(dayToDataPoint)
  }, [data])

  return (
    <BarChart
      title='เปรียบเทียบปริมาณจราจรย้อนหลัง 7 วัน'
      icon={<TbCalendar size={22} />}
      iconCircle={false}
      data={days}
      bars={[{ dataKey: 'total', color: '#66AEFF', label: 'ปริมาณจราจร' }]}
      height={200}
    />
  )
}

export default React.memo<Props>(BarChart7day)
