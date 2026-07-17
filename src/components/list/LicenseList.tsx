"use client"
import React, { useCallback, useMemo, useState } from 'react'

export type LicenseTimelineStatus = 'ไม่เกินพิกัด' | 'เกินพิกัด'

export interface LicenseTimelineItem {
  id: string | number
  image: string
  title: string
  timestamp: string
  camera_name: string
  // Optional: WIM records carry overweight status; ANPR records don't (no badge).
  status?: LicenseTimelineStatus
  speed: string
  lane: string
  weight?: string
  legal_weight?: string
  lat?: number
  lng?: number
}

export interface LicenseItem {
  id: string | number
  license_no: string
  license_province: string
  license_type: string
  // Optional badge color (border + text). Omit for the default yellow badge.
  license_type_color?: string
  road_description: string
  sta: string
  timestamp: string
  timeline?: LicenseTimelineItem[]
}

type ColCount = 1 | 2 | 3 | 4

export interface ColumnsConfig {
  base?: ColCount
  sm?: ColCount
  md?: ColCount
  lg?: ColCount
  xl?: ColCount
}

export interface LicenseListProps {
  data: LicenseItem[]
  onSelect?: (item: LicenseItem) => void
  columns?: ColumnsConfig
  // Optional controlled selection — when provided, the parent drives which card
  // shows the highlight ring (e.g. an auto-selected default). Omit for the
  // original uncontrolled behavior (highlight set on click only).
  selectedId?: string | number | null
  // Corner radius class for each card. LPR uses 'rounded-[20px]' (its design
  // spec); the default keeps tracking/detail/license unchanged.
  cardRadiusClass?: string
  // Typography preset. 'lpr' follows the LPR Figma (plate 24px, everything
  // else 14px on desktop via the responsive fs-* scale); 'default' keeps the
  // original fixed sizes so tracking/detail/license renders unchanged.
  textPreset?: 'default' | 'lpr'
}

const TEXT_PRESETS = {
  default: { plate: '', meta: 'text-sm', badge: 'text-sm', timestamp: 'text-xs' },
  // fs-22 → 24px desktop; fs-12 → 14px desktop.
  lpr: { plate: 'fs-22', meta: 'fs-12', badge: 'fs-12', timestamp: 'fs-12' },
} as const

// Full class strings so Tailwind scanner detects them at build time
const GRID_BASE: Record<ColCount, string> = {
  1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4',
}
const GRID_SM: Record<ColCount, string> = {
  1: 'sm:grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-4',
}
const GRID_MD: Record<ColCount, string> = {
  1: 'md:grid-cols-1', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4',
}
const GRID_LG: Record<ColCount, string> = {
  1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4',
}
const GRID_XL: Record<ColCount, string> = {
  1: 'xl:grid-cols-1', 2: 'xl:grid-cols-2', 3: 'xl:grid-cols-3', 4: 'xl:grid-cols-4',
}

const LicenseCard: React.FC<{
  item: LicenseItem
  selected: boolean
  onClick: (item: LicenseItem) => void
  radiusClass: string
  text: (typeof TEXT_PRESETS)[keyof typeof TEXT_PRESETS]
}> = ({ item, selected, onClick, radiusClass, text }) => (
  <div
    onClick={() => onClick(item)}
    className={[
      `bg-(--light-black) py-3 px-5 ${radiusClass} cursor-pointer transition-colors duration-200`,
      selected ? 'ring-2 ring-(--yellow)' : '',
    ].join(' ')}
  >
    <div className='flex flex-wrap items-start justify-between gap-x-3 gap-y-2'>
      <div>
        <h2 className={text.plate}>{item.license_no}</h2>
        <p className={text.meta}>{item.license_province}</p>
      </div>
      {item.license_type && (
        <div
          className={`shrink-0 rounded-3xl py-1 px-4 border text-center ${text.badge} ${item.license_type_color ? '' : 'border-(--yellow)'}`}
          style={item.license_type_color ? { borderColor: item.license_type_color, color: item.license_type_color } : undefined}
        >
          {item.license_type}
        </div>
      )}
    </div>
    <div className='mt-4'>
      <p className={`text-(--yellow) ${text.meta}`}>พบล่าสุด</p>
      <p className={text.meta}>{item.road_description} {item.sta}</p>
      <p className={`text-gray-400 mt-1 ${text.timestamp}`}>{item.timestamp}</p>
    </div>
  </div>
)

const MemoCard = React.memo(LicenseCard)

const LicenseList: React.FC<LicenseListProps> = ({
  data,
  onSelect,
  columns = { base: 1 },
  selectedId: controlledId,
  cardRadiusClass = 'rounded-lg',
  textPreset = 'default',
}) => {
  const [internalId, setInternalId] = useState<string | number | null>(null)
  const isControlled = controlledId !== undefined
  const activeId = isControlled ? controlledId : internalId

  const handleClick = useCallback((item: LicenseItem) => {
    if (!isControlled) setInternalId(item.id)
    onSelect?.(item)
  }, [onSelect, isControlled])

  const gridClass = useMemo(() => [
    columns.base ? GRID_BASE[columns.base] : 'grid-cols-1',
    columns.sm ? GRID_SM[columns.sm] : '',
    columns.md ? GRID_MD[columns.md] : '',
    columns.lg ? GRID_LG[columns.lg] : '',
    columns.xl ? GRID_XL[columns.xl] : '',
  ].filter(Boolean).join(' '), [columns])

  return (
    <div className={`grid ${gridClass} gap-4`}>
      {data.map((item) => (
        <MemoCard
          key={item.id}
          item={item}
          selected={activeId === item.id}
          onClick={handleClick}
          radiusClass={cardRadiusClass}
          text={TEXT_PRESETS[textPreset]}
        />
      ))}
    </div>
  )
}

export default React.memo(LicenseList)
