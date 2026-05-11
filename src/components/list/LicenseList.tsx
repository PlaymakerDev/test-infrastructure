"use client"
import React, { useCallback, useMemo, useState } from 'react'

export type LicenseTimelineStatus = 'ไม่เกินพิกัด' | 'เกินพิกัด'

export interface LicenseTimelineItem {
  id: string | number
  image: string
  title: string
  timestamp: string
  camera_name: string
  status: LicenseTimelineStatus
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
}

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
}> = ({ item, selected, onClick }) => (
  <div
    onClick={() => onClick(item)}
    className={[
      'bg-(--light-black) py-3 px-5 rounded-lg cursor-pointer transition-colors duration-200',
      selected ? 'ring-2 ring-(--yellow)' : '',
    ].join(' ')}
  >
    <div className='flex flex-wrap items-start justify-between gap-x-3 gap-y-2'>
      <div>
        <h2>{item.license_no}</h2>
        <p className='text-sm'>{item.license_province}</p>
      </div>
      <div className='shrink-0 rounded-3xl py-1 px-4 border border-(--yellow) text-center text-sm'>
        {item.license_type}
      </div>
    </div>
    <div className='mt-4'>
      <p className='text-(--yellow) text-sm'>พบล่าสุด</p>
      <p className='text-sm'>{item.road_description} {item.sta}</p>
      <p className='text-gray-400 text-xs mt-1'>{item.timestamp}</p>
    </div>
  </div>
)

const MemoCard = React.memo(LicenseCard)

const LicenseList: React.FC<LicenseListProps> = ({
  data,
  onSelect,
  columns = { base: 1 },
}) => {
  const [selectedId, setSelectedId] = useState<string | number | null>(null)

  const handleClick = useCallback((item: LicenseItem) => {
    setSelectedId(item.id)
    onSelect?.(item)
  }, [onSelect])

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
          selected={selectedId === item.id}
          onClick={handleClick}
        />
      ))}
    </div>
  )
}

export default React.memo(LicenseList)
