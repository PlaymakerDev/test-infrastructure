"use client"
import React, { memo, useEffect, useMemo, useState, createElement, useCallback } from 'react'
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
  type SystemType,
} from '@/features/admin/dashboard/data/systems'
import type { Device } from '@/features/admin/dashboard/data/mockDevices'
import { useRouter } from 'next/navigation'
import HTMLMarker from '../primitives/HTMLMarker'
import { useMap } from '../hooks/useMap'
import { showReactPopup } from '../primitives/popupHelper'
import { DefaultDevicePopup } from './DeviceClusterMarker'

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

export interface OverlapStackMarkerProps {
  /** Devices that share the EXACT same backend coordinate. Must be length ≥ 2. */
  group: Device[]
  /** Anchor point of the cluster — typically the first device's coord. */
  center: [number, number]
  /** Hide everything when a SystemType filter excludes ALL devices in the group. */
  visibleTypes?: Set<SystemType>
  /** Only render at/above this zoom (the country-level STCH summary owns the
   *  lower zooms). Mirrors `DeviceClusterMarker.minZoom`. */
  minZoom?: number
  /** Fired on ANY interaction with this stack (expand, single pin, or a fanned
   *  device). The dashboard uses it to reveal its map-only landing overlays. */
  onMarkerClick?: () => void
}

// Match the normal MarkerLayer pin diameter (circleRadius 16 → 32 px). Keeps
// the spider center indistinguishable in size from singleton pins next to it.
const MARKER_SIZE = 32
// Leg length must exceed the marker radius (so the tip clears the center) +
// half a tip width. 44 px works well for marker sizes up to ~36.
const LEG_PX = 44

/**
 * Marker shown at a coordinate where ≥ 2 devices live on top of each other.
 *
 * - Collapsed: one circular badge with the device count. Clicking it expands.
 * - Expanded: each device fans out into a small ring around the original
 *   pixel, with thin SVG legs connecting them to the center — like a stylised
 *   tree branch. Clicking the center again collapses back.
 *
 * Popups use the shared single-popup-per-map helper, so opening a device's
 * popup auto-closes any other popup on the map (singleton or other tip) —
 * same behavior as a normal singleton marker.
 */
