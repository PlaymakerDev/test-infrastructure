"use client"
import {
  TbCamera,
  TbDeviceDesktop,
  TbWeight,
  TbBolt,
  TbBuildingBridge,
  TbBuildingBridge2,
  TbCar,
  TbWalk,
  TbChartBar,
  TbTrafficLights,
} from 'react-icons/tb'
import type { IconType } from 'react-icons'
import {
  SYSTEMS,
  SYSTEM_TYPES,
  type SystemType,
} from '@/features/admin/dashboard/data/systems'

const SYSTEM_ICONS: Record<SystemType, IconType> = {
  CCTV: TbCamera,
  VMS: TbDeviceDesktop,
  WIM: TbWeight,
  Lighting: TbBolt,
  BridgeLighting: TbBuildingBridge,
  Tunnel: TbBuildingBridge2,
  Counting: TbCar,
  CrossWalk: TbWalk,
  Analytic: TbChartBar,
  Traffic: TbTrafficLights,
}

export interface SystemFilterPillsProps {
  value: Set<SystemType>
  onChange: (next: Set<SystemType>) => void
  /** Hide entire pill bar when false (default true) */
  visible?: boolean
  /** Vertical position from top (default 64) */
  top?: number
}

const SystemFilterPills: React.FC<SystemFilterPillsProps> = ({
  value,
  onChange,
  visible = true,
  top = 64,
}) => {
  if (!visible) return null

  const allOn = value.size === SYSTEM_TYPES.length
  const noneOn = value.size === 0

  const toggle = (t: SystemType) => {
    const next = new Set(value)
    if (next.has(t)) next.delete(t)
    else next.add(t)
    onChange(next)
  }

  const reset = () => {
    onChange(allOn ? new Set() : new Set(SYSTEM_TYPES))
  }

  return (
    <div
      // mobile: leave 80px each side so the notification badge has clearance
      // sm+: only need 40px per side
      className="absolute z-20 flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 sm:py-1.5 pointer-events-auto scrollbar-none max-w-[calc(100vw-160px)] sm:max-w-[calc(100vw-80px)]"
      style={{
        top,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(10,14,26,0.88)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 999,
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        overflowX: 'auto',
      }}
    >
      {SYSTEM_TYPES.map((type) => {
        const active = value.has(type)
        const Icon = SYSTEM_ICONS[type]
        const color = SYSTEMS[type].color
        return (
          <button
            key={type}
            onClick={() => toggle(type)}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-medium transition-all whitespace-nowrap shrink-0"
            style={{
              background: active ? color : 'transparent',
              color: active ? '#fff' : 'rgba(255,255,255,0.4)',
              border: `1px solid ${active ? color : 'rgba(255,255,255,0.12)'}`,
              cursor: 'pointer',
            }}
            title={`${active ? 'ซ่อน' : 'แสดง'} ${SYSTEMS[type].label}`}
          >
            <Icon size={11} />
            <span>{SYSTEMS[type].label}</span>
          </button>
        )
      })}
      <button
        onClick={reset}
        className="ml-1 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] text-[#6b7f9a] hover:text-white transition-colors whitespace-nowrap shrink-0"
        title={allOn ? 'ซ่อนทั้งหมด' : 'แสดงทั้งหมด'}
      >
        {noneOn ? '↻ แสดงทั้งหมด' : allOn ? '✕ ซ่อนทั้งหมด' : '↻ รีเซ็ต'}
      </button>
    </div>
  )
}

export default SystemFilterPills
