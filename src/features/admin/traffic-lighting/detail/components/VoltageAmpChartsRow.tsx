"use client"
import React, { useMemo } from 'react'
import { Empty, Spin } from 'antd'
import { TbBolt } from 'react-icons/tb'
import LineChart from '@/components/chart/LineChart'
import type { LineChartDataPoint } from '@/components/chart/LineChart'
import { useLightingVoltGraph, useLightingAmpGraph } from '@/hooks/queries/lighting'
import { COLOR_VOLTAGE_CYAN, COLOR_PHASE_GREEN, COLOR_PHASE_YELLOW, COLOR_AMP_ORANGE } from '../data/voltageAmpReport'
import type { LineConfig } from '@/components/chart/LineChart'

// Title color is always the project yellow; the chart line itself keeps its
// semantic color (cyan for Volt, orange for Amp) for readability.
const COLOR_TITLE = '#FCD116'

const SHARED_CHART_PROPS = {
  iconCircle: false,
  showGlow: false,
  cardBackground: '#00000080',
  cardBorderColor: '#1f2d3d',
  height: 220,
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

/** Two line charts (Volt / Amp) for the OVERVIEW tab. Replaces the old
 *  ExampleCardsRow image pair. Each chart pulls 24h hourly data from the
 *  logs4g graph endpoints for the given IMEI. */
const VoltageAmpChartsRow: React.FC<{ imei: string; phase?: number | null; phaseReady?: boolean }> = ({ imei, phase, phaseReady = true }) => {
  const isThreePhase = phase === 3
  const voltQuery = useLightingVoltGraph(imei, phase, phaseReady)
  const ampQuery = useLightingAmpGraph(imei, phase, phaseReady)
  // Map the API points to the LineChart data shape (label = hour, value key).
  // Three-phase: keep an hour if ANY phase has data, falling back individual
  // null phases to 0 (rather than dropping the whole hour, which would also
  // hide the other phases' real readings at that hour).
  const voltData: LineChartDataPoint[] = useMemo(() => {
    const raw = voltQuery.data ?? []
    if (isThreePhase) {
      return raw
        .filter((p) => p.volt !== null || p.volt2 !== null || p.volt3 !== null)
        .map((p) => ({ label: p.Period_Name, volt: p.volt ?? 0, volt2: p.volt2 ?? 0, volt3: p.volt3 ?? 0 }))
    }
    return raw
      .filter((p) => p.volt !== null)
      .map((p) => ({ label: p.Period_Name, volt: p.volt as number }))
  }, [voltQuery.data, isThreePhase])
  const ampData: LineChartDataPoint[] = useMemo(() => {
    const raw = ampQuery.data ?? []
    if (isThreePhase) {
      return raw
        .filter((p) => p.amp !== null || p.amp2 !== null || p.amp3 !== null)
        .map((p) => ({ label: p.Period_Name, amp: p.amp ?? 0, amp2: p.amp2 ?? 0, amp3: p.amp3 ?? 0 }))
    }
    return raw
      .filter((p) => p.amp !== null)
      .map((p) => ({ label: p.Period_Name, amp: p.amp as number }))
  }, [ampQuery.data, isThreePhase])
  const voltLines = isThreePhase ? VOLT_LINES_THREE_PHASE : VOLT_LINES_SINGLE
  const ampLines = isThreePhase ? AMP_LINES_THREE_PHASE : AMP_LINES_SINGLE

  return (
    <div className='flex flex-col md:flex-row w-full gap-3 mt-4'>
      <div className='flex-1 min-w-0'>
        {voltQuery.isLoading ? (
          <div className='h-[220px] flex items-center justify-center'><Spin /></div>
        ) : voltQuery.isError ? (
          <div className='h-[220px] flex items-center justify-center'>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='ไม่สามารถโหลดข้อมูลแรงดันไฟฟ้าได้' />
          </div>
        ) : voltData.length > 0 ? (
          <LineChart
            {...SHARED_CHART_PROPS}
            title='แรงดันไฟฟ้าภายในตู้ควบคุม 24 ชั่วโมง (Volt)'
            icon={<TbBolt size={18} />}
            accentColor={COLOR_TITLE}
            data={voltData}
            lines={voltLines}
            tooltipUnit='V'
            yAxisDomain={['auto', 'auto']}
          />
        ) : (
          <div className='h-[220px] flex items-center justify-center'>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='ไม่พบข้อมูลแรงดันไฟฟ้า' />
          </div>
        )}
      </div>
      <div className='flex-1 min-w-0'>
        {ampQuery.isLoading ? (
          <div className='h-[220px] flex items-center justify-center'><Spin /></div>
        ) : ampQuery.isError ? (
          <div className='h-[220px] flex items-center justify-center'>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='ไม่สามารถโหลดข้อมูลกระแสไฟฟ้าได้' />
          </div>
        ) : ampData.length > 0 ? (
          <LineChart
            {...SHARED_CHART_PROPS}
            title='กระแสไฟฟ้าภายในตู้ควบคุม 24 ชั่วโมง (Amp)'
            icon={<TbBolt size={18} />}
            accentColor={COLOR_TITLE}
            data={ampData}
            lines={ampLines}
            tooltipUnit='A'
            yAxisDomain={['auto', 'auto']}
          />
        ) : (
          <div className='h-[220px] flex items-center justify-center'>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='ไม่พบข้อมูลกระแสไฟฟ้า' />
          </div>
        )}
      </div>
    </div>
  )
}

export default React.memo(VoltageAmpChartsRow)
