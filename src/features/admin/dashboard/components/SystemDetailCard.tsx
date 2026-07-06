"use client"
import React, { memo } from 'react'
import dynamic from 'next/dynamic'
import type { IconType } from 'react-icons'
import {
  TbLayoutGrid,
  TbWifi,
  TbWifiOff,
  TbShieldCheck,
  TbClock,
  TbFolderPlus,
  TbUsers,
  TbCircleCheck,
} from 'react-icons/tb'
import type { SystemDetailData } from '../data/systemDetailMock'

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

// ── Center donut (system name in the middle, ring = online share) ─────────────

const CenterDonut = memo(function CenterDonut(props: {
  name: string
  color: string
  online: number
  all: number
  size: number
}) {
  const { name, color, online, all, size } = props
  const pct = all > 0 ? Math.round((online / all) * 100) : 0

  const option = {
    backgroundColor: 'transparent',
    series: [
      {
        type: 'gauge',
        startAngle: 90,
        endAngle: -270,
        radius: '92%',
        pointer: { show: false },
        progress: { show: true, overlap: false, roundCap: false, clip: false, itemStyle: { color } },
        axisLine: { lineStyle: { width: 14, color: [[1, '#0d1825']] as [number, string][] } },
        splitLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        data: [{ value: pct }],
        detail: {
          show: true,
          offsetCenter: [0, '0%'],
          // System name (smaller) + % + Online — mirrors the summary donut on
          // the front card, with the name added on top for context.
          formatter: `{name|${name}}\n{pct|${pct}%}\n{sub|Online}`,
          rich: {
            name: { fontSize: name.length > 9 ? 11 : 12, fontWeight: 'bold', color, lineHeight: 15 },
            pct: { fontSize: 16, fontWeight: 'bold', color, lineHeight: 20 },
            sub: { fontSize: 9, color, opacity: 0.8, lineHeight: 12 },
          },
        },
        title: { show: false },
      },
    ],
  }

  return (
    <ReactECharts
      option={option}
      style={{ width: size, height: size, flexShrink: 0 }}
      opts={{ renderer: 'canvas' }}
    />
  )
})

// ── One stat line: icon + label + value ───────────────────────────────────────

const StatLine: React.FC<{ icon: IconType; label: string; value: number; color: string }> = ({
  icon: Icon,
  label,
  value,
  color,
}) => (
  <div className="flex items-center gap-2">
    <Icon size={18} color={color} style={{ flexShrink: 0 }} />
    <span className="text-white/90 text-sm whitespace-nowrap">{label}</span>
    <span className="flex-1 min-w-4" />
    <span className="font-bold text-sm tabular-nums" style={{ color }}>
      {value.toLocaleString()}
    </span>
  </div>
)

// ── Card ──────────────────────────────────────────────────────────────────────

interface Props {
  system: { label: string; color: string }
  data: SystemDetailData
  /** Click anywhere on the card to return to the 7-donut summary. */
  onBack: () => void
  size?: number
}

const SystemDetailCard: React.FC<Props> = ({ system, data, onBack, size = 120 }) => (
  <div
    onClick={onBack}
    role="button"
    tabIndex={0}
    title="กลับไปหน้ารวม"
    className="cursor-pointer flex flex-col sm:flex-row items-center gap-3 sm:gap-8 px-5 py-3"
    style={{
      // Content-width so there's no dead space on the right (the 7-donut row
      // fills 880px, but the detail card only needs what its content uses).
      width: 'fit-content',
      maxWidth: '100%',
      background: 'rgba(0,0,0,0.8)',
      borderRadius: 20,
      backdropFilter: 'blur(5px)',
    }}
  >
    <CenterDonut
      name={system.label}
      color={system.color}
      online={data.online}
      all={data.all}
      size={size}
    />

    {/* Stats — 3 columns so the card stays ~1 donut tall (no overlap with the
      * card above). Col 1 = device counts, col 2 = case counts, col 3 =
      * warranty. Widths are content-sized so there's no dead space on the right. */}
    <div className="flex flex-wrap justify-center gap-x-6 sm:gap-x-8 gap-y-2">
      <div className="flex flex-col gap-2 min-w-30">
        <StatLine icon={TbLayoutGrid}  label="All"      value={data.all}     color={system.color} />
        <StatLine icon={TbWifi}        label="ออนไลน์"   value={data.online}  color="#66AEFF" />
        <StatLine icon={TbWifiOff}     label="ออฟไลน์"   value={data.offline} color="#E94C4C" />
      </div>
      <div className="flex flex-col gap-2 min-w-37.5">
        <StatLine icon={TbFolderPlus}  label="เปิด Case"       value={data.openCase}   color="#F97316" />
        <StatLine icon={TbUsers}       label="กำลังดำเนินการ"  value={data.inProgress} color="#A3E635" />
        <StatLine icon={TbCircleCheck} label="ปิด Case"        value={data.closedCase} color="#05F2DB" />
      </div>
      <div className="flex flex-col gap-2 min-w-30">
        <StatLine icon={TbShieldCheck} label="ในค้ำ"     value={data.inWarranty}  color="#FCD116" />
        <StatLine icon={TbClock}       label="นอกค้ำ"    value={data.outWarranty} color="#9CA3AF" />
      </div>
    </div>
  </div>
)

export default React.memo(SystemDetailCard)
