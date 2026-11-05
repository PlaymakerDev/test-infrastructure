"use client"
import React, { useMemo } from 'react'
import { Col, Row } from 'antd'
import dayjs from 'dayjs'
import BarChart, { type BarChartDataPoint } from '@/components/chart/Barchart'
import { useTrafficSummary } from '@/hooks/queries/traffic-signal'
import { fmtNumber } from '@/utils/formatNumber'
import { thaiDayShort } from '@/utils/formatDate'
import { thaiDateBE } from '@/utils/thaiDate'
import { useDetailContext } from '../../../context'

interface Props {
  /** End date of the 7-day summary window (YYYY-MM-DD). */
  endDate: string
}

const COLOR_PCU = '#66AEFF'
const COLOR_EFFICIENCY = '#6680FF'
const COLOR_ET = '#8C66FF'
const COLOR_TIME_SAVED = '#CA66FF'

/** Format weekday + DD/MM Thai abbreviation for x-axis label.
 *  e.g., `Tuesday` + `2026-04-14` → "อ.\n14/04" */
const formatDayLabel = (dateStr: string, dayStr: string) => {
  const date = dayjs(dateStr)
  return `${thaiDayShort(dayStr)}\n${date.format('DD/MM')}`
}

const AvgFooter: React.FC<{ value: string; label: string; color: string }> = ({
  value,
  label,
  color,
}) => (
  <div
    className='py-2 px-3 rounded-lg text-center'
    style={{ background: '#00000080', border: `1px solid ${color}` }}
  >
    <p className='text-2xl font-bold mb-0' style={{ color }}>{value}</p>
    <p className='fs-12 text-gray-400 mb-0'>{label}</p>
  </div>
)

const SHARED_CHART_PROPS = {
  iconCircle: false,
  showGlow: false,
  height: 220,
} as const

const Perf7DayChartsSummaryTraffic: React.FC<Props> = ({ endDate }) => {
  const { project } = useDetailContext()
  // Backend returns 7 entries ending at `endDate`. Driven by the user's
  // RangePicker end so the bars always reflect the current selection.
  const { data } = useTrafficSummary(project.id, { date: endDate })

  const days = useMemo<BarChartDataPoint[]>(() => {
    // Oldest → newest, left to right. The API lists the window newest-first,
    // which ran the x-axis backwards in time (26/10 … 20/10); every other
    // time chart in the app — incl. this page's 24h charts — reads forward.
    // Daily cards below keep the API's newest-first order (legacy FE did too).
    const chronological = [...(data ?? [])].sort((a, b) => a.date.localeCompare(b.date))
    return chronological.map((d) => ({
      label: formatDayLabel(d.date, d.day),
      // Tooltip header shows the full Thai BE date (e.g. "29 มิ.ย. 2569"); the
      // x-axis keeps the short "จ.\n29/06" label.
      tooltipLabel: thaiDateBE(d.date),
      pcu: d.total_pcu,
      efficiency: d.avg_efficiency,
      et: d.avg_early_termination,
      timeSaved: d.total_time_saved,
    }))
  }, [data])

  const avgs = useMemo(() => {
    const arr = data ?? []
    const n = arr.length || 1
    const sum = arr.reduce(
      (acc, d) => ({
        pcu: acc.pcu + d.total_pcu,
        eff: acc.eff + d.avg_efficiency,
        et: acc.et + d.avg_early_termination,
        time: acc.time + d.total_time_saved,
      }),
      { pcu: 0, eff: 0, et: 0, time: 0 }
    )
    return {
      pcu: sum.pcu / n,
      efficiency: sum.eff / n,
      et: sum.et / n,
      // Total across days, not avg. `total_time_saved` is in MINUTES (the
      // per-phase table sums to it exactly and labels it "(m)"; the legacy
      // FE divided by 60 for this same card) — the footer reads hours.
      timeSavedHours: sum.time / 60,
    }
  }, [data])

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={12} lg={12} xl={6}>
        <BarChart
          {...SHARED_CHART_PROPS}
          title='ปริมาณจราจร (PCU) สูงสุดรายวัน'
          accentColor={COLOR_PCU}
          data={days}
          bars={[{ dataKey: 'pcu', color: COLOR_PCU, label: 'PCU' }]}
          footer={<AvgFooter value={fmtNumber(avgs.pcu, 1)} label='Avg Daily PCU' color={COLOR_PCU} />}
        />
      </Col>
      <Col xs={24} sm={24} md={12} lg={12} xl={6}>
        <BarChart
          {...SHARED_CHART_PROPS}
          title='ประสิทธิภาพการทำงานของระบบรายวัน'
          accentColor={COLOR_EFFICIENCY}
          data={days}
          bars={[{ dataKey: 'efficiency', color: COLOR_EFFICIENCY, label: 'Efficiency' }]}
          yAxisTicks={[0, 20, 40, 60, 80, 100]}
          footer={<AvgFooter value={`${fmtNumber(avgs.efficiency, 0)}%`} label='Avg Efficiency' color={COLOR_EFFICIENCY} />}
        />
      </Col>
      <Col xs={24} sm={24} md={12} lg={12} xl={6}>
        <BarChart
          {...SHARED_CHART_PROPS}
          title='Early Termination Rate'
          accentColor={COLOR_ET}
          data={days}
          bars={[{ dataKey: 'et', color: COLOR_ET, label: 'ET Rate' }]}
          yAxisTicks={[0, 20, 40, 60, 80, 100]}
          footer={<AvgFooter value={`${fmtNumber(avgs.et, 0)}%`} label='Avg ET Rate' color={COLOR_ET} />}
        />
      </Col>
      <Col xs={24} sm={24} md={12} lg={12} xl={6}>
        <BarChart
          {...SHARED_CHART_PROPS}
          title='เวลาที่ระบบช่วยประหยัด'
          accentColor={COLOR_TIME_SAVED}
          data={days}
          // Bars stay in minutes (the API unit); the footer converts the total
          // to hours. Both used to claim hours — overstating the total 60×.
          bars={[{ dataKey: 'timeSaved', color: COLOR_TIME_SAVED, label: 'ประหยัดเวลา' }]}
          tooltipUnit='นาที'
          footer={<AvgFooter value={`${fmtNumber(avgs.timeSavedHours, 1)}h`} label='Total Time Saved' color={COLOR_TIME_SAVED} />}
        />
      </Col>
    </Row>
  )
}

export default React.memo<Props>(Perf7DayChartsSummaryTraffic)
