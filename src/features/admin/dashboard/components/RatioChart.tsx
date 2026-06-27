"use client"
import React, { memo, useMemo } from 'react'
import dynamic from 'next/dynamic'
import {
  useDashboardCctvUptime,
  useDashboardVmsUptime,
  useDashboardLightingUptime,
} from '@/hooks/queries/dashboard'
import { useDeptId } from '@/hooks/useDeptId'

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

interface DonutItem {
  pct: number
  color: string
  label: string
}

// Order matches the Figma rail. Each donut renders at 0% until its
// `uptime-statistics` endpoint exists. Live now: CCTV / Lighting / VMS.
// Pending BE: WIM / CrossWalk / Bridge Lighting / Tunnel — verified 404 on
// 2026-06-24; wire them here as soon as the endpoints ship (do NOT hide them).
const STATIC_DONUTS = {
  cctv: { color: '#ef4444', label: 'CCTV' },
  lighting: { color: '#f97316', label: 'Lighting' },
  vms: { color: '#a3e635', label: 'VMS' },
  wim: { color: '#22c55e', label: 'Tracking' },
  crosswalk: { color: '#14b8a6', label: 'Crosswalk' },
  bridge: { color: '#3b82f6', label: 'Bridge Lighting' },
  tunnel: { color: '#a855f7', label: 'Tunnel' },
} as const

interface DonutProps {
  pct: number
  color: string
  label: string
  size?: number
}

const Donut = memo(function Donut(props: DonutProps) {
  const { pct, color, label, size = 110 } = props
  const isSmall = size < 130

  const option = {
    backgroundColor: 'transparent',
    series: [
      {
        type: 'gauge',
        startAngle: 90,
        endAngle: -270,
        radius: '88%',
        pointer: { show: false },
        progress: {
          show: true,
          overlap: false,
          roundCap: false,
          clip: false,
          itemStyle: { color },
        },
        axisLine: {
          lineStyle: {
            width: isSmall ? 10 : 14,
            color: [[1, '#0d1825']] as [number, string][],
          },
        },
        splitLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        data: [{ value: pct }],
        detail: {
          show: true,
          offsetCenter: [0, '0%'],
          formatter: `{pct|${pct}%}\n{sub|Online}`,
          rich: {
            pct: {
              fontSize: isSmall ? 16 : 20,
              fontWeight: 'bold',
              color,
              lineHeight: isSmall ? 20 : 24,
            },
            sub: {
              fontSize: isSmall ? 10 : 12,
              color,
              lineHeight: isSmall ? 16 : 20,
              opacity: 0.8,
            },
          },
        },
        title: { show: false },
      },
    ],
  }

  return (
    <div className='flex flex-col items-center gap-0'>
      <ReactECharts
        option={option}
        style={{ width: size, height: size }}
        opts={{ renderer: 'canvas' }}
      />
      <div
        className={`${isSmall ? 'text-sm' : 'text-base'} font-bold -mt-2 text-center leading-tight`}
        style={{ color, width: size }}
      >
        {label}
      </div>
    </div>
  )
})

interface Props {
  size?: number
  cols?: number
}

const RatioChart: React.FC<Props> = ({ size = 110, cols }) => {
  const deptId = useDeptId()
  const { data: cctv } = useDashboardCctvUptime(deptId)
  const { data: lighting } = useDashboardLightingUptime(deptId)
  const { data: vms } = useDashboardVmsUptime(deptId)

  const items = useMemo<DonutItem[]>(
    () => [
      { ...STATIC_DONUTS.cctv,      pct: cctv?.percentage     ?? 0 },
      { ...STATIC_DONUTS.lighting,  pct: lighting?.percentage ?? 0 },
      { ...STATIC_DONUTS.vms,       pct: vms?.percentage      ?? 0 },
      // No uptime endpoint yet — show the donut at 0% as a visual placeholder.
      { ...STATIC_DONUTS.wim,       pct: 0 },
      { ...STATIC_DONUTS.crosswalk, pct: 0 },
      { ...STATIC_DONUTS.bridge,    pct: 0 },
      { ...STATIC_DONUTS.tunnel,    pct: 0 },
    ],
    [cctv, lighting, vms],
  )

  if (cols) {
    // mobile / grid layout
    return (
      <div
        className='grid gap-y-3 py-4'
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          background: 'rgba(0,0,0,0.55)',
          borderRadius: 20,
          backdropFilter: 'blur(5px)',
        }}
      >
        {items.map((d) => (
          <div key={d.label} className='flex justify-center'>
            <Donut pct={d.pct} color={d.color} label={d.label} size={size} />
          </div>
        ))}
      </div>
    )
  }

  // desktop horizontal row
  return (
    <div
      className='flex items-center py-3 w-full'
      style={{
        background: 'rgba(0,0,0,0.55)',
        borderRadius: 20,
        backdropFilter: 'blur(5px)',
      }}
    >
      {items.map((d) => (
        <div key={d.label} className='flex-1 flex justify-center'>
          <Donut pct={d.pct} color={d.color} label={d.label} size={size} />
        </div>
      ))}
    </div>
  )
}

export default React.memo<Props>(RatioChart)
