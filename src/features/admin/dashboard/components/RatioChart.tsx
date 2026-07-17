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
  /** Device count for this system — `null` until the query resolves. A donut
   *  is hidden once its data loads with total = 0 (dept owns no such devices;
   *  "0% Online" would misread as an outage). */
  total: number | null
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
      {/* mt-1 (was -mt-2): keep a visible gap between the ring and its label —
        * the ring's bottom edge sits ~6% inside the canvas, so a negative
        * margin made them touch. Donut size itself stays unchanged. */}
      <div
        className={`${isSmall ? 'text-sm' : 'text-base'} font-bold mt-1 text-center leading-tight`}
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
      { id: 'cctv',      ...STATIC_DONUTS.cctv,      pct: cctv?.percentage      ?? 0, total: cctv      ? cctv.camera.total         : null },
      { id: 'traffic',   ...STATIC_DONUTS.traffic,   pct: traffic?.percentage   ?? 0, total: traffic   ? traffic.traffic.total     : null },
      { id: 'lighting',  ...STATIC_DONUTS.lighting,  pct: lighting?.percentage  ?? 0, total: lighting  ? lighting.lighting.total   : null },
      { id: 'vms',       ...STATIC_DONUTS.vms,       pct: vms?.percentage       ?? 0, total: vms       ? vms.vms.total             : null },
      { id: 'wim',       ...STATIC_DONUTS.wim,       pct: wim?.percentage       ?? 0, total: wim       ? wim.wim.total             : null },
      { id: 'crosswalk', ...STATIC_DONUTS.crosswalk, pct: crosswalk?.percentage ?? 0, total: crosswalk ? crosswalk.crosswalk.total : null },
      { id: 'tunnel',    ...STATIC_DONUTS.tunnel,    pct: tunnel?.percentage    ?? 0, total: tunnel    ? tunnel.tunnel.total       : null },
    ],
    [cctv, lighting, vms, traffic, wim, crosswalk, tunnel],
  )

  // Hide zero-device systems (loaded + total 0). `null` (still loading) stays
  // visible at 0% so the row doesn't flash empty while queries resolve.
  const visible = items.filter((d) => d.total !== 0)

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

  // Every system loaded with 0 devices — nothing meaningful to render.
  if (visible.length === 0) return null

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
        {visible.map((d) => (
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

  // desktop horizontal row — py-4 gives the donut + label pair breathing room.
  // Fixed 126px per donut cell (= 880 / 7, the full-row density) with a
  // fit-content card, so hiding zero-device systems shrinks the card instead
  // of spreading the remaining donuts across the old full width.
  return (
    <div
      className='flex items-center py-4 w-fit max-w-full'
      style={{
        background: 'rgba(0,0,0,0.8)',
        borderRadius: 20,
        backdropFilter: 'blur(5px)',
      }}
    >
      {visible.map((d) => (
        <div
          key={d.label}
          className='flex justify-center cursor-pointer shrink-0'
          style={{ width: 126 }}
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