const OverlapStackMarker: React.FC<OverlapStackMarkerProps> = ({
  group,
  center,
  visibleTypes,
  minZoom = 6.5,
  onMarkerClick,
}) => {
  const { map, isLoaded } = useMap()
  // Captured here (inside the App Router provider) so the detached-root popup
  // can navigate client-side. Without this the popup's "ดูเพิ่มเติม" button is
  // a silent no-op — `PopupDetailLink` navigates ONLY via `onNavigate`.
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [zoomVisible, setZoomVisible] = useState(false)

  // Track zoom — hide while the country-level STCH summary owns the view.
  useEffect(() => {
    if (!map || !isLoaded) return
    const update = () => setZoomVisible(map.getZoom() >= minZoom)
    update()
    map.on('zoom', update)
    return () => { map.off('zoom', update) }
  }, [map, isLoaded, minZoom])

  // Open a device popup using the shared single-popup helper. Returns void —
  // call sites just dispatch and let the helper handle close/cleanup.
  const showPopup = useCallback((device: Device) => {
    if (!map) return
    import('mapbox-gl').then(({ default: mb }) => {
      showReactPopup({
        map,
        mb,
        lngLat: device.coord,
        content: (
          <DefaultDevicePopup
            device={device}
            color={SYSTEMS[device.type].color}
            onNavigate={(url) => router.push(url)}
          />
        ),
      })
    })
  }, [map, router])

  // A device is "in scope" when its type is in the filter (or no filter set).
  const visible = useMemo(
    () => group.filter((d) => !visibleTypes || visibleTypes.has(d.type)),
    [group, visibleTypes],
  )

  if (!zoomVisible || visible.length === 0) return null
  // After filtering, a stack might collapse to a single device — render it as
  // a normal pin (no fan-out / no count badge), still with shared popup.
  if (visible.length === 1) {
    const d = visible[0]
    return (
      <HTMLMarker
        lngLat={center}
        title={d.id}
        onClick={() => { onMarkerClick?.(); showPopup(d) }}
      >
        <DeviceIcon device={d} size={MARKER_SIZE} />
      </HTMLMarker>
    )
  }

  const n = visible.length
  return (
    <HTMLMarker lngLat={center} anchor='center'>
      <div
        style={{
          position: 'relative',
          width: MARKER_SIZE,
          height: MARKER_SIZE,
          overflow: 'visible',
        }}
      >
        {expanded && <FanLegs count={n} length={LEG_PX} />}

        {/* Center badge — click target. Same diameter as a singleton pin. */}
        <button
          type='button'
          onClick={(e) => {
            e.stopPropagation()
            onMarkerClick?.()
            setExpanded((v) => !v)
          }}
          title={
            expanded
              ? `ปิด — ${n} อุปกรณ์ที่จุดนี้`
              : `${n} อุปกรณ์ที่จุดนี้ — คลิกเพื่อขยาย`
          }
          style={{
            width: MARKER_SIZE,
            height: MARKER_SIZE,
            borderRadius: '50%',
            background: '#FCD116',
            color: '#050d1a',
            fontSize: 14,
            fontWeight: 700,
            border: '2px solid #fff',
            boxShadow: '0 0 8px rgba(252,209,22,0.7), 0 2px 6px rgba(0,0,0,0.45)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            position: 'relative',
            zIndex: 2,
          }}
        >
          {n}
        </button>

        {expanded &&
          visible.map((d, i) => {
            const [x, y] = fanOffset(i, n, LEG_PX)
            return (
              <button
                key={d.id}
                type='button'
                onClick={(e) => {
                  e.stopPropagation()
                  onMarkerClick?.()
                  showPopup(d)
                }}
                title={`${SYSTEMS[d.type].label} · ${d.id}`}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                  padding: 0,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  zIndex: 3,
                }}
              >
                <DeviceIcon device={d} size={MARKER_SIZE} />
              </button>
            )
          })}
      </div>
    </HTMLMarker>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns [x, y] pixel offsets for the i-th leg of an n-leg fan. The fan
 *  starts at 12 o'clock and spreads clockwise, evenly. */
function fanOffset(i: number, n: number, r: number): [number, number] {
  const angle = (i / n) * Math.PI * 2 - Math.PI / 2 // 12 o'clock = -π/2
  return [Math.cos(angle) * r, Math.sin(angle) * r]
}

/** Background SVG drawing thin lines from the center to each fan tip. */
const FanLegs: React.FC<{ count: number; length: number }> = memo(function FanLegs({ count, length }) {
  const size = length * 2 + MARKER_SIZE + 12
  return (
    <svg
      width={size}
      height={size}
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      {Array.from({ length: count }).map((_, i) => {
        const [x, y] = fanOffset(i, count, length)
        return (
          <line
            key={i}
            x1={size / 2}
            y1={size / 2}
            x2={size / 2 + x}
            y2={size / 2 + y}
            stroke='rgba(255,255,255,0.55)'
            strokeWidth={1.5}
            strokeLinecap='round'
          />
        )
      })}
    </svg>
  )
})

const DeviceIcon: React.FC<{ device: Device; size: number }> = memo(function DeviceIcon({ device, size }) {
  const Icon = SYSTEM_ICONS[device.type]
  // Offline → mute to slate; unknown / online keep the brand colour so nothing
  // shifts until BE ships the joined `is_online` field. Matches the Mapbox
  // symbol-layer expression used by singletons in DeviceClusterMarker.
  const color = device.isOnline === false ? '#94a3b8' : SYSTEMS[device.type].color
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `2px solid ${device.isOnline === false ? '#ef4444' : '#fff'}`,
        boxShadow: '0 2px 6px rgba(0,0,0,0.45)',
      }}
    >
      {createElement(Icon, { size: Math.round(size * 0.55) })}
    </div>
  )
})

export default OverlapStackMarker
