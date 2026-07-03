"use client"
import { useEffect, useMemo, useRef, useState, createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { IconType } from 'react-icons'
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
import {
  SYSTEMS,
  SYSTEM_TYPES,
  type SystemType,
} from '@/features/admin/dashboard/data/systems'
import type { Device } from '@/features/admin/dashboard/data/mockDevices'
import { useMap } from '../hooks/useMap'
import MarkerLayer from '../primitives/MarkerLayer'

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
}

/** Default popup body — เมนู (device type) + จุดติดตั้ง + สายทาง, plus a
 *  "ดูเพิ่มเติม" link into that install point's detail page when the type maps
 *  to a known route. Data comes from `/manage/solution/{dept}/position`.
 *  Rendered in a detached React root (mapbox popup), so we use a plain
 *  `<a href>` (Next router context isn't available here) and read dept_id from
 *  the current URL. */
export function DefaultDevicePopup({ device, color }: { device: Device; color: string }) {
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
  const detailUrl = route
    ? `/admin/${route}/detail/${device.id}${deptId ? `?dept_id=${deptId}` : ''}`
    : null

  return (
    <div
      style={{
        padding: '10px 12px',
        minWidth: 210,
        fontFamily: 'ui-sans-serif,system-ui',
        background: 'rgba(5,13,26,0.96)',
        border: `1px solid ${color}`,
        borderRadius: 10,
      }}
    >
      {/* เมนู (device type) */}
      <div style={{ fontSize: 12, color, fontWeight: 700, letterSpacing: 0.5 }}>
        {SYSTEMS[device.type].label}
      </div>
      {/* จุดติดตั้ง */}
      <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 7, lineHeight: 1.4 }}>
        <span style={{ color: '#64748b' }}>จุดติดตั้ง: </span>
        <span style={{ color: '#fff' }}>{device.solutionName || '-'}</span>
      </div>
      {/* สายทาง */}
      <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 3, lineHeight: 1.4 }}>
        <span style={{ color: '#64748b' }}>สายทาง: </span>
        <span style={{ color: '#fff' }}>{device.road || '-'}</span>
      </div>
      {/* ดูเพิ่มเติม → install point detail page */}
      {detailUrl && (
        <a
          href={detailUrl}
          style={{
            display: 'inline-block',
            marginTop: 9,
            fontSize: 11,
            fontWeight: 600,
            color: '#FCD116',
            textDecoration: 'none',
          }}
        >
          ดูเพิ่มเติม →
        </a>
      )}
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
  popup,
}) => {
  const { map, isLoaded } = useMap()
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
                  />
                )

        return (
          <MarkerLayer
            key={type}
            id={`device-${type}`}
            data={featureCollections[type]}
            cluster
            color={color}
            iconImage={`icon-${type}`}
            minZoom={minZoom}
            visible={visible}
            onClick={(_, feature) => onClick?.(feature.properties as Device)}
            popup={popupRenderer}
          />
        )
      })}
    </>
  )
}

export default DeviceClusterMarker
