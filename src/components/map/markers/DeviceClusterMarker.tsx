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

/** Default popup body — same look as before. Exported so other pages can reuse. */
export function DefaultDevicePopup({ device, color }: { device: Device; color: string }) {
  const statusColor =
    device.status === 'online'
      ? '#34d399'
      : device.status === 'fault'
        ? '#fbbf24'
        : '#ef4444'
  return (
    <div
      style={{
        padding: '10px 12px',
        minWidth: 200,
        fontFamily: 'ui-sans-serif,system-ui',
        background: 'rgba(5,13,26,0.96)',
        border: `1px solid ${color}`,
        borderRadius: 10,
      }}
    >
      <div style={{ fontSize: 10, color, fontWeight: 700, letterSpacing: 0.5 }}>{device.type}</div>
      <div style={{ fontSize: 13, color: '#fff', fontWeight: 600, marginTop: 3 }}>{device.id}</div>
      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
        {device.road} · {device.km}
      </div>
      <div style={{ fontSize: 11, color: '#94a3b8' }}>{device.landmark}</div>
      <div style={{ fontSize: 10, color: statusColor, marginTop: 6, fontWeight: 600 }}>
        ● {device.status.toUpperCase()}
      </div>
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
            id: d.id, type: d.type, road: d.road, km: d.km,
            landmark: d.landmark, status: d.status, unitId: d.unitId,
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
