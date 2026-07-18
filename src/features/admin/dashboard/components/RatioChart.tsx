"use client"
import React, { memo, useMemo, useState } from 'react'
import {
  TbVideo,
  TbTrafficLights,
  TbDeviceDesktop,
  TbBolt,
  TbWalk,
  TbBuildingBridge,
} from 'react-icons/tb'
import type { IconType } from 'react-icons'
import IconTracking from '@/components/icon/IconTracking'
import {
  useDashboardCctvUptime,
  useDashboardPosition,
} from '@/hooks/queries/dashboard'
import { useDeptId } from '@/hooks/useDeptId'
import SystemDetailCard from './SystemDetailCard'
import { MOCK_SYSTEM_DETAIL } from '../data/systemDetailMock'

// ── Tile configuration ────────────────────────────────────────────────────────
// One row per KPI: which solution_type_name to count in the /position payload,
// which icon + label to render, and (for CCTV only) which uptime hook feeds
// the secondary "cameras" metric. Order is deliberate: CCTV first (biggest,
// most familiar), then signal control, then info displays, then infrastructure,
// then specialised — see conversation w/ Keng 2026-07-18.

interface TileConfig {
  id: string
  label: string
  color: string
  Icon: IconType
  /** Value from /manage/solution/{dept}/position.solution_type_name that maps
   *  to this tile. Different from the FE `SystemType` enum because BE uses
   *  "Crosswalk" (no capital W) etc. */
  apiTypeName: string
  /** Unit shown under the count. "จุด" for install-point, "กล้อง" for CCTV. */
  unit: string
}

const TILES: TileConfig[] = [
  { id: 'cctv',           label: 'CCTV',          color: '#FF8566', Icon: TbVideo,          apiTypeName: 'CCTV',           unit: 'กล้อง' },
  { id: 'traffic',        label: 'Traffic',       color: '#FFC766', Icon: TbTrafficLights,  apiTypeName: 'Traffic',        unit: 'จุด'   },
  { id: 'vms',            label: 'VMS',           color: '#70FF66', Icon: TbDeviceDesktop,  apiTypeName: 'VMS',            unit: 'จุด'   },
  { id: 'lighting',       label: 'Lighting',      color: '#D9FF66', Icon: TbBolt,           apiTypeName: 'Lighting',       unit: 'จุด'   },
  { id: 'crosswalk',      label: 'Crosswalk',     color: '#66F0FF', Icon: TbWalk,           apiTypeName: 'Crosswalk',      unit: 'จุด'   },
  { id: 'bridgelighting', label: 'B.Light',       color: '#6685FF', Icon: TbBuildingBridge, apiTypeName: 'BridgeLighting', unit: 'จุด'   },
  { id: 'wim',            label: 'WIM',           color: '#66FFB5', Icon: IconTracking,     apiTypeName: 'WIM',            unit: 'จุด'   },
]

interface TileProps {
  label: string
  color: string
  Icon: IconType
  count: number | null
  unit: string
  size: number
  onClick: () => void
}

/** Compact KPI tile — icon + label header, big count, unit line. Matches the
 *  "no more online/offline donuts" direction (Keng, 2026-07-18): count is the
 *  primary metric; live status shows on the map markers via `is_online`. */
const Tile = memo(function Tile({ label, color, Icon, count, unit, size, onClick }: TileProps) {
  const compact = size < 130
  const display = count == null ? '—' : count.toLocaleString('th-TH')
  return (
    <button
      type="button"
      onClick={onClick}
      title={`ดูรายละเอียด ${label}`}
      className="flex flex-col items-center justify-start cursor-pointer group"
      style={{
        width: size,
        padding: '4px 6px 8px',
        background: 'transparent',
        border: 'none',
      }}
    >
      {/* Icon + label header */}
      <div className="flex items-center gap-1.5 mb-1" style={{ color }}>
        <Icon size={compact ? 16 : 18} />
        <span className={`font-semibold ${compact ? 'text-[13px]' : 'text-[14px]'}`}>
          {label}
        </span>
      </div>
      {/* Divider dash — brand-coloured, thin */}
      <div
        style={{
          width: '65%',
          height: 1,
          background: color,
          opacity: 0.35,
          marginBottom: compact ? 4 : 6,
        }}
      />
      {/* Big count */}
      <div
        className="font-bold leading-none tabular-nums"
        style={{
          color,
          fontSize: compact ? 22 : 26,
        }}
      >
        {display}
      </div>
      {/* Unit */}
      <div
        className={`${compact ? 'text-[11px]' : 'text-[12px]'} mt-0.5`}
        style={{ color: 'rgba(255,255,255,0.65)' }}
      >
        {unit}
      </div>
    </button>
  )
})

