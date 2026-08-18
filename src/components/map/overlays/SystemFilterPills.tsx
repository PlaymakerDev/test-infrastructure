"use client"
import {
  TbVideo,
  TbDeviceDesktop,
  TbBuildingBridge,
  TbBuildingBridge2,
  TbCar,
  TbCarCrash,
  TbWalk,
  TbTrafficLights,
} from 'react-icons/tb'
import { FaRegLightbulb } from 'react-icons/fa6'
import type { IconType } from 'react-icons'
import IconTracking from '@/components/icon/IconTracking'
import IconLPR from '@/components/icon/IconLPR'
import {
  SYSTEMS,
  SYSTEM_TYPES,
  type SystemType,
} from '@/features/admin/dashboard/data/systems'

// Same icons as the navbar menu (configs/menu/admin.ts) so the pill row reads
// as a filter for the menus above; key order mirrors the navbar menu order.
// WIM/Tracking uses the shared IconTracking — the same custom glyph the navbar
// itself renders (its menu config has no Tb icon name).
const SYSTEM_ICONS: Record<SystemType, IconType> = {
  CCTV: TbVideo,
  Counting: TbCar,
  Analytic: TbCarCrash,
  Traffic: TbTrafficLights,
  CrossWalk: TbWalk,
  Lighting: FaRegLightbulb,
  VMS: TbDeviceDesktop,
  BridgeLighting: TbBuildingBridge,
  Tunnel: TbBuildingBridge2,
  WIM: IconTracking,
  LPR: IconLPR,
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
      // Mobile: pills sit on their own row (below the search row since the
      // 2026-07-20 respace), so the bar can run nearly edge-to-edge; labeled
      // pills scroll horizontally inside it. Desktop keeps side clearance.
      className="absolute z-20 flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 sm:py-1.5 pointer-events-auto scrollbar-none max-w-[calc(100vw-24px)] sm:max-w-[calc(100vw-80px)]"
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
          // Icon-only pill — the label slides out on hover (max-width tween),
          // so an 11-system row stays compact at all times (the full labeled
          // row outgrew the map width, 2026-07-20). Selected state reads from
          // the fill color alone: system color = shown, gray outline = hidden.
          <button
            key={type}
            onClick={() => toggle(type)}
            className="group flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full fs-12 font-medium transition-all whitespace-nowrap shrink-0"
            style={{
              background: active ? color : 'transparent',
              color: active ? '#fff' : 'rgba(255,255,255,0.5)',
              border: `1px solid ${active ? color : 'rgba(255,255,255,0.15)'}`,
              cursor: 'pointer',
            }}
            title={`${active ? 'ซ่อน' : 'แสดง'} ${SYSTEMS[type].label}`}
          >
            <Icon size={16} />
            {/* Mobile (< sm): label always visible — touch has no hover, so
              * icon-only pills would be unlabeled. Desktop: hover-expand. */}
            <span className="max-w-40 opacity-100 ml-1.5 sm:max-w-0 sm:opacity-0 sm:ml-0 overflow-hidden transition-all duration-200 ease-out sm:group-hover:max-w-40 sm:group-hover:opacity-100 sm:group-hover:ml-1.5">
              {SYSTEMS[type].label}
            </span>
          </button>
        )
      })}
      <button
        onClick={reset}
        className="ml-1 px-2 sm:px-2.5 py-1 sm:py-1.5 fs-12 text-[#6b7f9a] hover:text-white transition-colors whitespace-nowrap shrink-0"
        title={allOn ? 'ซ่อนทั้งหมด' : 'แสดงทั้งหมด'}
      >
        {noneOn ? '↻ แสดงทั้งหมด' : allOn ? '✕ ซ่อนทั้งหมด' : '↻ รีเซ็ต'}
      </button>
    </div>
  )
}

export default SystemFilterPills
