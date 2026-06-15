"use client"
import React, { useMemo } from 'react'
import { TbActivity } from 'react-icons/tb'
import dayjs from 'dayjs'
import LineChart, { type LineChartDataPoint } from '@/components/chart/LineChart'
import { useTrafficGraph } from '@/hooks/queries/traffic-signal'
import { useDetailContext } from '../../../context'

interface Props { }

const COLOR_ET = '#05DEF2'
const COLOR_TIME = '#D000FF'
const COLOR_CO2 = '#FC169C'

const ChartETAnalysisTrafficSignal: React.FC<Props> = () => {
  const { project } = useDetailContext()
  const { data } = useTrafficGraph(project.id)

  // Accept both backend spellings (`efficientcy` typo OR `efficiency`).
  const saving = data?.efficiency?.saving ?? data?.efficientcy?.saving

  const hours = useMemo<LineChartDataPoint[]>(() => {
    const points = saving?.graph ?? []
    return points.map((p) => ({
      label: dayjs(p.hour_timestamp).format('HH.mm'),
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
          value: `${(saving?.early_termination_rate ?? 0).toFixed(0)}%`,
          label: 'Avg ET Rate',
          color: COLOR_ET,
        },
        {
          value: `${(saving?.total_time_saved ?? 0).toFixed(0)} m`,
          label: 'ประหยัดเวลา',
          color: COLOR_TIME,
        },
        {
          value: `${(saving?.total_carbon_saved ?? 0).toFixed(0)} kg`,
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
      tooltipDate={dayjs().format('D MMM YYYY')}
      tooltipShowDot
    />
  )
}

export default React.memo<Props>(ChartETAnalysisTrafficSignal)