interface Props {
  size?: number
  cols?: number
}

const RatioChart: React.FC<Props> = ({ size = 110, cols }) => {
  const deptId = useDeptId()
  // CCTV needs a special count — "กล้อง" not "จุดติดตั้ง" (one CCTV solution
  // can hold multiple cameras). The uptime endpoint's `.camera.total` is the
  // canonical camera count.
  const { data: cctvUptime } = useDashboardCctvUptime(deptId)
  // Every other tile derives its count from a single /position fetch, grouped
  // by solution_type_name. One query instead of six per-feature uptime hooks
  // — cuts the initial dashboard load in half + guarantees the numbers agree
  // with the map's actual pins (same source).
  const { data: position } = useDashboardPosition(deptId)

  const countsByType = useMemo(() => {
    const acc: Record<string, number> = {}
    for (const loc of position?.locations ?? []) {
      const t = loc.solution?.solution_type_name
      if (!t) continue
      acc[t] = (acc[t] ?? 0) + 1
    }
    return acc
  }, [position])

  // Resolve the numeric count for each tile. `null` = still loading (both
  // upstream queries return undefined). Once loaded, zero-device tiles are
  // filtered out so the card doesn't render "0 จุด" for systems the dept
  // simply doesn't own — mirrors the previous donut behaviour.
  const items = useMemo(() => {
    return TILES.map((t) => {
      const count = t.id === 'cctv'
        ? (cctvUptime ? cctvUptime.camera.total : null)
        : (position ? (countsByType[t.apiTypeName] ?? 0) : null)
      return { ...t, count }
    })
  }, [cctvUptime, position, countsByType])

  const visible = items.filter((t) => t.count !== 0)

  const [selected, setSelected] = useState<string | null>(null)
  const selectedItem = selected ? items.find((t) => t.id === selected) : null
  if (selectedItem) {
    return (
      <SystemDetailCard
        system={{ label: selectedItem.label, color: selectedItem.color }}
        data={MOCK_SYSTEM_DETAIL[selectedItem.id] ?? MOCK_SYSTEM_DETAIL.cctv}
        onBack={() => setSelected(null)}
        size={cols ? 110 : 120}
      />
    )
  }

  if (visible.length === 0) return null

  if (cols) {
    // Mobile / grid layout — used inside the bottom sheet.
    return (
      <div
        className="grid gap-y-2 py-3"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          background: 'rgba(0,0,0,0.8)',
          borderRadius: 20,
          backdropFilter: 'blur(5px)',
        }}
      >
        {visible.map((t) => (
          <Tile
            key={t.id}
            label={t.label}
            color={t.color}
            Icon={t.Icon}
            count={t.count}
            unit={t.unit}
            size={size}
            onClick={() => setSelected(t.id)}
          />
        ))}
      </div>
    )
  }

  // Desktop horizontal row.
  return (
    <div
      className="flex items-stretch py-3 w-fit max-w-full"
      style={{
        background: 'rgba(0,0,0,0.8)',
        borderRadius: 20,
        backdropFilter: 'blur(5px)',
      }}
    >
      {visible.map((t) => (
        <div key={t.id} className="shrink-0" style={{ width: 126 }}>
          <Tile
            label={t.label}
            color={t.color}
            Icon={t.Icon}
            count={t.count}
            unit={t.unit}
            size={126}
            onClick={() => setSelected(t.id)}
          />
        </div>
      ))}
    </div>
  )
}

export default React.memo<Props>(RatioChart)
