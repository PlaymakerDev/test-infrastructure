"use client"
import { scopeQuerySuffix } from '@/services/routes/scopeParam'
import { useEffect, useMemo, useRef, useState, createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { IconType } from 'react-icons'
import {
  TbVideo,
  TbDeviceDesktop,
  TbBolt,
  TbBuildingBridge,
  TbBuildingBridge2,
  TbCar,
  TbCarCrash,
  TbWalk,
  TbTrafficLights,
} from 'react-icons/tb'
import IconTracking from '@/components/icon/IconTracking'
import IconLPR from '@/components/icon/IconLPR'
import {
  SYSTEMS,
  SYSTEM_BRIGHT,
  SYSTEM_TYPES,
  type SystemType,
} from '@/features/admin/dashboard/data/systems'
import type { Device } from '@/features/admin/dashboard/data/mockDevices'
import { useRouter } from 'next/navigation'
import { useMap } from '../hooks/useMap'
import MarkerLayer, { type MarkerColor } from '../primitives/MarkerLayer'
import PopupDetailLink from '../primitives/PopupDetailLink'

const SYSTEM_ICONS: Record<SystemType, IconType> = {
  CCTV: TbVideo,
  VMS: TbDeviceDesktop,
  WIM: IconTracking,
  LPR: IconLPR,
  Lighting: TbBolt,
  BridgeLighting: TbBuildingBridge,
  Tunnel: TbBuildingBridge2,
  Counting: TbCar,
  CrossWalk: TbWalk,
  Analytic: TbCarCrash,
  Traffic: TbTrafficLights,
}

function iconToImage(IconComp: IconType, size = 64): Promise<HTMLImageElement> {
  const svg = renderToStaticMarkup(
    createElement(IconComp, { size, color: '#ffffff', strokeWidth: 2.4 })
  )
  const url = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  return new Promise((resolve, reject) => {
    const img = new Image(size, size)
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(e)
    img.src = url
  })
}

export interface DeviceClusterMarkerProps {
  /** All devices — will be split into one source per system */
  devices: Device[]
  /** Which systems to render (default: all 10) */
  systems?: SystemType[]
  /** Per-system visibility filter — system not in set is hidden */
  visibleTypes?: Set<SystemType>
  /** Hide markers below this zoom (default 6.5 — STCH summary takes over) */
  minZoom?: number
  /** Click on an unclustered device */
  onClick?: (device: Device) => void
  /** Fired on any cluster-bubble click (in addition to the zoom-to-expand),
   *  so callers can react without losing the default expansion. */
  onClusterClick?: () => void
  /**
   * Render JSX inside the popup when a device is clicked.
   * - Pass a function to override the default popup (e.g., add custom actions, link to detail page)
   * - Pass `null` to disable the popup entirely (you handle UI via `onClick`)
   * - Omit to use the built-in default popup
   */
  popup?: ((device: Device, color: string) => React.ReactNode) | null
}

/** Device type → overall feature route segment. Types with a standard
 *  `/admin/{route}/detail/{solution_id}` page get a "ดูเพิ่มเติม" link; types
 *  without one (WIM / Lighting / Tunnel) are omitted, so the popup just shows
 *  the info lines for them. */
const DETAIL_ROUTE: Partial<Record<SystemType, string>> = {
  CCTV: 'cctv',
  Analytic: 'incident-detection',
  Counting: 'traffic-volume',
  Traffic: 'traffic-signal',
  VMS: 'vms',
  CrossWalk: 'crosswalk',
  BridgeLighting: 'bridge-lighting',
  LPR: 'lpr',
}

/** Default popup body — เมนู (device type) + จุดติดตั้ง + สายทาง, plus a
 *  "ดูเพิ่มเติม" link into that install point's detail page when the type maps
 *  to a known route. Data comes from `/manage/solution/{dept}/position`.
 *
 *  Rendered in a detached React root (mapbox popup) so Next's router context is
 *  NOT available here. Navigation therefore comes in as an `onNavigate` prop
 *  captured from `DeviceClusterMarker` (which IS inside the router provider) —
 *  clicking runs a CLIENT-SIDE `router.push` (via the shared `PopupDetailLink`
 *  button), identical to the table detail links — and `router.push` prepends
 *  the deploy `basePath` (e.g. `/atlas`) automatically. */
export function DefaultDevicePopup({
  device,
  color,
  onNavigate,
}: {
  device: Device
  color: string
  onNavigate?: (url: string) => void
}) {
  const route = DETAIL_ROUTE[device.type]
  // Use the SOLUTION's own department (road.department_id) so the link lands on
  // the right dept-scoped data even on the nationwide (dept_id=0) dashboard,
  // where markers span many depts. Falls back to the dashboard's URL dept_id.
  // Only dept_id is needed — the detail page self-derives project_id + road_id
  // from its central list. Same format as the overall table links.
  const deptId =
    device.unitId ||
    (typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('dept_id')
      : null)
  // `detailId ?? id` — LPR devices prefix their marker id (`lpr-<solution_id>`)
  // to avoid key collisions with the same solution's /position marker; the
  // detail route needs the bare solution_id carried in `detailId`.
  const detailUrl = route
    ? `/admin/${route}/detail/${device.detailId ?? device.id}${deptId ? `?dept_id=${deptId}${scopeQuerySuffix()}` : ''}`
    : null
  // Bright variant of the marker color — the raw SYSTEMS color reads too dim as
  // a popup border/label on the dark map (per Figma: brighter).
  const brightColor = SYSTEM_BRIGHT[device.type] ?? color

  // Tri-state status pill — hidden entirely when BE hasn't sent is_online for
  // this marker (isOnline === undefined), so unpatched types don't get a
  // misleading "ออฟไลน์" label.
  const statusMeta =
    device.isOnline === true
      ? { label: 'ออนไลน์', color: '#22c55e' }
      : device.isOnline === false
        ? { label: 'ออฟไลน์', color: '#ef4444' }
        : null

  return (
    <div
      style={{
        padding: '10px 12px',
        minWidth: 210,
        background: 'rgba(5,13,26,0.96)',
        border: `1px solid ${brightColor}`,
        borderRadius: 10,
      }}
    >
      {/* เมนู (device type) + สถานะ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 14, color: brightColor, fontWeight: 700, letterSpacing: 0.5, flex: 1 }}>
          {SYSTEMS[device.type].label}
        </div>
        {statusMeta && (
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: statusMeta.color,
              border: `1px solid ${statusMeta.color}`,
              borderRadius: 999,
              padding: '2px 6px',
              lineHeight: 1,
            }}
          >
            {statusMeta.label}
          </span>
        )}
      </div>
      {/* จุดติดตั้ง */}
      <div style={{ fontSize: 14, color: '#cbd5e1', marginTop: 7, lineHeight: 1.4 }}>
        <span style={{ color: '#64748b' }}>จุดติดตั้ง: </span>
        <span style={{ color: '#fff' }}>{device.solutionName || '-'}</span>
      </div>
      {/* สายทาง */}
      <div style={{ fontSize: 14, color: '#cbd5e1', marginTop: 3, lineHeight: 1.4 }}>
        <span style={{ color: '#64748b' }}>สายทาง: </span>
        <span style={{ color: '#fff' }}>{device.road || '-'}</span>
      </div>
      {/* ดูเพิ่มเติม → install point detail page. Shared button navigates
        * client-side via `onNavigate` (router.push), preserving the basePath. */}
      {detailUrl && <PopupDetailLink url={detailUrl} onNavigate={onNavigate} />}
    </div>
  )
}

/**
 * Renders all 10 system layers on the map with clustering + colored icons.
 * Auto-registers icon images on mount.
 */
const DeviceClusterMarker: React.FC<DeviceClusterMarkerProps> = ({
  devices,
  systems = SYSTEM_TYPES,
  visibleTypes,
  minZoom = 6.5,
  onClick,
  onClusterClick,
  popup,
}) => {
  const { map, isLoaded } = useMap()
  // Captured here (inside the App Router provider) so the detached-root popup
  // can navigate client-side — see DefaultDevicePopup's note on basePath.
  const router = useRouter()
  const [iconsReady, setIconsReady] = useState(false)
  const registeredRef = useRef(false)

  // Register icon images once on map load
  useEffect(() => {
    if (!map || !isLoaded || registeredRef.current) return
    registeredRef.current = true
    let cancelled = false

    Promise.all(
      systems.map(async (type) => {
        const img = await iconToImage(SYSTEM_ICONS[type], 64)
        if (cancelled || !map) return
        if (!map.hasImage(`icon-${type}`)) {
          map.addImage(`icon-${type}`, img, { pixelRatio: 2 })
        }
      })
    ).then(() => {
      if (!cancelled) setIconsReady(true)
    })

    return () => {
      cancelled = true
    }
  }, [map, isLoaded, systems])

  // Pre-build feature collections by system (recompute when devices change)
  const featureCollections = useMemo(() => {
    const byType: Record<string, GeoJSON.FeatureCollection<GeoJSON.Point, Record<string, unknown>>> = {}
    for (const type of systems) {
      const features = devices
        .filter((d) => d.type === type)
        .map((d) => ({
          type: 'Feature' as const,
          properties: {
            id: d.id, type: d.type, road: d.road, landmark: d.landmark,
            unitId: d.unitId, stch: d.stch, solutionName: d.solutionName,
            isOnline: d.isOnline,
            // Must survive the GeoJSON round-trip — the popup rebuilds the
            // Device from f.properties, and LPR detail links need the bare
            // solution_id carried here (omitting it sent /detail/lpr-<id>,
            // an empty page; reported 2026-07-21).
            detailId: d.detailId,
            // Tri-state so the data-driven expression can distinguish
            // "definitely offline" from "unknown" — 1=online, 0=offline,
            // -1=unknown (BE hasn't shipped is_online yet).
            isOnlineFlag: d.isOnline === true ? 1 : d.isOnline === false ? 0 : -1,
          },
          geometry: { type: 'Point' as const, coordinates: d.coord },
        }))
      byType[type] = { type: 'FeatureCollection', features }
    }
    return byType
  }, [devices, systems])

  if (!iconsReady) return null

  return (
    <>
      {systems.map((type) => {
        const visible = visibleTypes ? visibleTypes.has(type) : true
        const color = SYSTEMS[type].color

        // Per-feature colour: offline pins mute to grey; unknown / online keep
        // the system's brand colour so the visual noise is proportional to the
        // information (nothing changes until BE ships `is_online`). Mapbox
        // clusters don't have `isOnlineFlag` on the feature so the fallback
        // (last arm of `case`) is what cluster bubbles pick up.
        const colorExpr: MarkerColor = [
          'case',
          ['==', ['get', 'isOnlineFlag'], 0], '#94a3b8',
          color,
        ]

        // Resolve which popup renderer to use:
        // - undefined → DefaultDevicePopup
        // - function  → caller's custom render
        // - null      → no popup (caller handles UI via onClick)
        const popupRenderer =
          popup === null
            ? undefined
            : popup
              ? (f: GeoJSON.Feature) => popup(f.properties as Device, color)
              : (f: GeoJSON.Feature) => (
                  <DefaultDevicePopup
                    device={f.properties as Device}
                    color={color}
                    onNavigate={(url) => router.push(url)}
                  />
                )

        return (
          <MarkerLayer
            key={type}
            id={`device-${type}`}
            data={featureCollections[type]}
            cluster
            color={colorExpr}
            iconImage={`icon-${type}`}
            minZoom={minZoom}
            visible={visible}
            onClick={(_, feature) => onClick?.(feature.properties as Device)}
            onClusterClickCapture={onClusterClick ? () => onClusterClick() : undefined}
            popup={popupRenderer}
          />
        )
      })}
    </>
  )
}

export default DeviceClusterMarker
