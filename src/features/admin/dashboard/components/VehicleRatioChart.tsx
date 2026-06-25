"use client"
import React, { memo, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { TbCar } from 'react-icons/tb'
import { useDashboardCounting } from '@/hooks/queries/dashboard'
import { useDeptId } from '@/hooks/useDeptId'
import type { DashboardCountingVehicleCount } from '@/types/dashboard/api'

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

// Vehicle types — order + color matches the Figma rose chart. The backend key
// (snake-cased) is mapped to the display label + the color band.
interface VehicleConfig {
  key: keyof Omit<DashboardCountingVehicleCount, 'total'>
  name: string
  color: string
}

const VEHICLES: VehicleConfig[] = [
  { key: 'car',     name: 'รถยนต์',         color: '#f87171' },
  { key: 'bike',    name: 'รถจักรยานยนต์',  color: '#34d399' },
  { key: 'pickup',  name: 'รถกระบะ',        color: '#60a5fa' },
  { key: 'truck',   name: 'รถบรรทุก',       color: '#7dd3fc' },
  { key: 'trailer', name: 'รถพ่วง',         color: '#fbbf24' },
  { key: 'taxi',    name: 'รถแท็กซี่',      color: '#a3e635' },
  { key: 'bus',     name: 'รถบัส',          color: '#c084fc' },
]

interface RoseRow {
  name: string
  count: number
  pct: number
  color: string
}

interface RoseChartProps {
  rows: RoseRow[]
}

/** Compute a "nice" polar max that scales with the data so the biggest bar
 *  fills most of the radius (with ~15% headroom for the outer grid ring).
 *  Round to a step half the order of magnitude — keeps the axis label clean
 *  (2,500 / 25,000 / 250,000 style) regardless of whether the dept has
 *  hundreds or hundreds-of-thousands of vehicles. */
const niceCeil = (max: number): number => {
  if (max <= 0) return 10
  const target = max * 1.15
  const mag = Math.pow(10, Math.floor(Math.log10(target)))
  const step = Math.max(1, mag / 2)
  return Math.ceil(target / step) * step
}

const RoseEChart = memo(function RoseEChart({ rows }: RoseChartProps) {
  const option = useMemo(() => {
    const maxCount = Math.max(0, ...rows.map((r) => r.count))
    const polarMax = niceCeil(maxCount)
    return {
      backgroundColor: 'transparent',
      polar: { center: ['50%', '50%'], radius: ['0%', '88%'] },
      angleAxis: {
        type: 'category',
        data: rows.map((d) => d.name),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false },
      },
      radiusAxis: {
        type: 'value',
        max: polarMax,
        interval: Math.max(1, Math.round(polarMax / 6)),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          show: true,
          color: 'rgba(255,255,255,0.7)',
          fontSize: 9,
          // K-format only when the number is large enough to need it; small
          // depts (max ~1k) read better as full integers.
          formatter: (v: number) => {
            if (v <= 0) return ''
            if (v >= 10000) return `${Math.round(v / 1000)}K`
            return Math.round(v).toLocaleString()
          },
        },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.15)', width: 0.8 } },
      },
      series: [
        {
          type: 'bar',
          data: rows.map((d) => ({
            value: d.count,
            itemStyle: { color: d.color, opacity: 0.85, borderRadius: 4 },
          })),
          coordinateSystem: 'polar',
          roundCap: true,
          barMaxWidth: 38,
        },
      ],
      tooltip: {
        show: true,
        backgroundColor: 'rgba(5,13,26,0.92)',
        borderColor: 'rgba(252,209,22,0.3)',
        textStyle: { color: '#FCD116', fontSize: 12 },
        formatter: (p: { name: string; value: number }) =>
          `${p.name}<br/><b>${p.value.toLocaleString()}</b>`,
      },
    }
  }, [rows])

  return (
    <ReactECharts
      option={option}
      notMerge
      style={{ width: '100%', height: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  )
})

interface Props {
  /** Extra utility classes for the outer card — e.g. "flex-1 min-h-0" to fill a flex parent */
  className?: string
}

const VehicleRatioChart: React.FC<Props> = ({ className = '' }) => {
  const deptId = useDeptId()
  const { data } = useDashboardCounting(deptId)

  // Map backend's keyed object → list in Figma order. Vehicles with 0 count
  // still render in the legend (greyed % = 0) so the layout stays stable.
  const rows = useMemo<RoseRow[]>(() => {
    if (!data) return VEHICLES.map((v) => ({ name: v.name, count: 0, pct: 0, color: v.color }))
    return VEHICLES.map((v) => ({
      name: v.name,
      count: data.daily_vehicle_count[v.key]?.count ?? 0,
      pct: data.daily_vehicle_count[v.key]?.percentage ?? 0,
      color: v.color,
    }))
  }, [data])

  const total = data?.daily_vehicle_count.total?.count ?? rows.reduce((s, r) => s + r.count, 0)

  return (
    <div
      className={`flex flex-col p-3 ${className}`}
      style={{
        background: 'rgba(0,0,0,0.55)',
        borderRadius: 20,
        backdropFilter: 'blur(5px)',
      }}
    >
      {/* Title only — period tabs (วันนี้ / เดือน / ปี) intentionally hidden until
        * the API exposes range-scoped vehicle counts. The current endpoint
        * returns "today only", so a tab switcher would mislead users. */}
      <div className='flex items-center justify-between mb-1'>
        <div className='flex items-center gap-1.5 text-white text-sm font-medium'>
          <TbCar size={30} color='#FCD116' />
          สัดส่วนยานพาหนะ
        </div>
      </div>
      {/*
       * Mobile (default): width-based square — `w-full max-w-[280px]` so the rose
       *   matches the card width without `grow` (which can't apply when the card
       *   has no fixed height in the scrollable mobile column).
       * Desktop (sm+): height-based square — `h-full` lets the card's flex-1
       *   space fill the chart, and aspect-square keeps it round.
       */}
      <div className='flex items-center justify-center grow min-h-0'>
        <div className='aspect-square w-full max-w-[280px] mx-auto sm:w-auto sm:h-full sm:max-w-90 sm:max-h-90'>
          <RoseEChart rows={rows} />
        </div>
      </div>
      <div className='px-14'>
        {rows.map((d) => (
          <div
            key={d.name}
            className='flex items-center text-sm'
            style={{ paddingTop: 5, paddingBottom: 5 }}
          >
            <div
              className='size-2.5 rounded-full shrink-0 mr-2'
              style={{ background: d.color }}
            />
            <span className='text-white'>{d.name}</span>
            <span className='flex-1' />
            <span className='text-white font-medium tabular-nums w-20 text-right'>
              {d.count.toLocaleString()}
            </span>
            <span className='text-white w-14 text-right tabular-nums'>{Math.round(d.pct)}%</span>
          </div>
        ))}
        <div
          className='flex items-center text-sm border-t'
          style={{
            paddingTop: 5,
            paddingBottom: 5,
            borderColor: 'rgba(255,255,255,0.07)',
          }}
        >
          <div className='size-2.5 shrink-0 mr-2' />
          <span className='text-(--yellow) font-semibold'>รวม</span>
          <span className='flex-1' />
          <span className='text-(--yellow) font-bold tabular-nums w-20 text-right'>
            {total.toLocaleString()}
          </span>
          <span className='w-14' />
        </div>
      </div>
    </div>
  )
}

export default React.memo<Props>(VehicleRatioChart)
