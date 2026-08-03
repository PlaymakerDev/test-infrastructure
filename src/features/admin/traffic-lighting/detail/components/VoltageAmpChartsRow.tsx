"use client"
import React, { useMemo, useState } from 'react'
import { Empty, Spin } from 'antd'
import { TbBolt } from 'react-icons/tb'
import LineChart from '@/components/chart/LineChart'
import type { LineChartDataPoint } from '@/components/chart/LineChart'
import { useLightingVoltGraph, useLightingAmpGraph } from '@/hooks/queries/lighting'
import { thaiDateBE } from '@/utils/thaiDate'
import { COLOR_VOLTAGE_CYAN, COLOR_PHASE_GREEN, COLOR_PHASE_YELLOW, COLOR_AMP_ORANGE } from '../data/voltageAmpReport'
import type { LineConfig } from '@/components/chart/LineChart'

// Title color is always the project yellow; the chart line itself keeps its
// semantic color (cyan for Volt, orange for Amp) for readability.
const COLOR_TITLE = '#FCD116'
const CHART_HEIGHT = 400
// Keep the axis fixed to a complete day, including the 24.00 endpoint. The
// API may omit future/no-reading hours, but those labels must still be visible.
const HOUR_LABELS = Array.from({ length: 25 }, (_, hour) => `${String(hour).padStart(2, '0')}.00`)

const SHARED_CHART_PROPS = {
  iconCircle: false,
  showGlow: false,
  cardBackground: '#00000080',
  cardBorderColor: '#1f2d3d',
  height: CHART_HEIGHT,
  axisLabelColor: '#FFFFFF80',
  xAxisLabelEvery: 2,
  forceShowMaxXAxisLabel: true,
  xAxisBoundaryGap: true,
  preserveNullValues: true,
} as const

// The logs4g graph endpoints always return all 3 phase columns regardless of
// `phase_type` (volt/amp = phase 1, volt2/amp2 = phase 2, volt3/amp3 = phase
// 3) — 3-phase devices plot all three lines, matching SummaryReportSection's
// VOLTAGE_BARS/AMP_BARS color convention; single-phase devices only ever
// populate phase 1, so keep the single-line view for them.
const VOLT_LINES_SINGLE: LineConfig[] = [{ dataKey: 'volt', color: COLOR_VOLTAGE_CYAN, label: 'Voltage', unit: 'V' }]
const VOLT_LINES_THREE_PHASE: LineConfig[] = [
  { dataKey: 'volt', color: COLOR_VOLTAGE_CYAN, label: 'Phase 1', unit: 'V' },
  { dataKey: 'volt2', color: COLOR_PHASE_GREEN, label: 'Phase 2', unit: 'V' },
  { dataKey: 'volt3', color: COLOR_PHASE_YELLOW, label: 'Phase 3', unit: 'V' },
]
const AMP_LINES_SINGLE: LineConfig[] = [{ dataKey: 'amp', color: COLOR_AMP_ORANGE, label: 'Current', unit: 'A' }]
const AMP_LINES_THREE_PHASE: LineConfig[] = [
  { dataKey: 'amp', color: COLOR_VOLTAGE_CYAN, label: 'Phase 1', unit: 'A' },
  { dataKey: 'amp2', color: COLOR_PHASE_GREEN, label: 'Phase 2', unit: 'A' },
  { dataKey: 'amp3', color: COLOR_AMP_ORANGE, label: 'Phase 3', unit: 'A' },
]

const hourFromPeriod = (period: string) => {
  const match = period.match(/^\s*(\d{1,2})/)
  return match ? Number(match[1]) : null
}

/** Two line charts (Volt / Amp) for the OVERVIEW tab. Replaces the old
 *  ExampleCardsRow image pair. Each chart pulls 24h hourly data from the
 *  logs4g graph endpoints for the given IMEI. */
