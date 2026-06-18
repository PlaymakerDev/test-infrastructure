"use client"
import React, { useMemo } from 'react'
import { TbActivity } from 'react-icons/tb'
import dayjs from 'dayjs'
import LineChart, { type LineChartDataPoint } from '@/components/chart/LineChart'
import { useTrafficGraph } from '@/hooks/queries/traffic-signal'
import { fmtNumber } from '@/utils/formatNumber'
import { useDetailContext } from '../../../context'

interface Props { }

const COLOR_ET = '#05DEF2'
const COLOR_TIME = '#D000FF'
const COLOR_CO2 = '#FC169C'

const ChartETAnalysisTrafficSignal: React.FC<Props> = () => {
  const { project } = useDetailContext()
  const { data } = useTrafficGraph(project.id)

  // Per current OpenAPI spec `saving` sits at the response root. Fall back to
  // the legacy nested location (`efficentcy.saving` / `efficiency.saving`) for
  // any older backend snapshot that hasn't migrated yet.
  const saving = data?.saving ?? data?.efficentcy?.saving ?? data?.efficiency?.saving

  const hours = useMemo<LineChartDataPoint[]>(() => {
    // Sort by timestamp ascending — backend doesn't guarantee chronological
    // order so without this the x-axis jumps around (15→13→11→18→16…).
    const points = [...(saving?.graph ?? [])].sort(
      (a, b) =>
        new Date(a.hour_timestamp).getTime() - new Date(b.hour_timestamp).getTime(),
    )
    // Carry a per-point `dateLabel` (e.g. "16 มิ.ย. 2026") so the tooltip
    // reflects the actual day of each point — the data window can span
    // multiple days, so a single static date would be wrong.
    return points.map((p) => ({
      label: dayjs(p.hour_timestamp).format('HH.mm'),
      dateLabel: dayjs(p.hour_timestamp).format('D MMM YYYY'),
      et: p.early_termination_rate,
      time: p.total_time_saved,
      co2: p.carbon_saved,
    }))
  }, [saving])

  return (
    <LineChart
      title='Early Termination Analysis'
      subtitle='เปรียบเทียบการประหยัดเวลาและพลังงานตามช่วงเวลา'
      icon={<TbActivity size={30} />}
      accentColor='#66AEFF'
      iconCircle={false}
      showGlow={false}
      data={hours}
      lines={[{ dataKey: 'et', color: COLOR_ET, label: 'ET Rate', unit: '%' }]}
      stats={[
        {
          value: `${fmtNumber(saving?.early_termination_rate, 0)}%`,
          label: 'Avg ET Rate',
          color: COLOR_ET,
        },
        {
          value: `${fmtNumber(saving?.total_time_saved, 0)} m`,
          label: 'ประหยัดเวลา',
          color: COLOR_TIME,
        },
        {
          value: `${fmtNumber(saving?.total_carbon_saved, 0)} kg`,
          label: 'ลดปริมาณ CO2',
          color: COLOR_CO2,
        },
      ]}
      tooltipExtras={[
        { dataKey: 'time', label: 'ประหยัดเวลา', color: COLOR_TIME, unit: 'm' },
        { dataKey: 'co2', label: 'ลด CO2', color: COLOR_CO2, unit: 'kg' },
      ]}
      yAxisTicks={[0, 25, 50, 75, 100]}
      height={260}
      tooltipDateKey='dateLabel'
      tooltipShowDot
    />
  )
}

export default React.memo<Props>(ChartETAnalysisTrafficSignal)
