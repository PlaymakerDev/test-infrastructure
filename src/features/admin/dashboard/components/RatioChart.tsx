"use client"
import React, { memo, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  useDashboardCctvUptime,
  useDashboardVmsUptime,
  useDashboardLightingUptime,
  useDashboardTrafficUptime,
  useDashboardWimUptime,
  useDashboardCrosswalkUptime,
  useDashboardTunnelUptime,
} from '@/hooks/queries/dashboard'
import { useDeptId } from '@/hooks/useDeptId'
import SystemDetailCard from './SystemDetailCard'
import { MOCK_SYSTEM_DETAIL } from '../data/systemDetailMock'

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

interface DonutItem {
  /** System id — matches STATIC_DONUTS key + MOCK_SYSTEM_DETAIL key. */
  id: string
  pct: number
  color: string
  label: string
}

// Order: CCTV / Traffic / Lighting / VMS / WIM / Crosswalk / Tunnel.
// All 7 read a live `/{feature}/departments/{deptId}/overview/uptime-statistics`
// endpoint (cctv uses `/cameras/...`). A 0% ring means the API genuinely
// returned online=0 (real downtime), not a missing endpoint.
const STATIC_DONUTS = {
  cctv: { color: '#FF8566', label: 'CCTV' },
  traffic: { color: '#FFC766', label: 'Traffic' },
  lighting: { color: '#D9FF66', label: 'Lighting' },
  vms: { color: '#70FF66', label: 'VMS' },
  wim: { color: '#66FFB5', label: 'WIM' },
  crosswalk: { color: '#66F0FF', label: 'Crosswalk' },
  tunnel: { color: '#6685FF', label: 'Tunnel' },
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
            width: isSmall ? 14 : 18,
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
  const { data: traffic } = useDashboardTrafficUptime(deptId)
  const { data: wim } = useDashboardWimUptime(deptId)
  const { data: crosswalk } = useDashboardCrosswalkUptime(deptId)
  const { data: tunnel } = useDashboardTunnelUptime(deptId)

  const items = useMemo<DonutItem[]>(
    () => [
      { id: 'cctv',      ...STATIC_DONUTS.cctv,      pct: cctv?.percentage      ?? 0 },
      { id: 'traffic',   ...STATIC_DONUTS.traffic,   pct: traffic?.percentage   ?? 0 },
      { id: 'lighting',  ...STATIC_DONUTS.lighting,  pct: lighting?.percentage  ?? 0 },
      { id: 'vms',       ...STATIC_DONUTS.vms,       pct: vms?.percentage       ?? 0 },
      { id: 'wim',       ...STATIC_DONUTS.wim,       pct: wim?.percentage       ?? 0 },
      { id: 'crosswalk', ...STATIC_DONUTS.crosswalk, pct: crosswalk?.percentage ?? 0 },
      { id: 'tunnel',    ...STATIC_DONUTS.tunnel,    pct: tunnel?.percentage    ?? 0 },
    ],
    [cctv, lighting, vms, traffic, wim, crosswalk, tunnel],
  )

  // Click a donut → show that system's detail card; click the card → back.
  const [selected, setSelected] = useState<string | null>(null)
  const selectedItem = selected ? items.find((d) => d.id === selected) : null
  if (selectedItem) {
    return (
      <SystemDetailCard
        system={{ label: selectedItem.label, color: selectedItem.color }}
        data={MOCK_SYSTEM_DETAIL[selectedItem.id]}
        onBack={() => setSelected(null)}
        size={cols ? 110 : 120}
      />
    )
  }

  if (cols) {
    // mobile / grid layout
    return (
      <div
        className='grid gap-y-3 py-4'
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          background: 'rgba(0,0,0,0.8)',
          borderRadius: 20,
          backdropFilter: 'blur(5px)',
        }}
      >
        {items.map((d) => (
          <div
            key={d.label}
            className='flex justify-center cursor-pointer'
            role='button'
            tabIndex={0}
            title={`ดูรายละเอียด ${d.label}`}
            onClick={() => setSelected(d.id)}
          >
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
        background: 'rgba(0,0,0,0.8)',
        borderRadius: 20,
        backdropFilter: 'blur(5px)',
      }}
    >
      {items.map((d) => (
        <div
          key={d.label}
          className='flex-1 flex justify-center cursor-pointer'
          role='button'
          tabIndex={0}
          title={`ดูรายละเอียด ${d.label}`}
          onClick={() => setSelected(d.id)}
        >
          <Donut pct={d.pct} color={d.color} label={d.label} size={size} />
        </div>
      ))}
    </div>
  )
}

export default React.memo<Props>(RatioChart)
