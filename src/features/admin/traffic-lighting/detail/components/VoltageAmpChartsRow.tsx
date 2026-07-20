"use client"
import React, { useMemo } from 'react'
import { Empty, Spin } from 'antd'
import { TbBolt } from 'react-icons/tb'
import LineChart from '@/components/chart/LineChart'
import type { LineChartDataPoint } from '@/components/chart/LineChart'
import { useLightingVoltGraph, useLightingAmpGraph } from '@/hooks/queries/lighting'

// Title color is always the project yellow; the chart line itself keeps its
// semantic color (cyan for Volt, orange for Amp) for readability.
const COLOR_TITLE = '#FCD116'
const COLOR_VOLTAGE_CYAN = '#66AEFF'
const COLOR_AMP_ORANGE = '#FF9F43'

const SHARED_CHART_PROPS = {
  iconCircle: false,
  showGlow: false,
  cardBackground: '#00000080',
  cardBorderColor: '#1f2d3d',
  height: 220,
} as const

/** Two line charts (Volt / Amp) for the OVERVIEW tab. Replaces the old
 *  ExampleCardsRow image pair. Each chart pulls 24h hourly data from the
 *  logs4g graph endpoints for the given IMEI. */
const VoltageAmpChartsRow: React.FC<{ imei: string; phase?: number | null; phaseReady?: boolean }> = ({ imei, phase, phaseReady = true }) => {
  const voltQuery = useLightingVoltGraph(imei, phase, phaseReady)
  const ampQuery = useLightingAmpGraph(imei, phase, phaseReady)
  // Map the API points to the LineChart data shape (label = hour, value key).
  const voltData: LineChartDataPoint[] = useMemo(
    () => (voltQuery.data ?? [])
      .filter((point) => point.volt !== null)
      .map((point) => ({ label: point.Period_Name, volt: point.volt as number })),
    [voltQuery.data],
  )
  const ampData: LineChartDataPoint[] = useMemo(
    () => (ampQuery.data ?? [])
      .filter((point) => point.amp !== null)
      .map((point) => ({ label: point.Period_Name, amp: point.amp as number })),
    [ampQuery.data],
  )

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
            lines={[{ dataKey: 'volt', color: COLOR_VOLTAGE_CYAN, label: 'Voltage', unit: 'V' }]}
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
            lines={[{ dataKey: 'amp', color: COLOR_AMP_ORANGE, label: 'Current', unit: 'A' }]}
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