const VoltageAmpChartsRow: React.FC<{ imei: string; phase?: number | null; phaseReady?: boolean }> = ({ imei, phase, phaseReady = true }) => {
  const isThreePhase = phase === 3
  const voltQuery = useLightingVoltGraph(imei, phase, phaseReady)
  const ampQuery = useLightingAmpGraph(imei, phase, phaseReady)
  // Both graphs cover today 00:00 → now (hours with no reading yet come back
  // null), so the tooltip header carries today's date plus the hovered hour —
  // "2 ส.ค. 2569" / "14.00 น.". Matters more since the x-axis labels thin out
  // on narrow cards: the hour is no longer always printed under the cursor.
  // Read the clock once, in a lazy state initializer — keeps it out of the
  // render body (which must stay pure) without an effect round-trip.
  const [todayLabel] = useState(() => thaiDateBE(Date.now()))
  // Map the API points to the LineChart data shape (label = hour, value key).
  // Three-phase: keep an hour if ANY phase has data, falling back individual
  // null phases to 0 (rather than dropping the whole hour, which would also
  // hide the other phases' real readings at that hour).
  const voltData: LineChartDataPoint[] = useMemo(() => {
    const raw = voltQuery.data ?? []
    const byHour = new Map(raw.flatMap((point) => {
      const hour = hourFromPeriod(point.Period_Name)
      return hour === null || hour < 0 || hour > 24 ? [] : [[hour, point] as const]
    }))
    if (isThreePhase) {
      return HOUR_LABELS.map((label, hour) => {
        const point = byHour.get(hour)
        return { label, volt: point?.volt ?? null, volt2: point?.volt2 ?? null, volt3: point?.volt3 ?? null }
      })
    }
    return HOUR_LABELS.map((label, hour) => ({ label, volt: byHour.get(hour)?.volt ?? null }))
  }, [voltQuery.data, isThreePhase])
  const ampData: LineChartDataPoint[] = useMemo(() => {
    const raw = ampQuery.data ?? []
    const byHour = new Map(raw.flatMap((point) => {
      const hour = hourFromPeriod(point.Period_Name)
      return hour === null || hour < 0 || hour > 24 ? [] : [[hour, point] as const]
    }))
    if (isThreePhase) {
      return HOUR_LABELS.map((label, hour) => {
        const point = byHour.get(hour)
        return { label, amp: point?.amp ?? null, amp2: point?.amp2 ?? null, amp3: point?.amp3 ?? null }
      })
    }
    return HOUR_LABELS.map((label, hour) => ({ label, amp: byHour.get(hour)?.amp ?? null }))
  }, [ampQuery.data, isThreePhase])
  const hasVoltData = (voltQuery.data ?? []).some((point) =>
    isThreePhase
      ? point.volt !== null || point.volt2 !== null || point.volt3 !== null
      : point.volt !== null,
  )
  const hasAmpData = (ampQuery.data ?? []).some((point) =>
    isThreePhase
      ? point.amp !== null || point.amp2 !== null || point.amp3 !== null
      : point.amp !== null,
  )
  const voltLines = isThreePhase ? VOLT_LINES_THREE_PHASE : VOLT_LINES_SINGLE
  const ampLines = isThreePhase ? AMP_LINES_THREE_PHASE : AMP_LINES_SINGLE

  return (
    <div className='flex flex-col md:flex-row w-full gap-3 mt-4'>
      <div className='flex-1 min-w-0'>
        {voltQuery.isLoading ? (
          <div className='h-[400px] flex items-center justify-center'><Spin /></div>
        ) : voltQuery.isError ? (
          <div className='h-[400px] flex items-center justify-center'>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='ไม่สามารถโหลดข้อมูลแรงดันไฟฟ้าได้' />
          </div>
        ) : hasVoltData ? (
          <LineChart
            {...SHARED_CHART_PROPS}
            title='แรงดันไฟฟ้าภายในตู้ควบคุม 24 ชั่วโมง (Volt)'
            icon={<TbBolt size={18} />}
            accentColor={COLOR_TITLE}
            data={voltData}
            lines={voltLines}
            tooltipDate={todayLabel}
            tooltipUnit='V'
            tooltipValueDecimals={4}
            yAxisDomain={['auto', 'auto']}
          />
        ) : (
          <div className='h-[400px] flex items-center justify-center'>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='ไม่พบข้อมูลแรงดันไฟฟ้า' />
          </div>
        )}
      </div>
      <div className='flex-1 min-w-0'>
        {ampQuery.isLoading ? (
          <div className='h-[400px] flex items-center justify-center'><Spin /></div>
        ) : ampQuery.isError ? (
          <div className='h-[400px] flex items-center justify-center'>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='ไม่สามารถโหลดข้อมูลกระแสไฟฟ้าได้' />
          </div>
        ) : hasAmpData ? (
          <LineChart
            {...SHARED_CHART_PROPS}
            title='กระแสไฟฟ้าภายในตู้ควบคุม 24 ชั่วโมง (Amp)'
            icon={<TbBolt size={18} />}
            accentColor={COLOR_TITLE}
            data={ampData}
            lines={ampLines}
            tooltipDate={todayLabel}
            tooltipUnit='A'
            tooltipValueDecimals={4}
            yAxisDomain={['auto', 'auto']}
          />
        ) : (
          <div className='h-[400px] flex items-center justify-center'>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='ไม่พบข้อมูลกระแสไฟฟ้า' />
          </div>
        )}
      </div>
    </div>
  )
}

export default React.memo(VoltageAmpChartsRow)
