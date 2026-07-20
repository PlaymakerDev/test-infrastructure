"use client"
import React, { memo, useMemo } from 'react'
import { useRouter } from 'next/navigation'
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
import { useDashboardPosition } from '@/hooks/queries/dashboard'
import { useDeptId } from '@/hooks/useDeptId'

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
  /** Route the tile navigates to on click — the feature's overall page. */
  route: string
}

const TILES: TileConfig[] = [
  { id: 'cctv',           label: 'CCTV',      color: '#FF8566', Icon: TbVideo,          apiTypeName: 'CCTV',           unit: 'จุด',   route: '/admin/cctv' },
  { id: 'traffic',        label: 'Traffic',   color: '#FFC766', Icon: TbTrafficLights,  apiTypeName: 'Traffic',        unit: 'จุด',   route: '/admin/traffic-signal' },
  { id: 'vms',            label: 'VMS',       color: '#70FF66', Icon: TbDeviceDesktop,  apiTypeName: 'VMS',            unit: 'จุด',   route: '/admin/vms' },
  { id: 'lighting',       label: 'Lighting',  color: '#D9FF66', Icon: TbBolt,           apiTypeName: 'Lighting',       unit: 'จุด',   route: '/admin/traffic-lighting' },
  { id: 'crosswalk',      label: 'Crosswalk', color: '#66F0FF', Icon: TbWalk,           apiTypeName: 'Crosswalk',      unit: 'จุด',   route: '/admin/crosswalk' },
  { id: 'bridgelighting', label: 'B.Light',   color: '#6685FF', Icon: TbBuildingBridge, apiTypeName: 'BridgeLighting', unit: 'จุด',   route: '/admin/bridge-lighting' },
  { id: 'wim',            label: 'WIM',       color: '#66FFB5', Icon: IconTracking,     apiTypeName: 'WIM',            unit: 'จุด',   route: '/admin/tracking' },
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
        // Symmetric vertical padding — the old 4px-top/8px-bottom left the
        // content hugging the bar's top edge once the counts grew to 30px;
        // equal padding re-centres the block (2026-07-20).
        padding: compact ? '6px' : '10px 6px',
        background: 'transparent',
        border: 'none',
      }}
    >
      {/* Icon + label header */}
      <div className="flex items-center gap-1.5 mb-1" style={{ color }}>
        <Icon size={compact ? 16 : 20} />
        <span className={`font-semibold ${compact ? 'fs-12' : 'fs-14'}`}>
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
      {/* Big count — fs-24 = the project clamp scale (30px on desktop,
        * scaling down with the viewport) instead of the old fixed 22/26px,
        * per design 2026-07-20. */}
      <div className="fs-24 font-bold leading-none tabular-nums" style={{ color }}>
        {display}
      </div>
      {/* Unit */}
      <div
        className="fs-12 mt-0.5"
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
  const router = useRouter()
  const deptId = useDeptId()

  // Every tile links to its feature's overall page, dept-scoped. Same URL
  // shape the sidebar uses so the target page hydrates its own scope
  // correctly (no `scope=all` here — we're inside a specific dept view).
  const openFeature = (route: string) => {
    const q = deptId ? `?dept_id=${encodeURIComponent(String(deptId))}` : ''
    router.push(`${route}${q}`)
  }
  // Every tile — CCTV included now — derives its count from a single
  // /position fetch grouped by solution_type_name. One query, one source of
  // truth: the number that shows on the tile equals the number of pins on
  // the map. (Prior version used cctv-uptime's camera.total, which is
  // devices-per-solution rather than install-points — didn't match the
  // pins and confused users.)
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
      const count = position ? (countsByType[t.apiTypeName] ?? 0) : null
      return { ...t, count }
    })
  }, [position, countsByType])

  const visible = items.filter((t) => t.count !== 0)

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
            onClick={() => openFeature(t.route)}
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
      {/* 140px per tile (was 126) — proportioned for the 30px counts. */}
      {visible.map((t) => (
        <div key={t.id} className="shrink-0" style={{ width: 140 }}>
          <Tile
            label={t.label}
            color={t.color}
            Icon={t.Icon}
            count={t.count}
            unit={t.unit}
            size={140}
            onClick={() => openFeature(t.route)}
          />
        </div>
      ))}
    </div>
  )
}

export default React.memo<Props>(RatioChart)
