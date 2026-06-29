"use client"
import React, { useMemo } from 'react'
import BaseMap, { type MapEdgeFadeProps } from '@/components/map/BaseMap'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import FitBoundsEffect from '@/components/map/primitives/FitBoundsEffect'
import type { PanelCamera } from '@/features/admin/cctv/overall/data/cctvData'

interface Props {
  /** Cameras on the road (only those with a coordinate are plotted). */
  cameras: PanelCamera[]
  /** Map center — usually the clicked solution's first camera. */
  center: [number, number]
  /** Fired when a camera marker / popup row is chosen → opens the live stream. */
  onSelectCamera: (camera: PanelCamera) => void
  edgeFade?: MapEdgeFadeProps
}

/** Cameras sharing an exact coordinate are merged into one pin (a count badge
 *  shows how many) — without this, install points with several cameras at the
 *  same spot would stack invisibly on top of each other. */
interface CamGroup {
  key: string
  coord: [number, number]
  cameras: PanelCamera[]
}

// ── Teardrop pin ────────────────────────────────────────────────────────────────

const CameraPin: React.FC<{ online: boolean; count: number }> = ({ online, count }) => {
  const color = online ? '#ffffff' : '#E94C4C'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', position: 'relative' }}>
      <div
        style={{
          width: 32, height: 32,
          borderRadius: '50% 50% 50% 0',
          transform: 'rotate(-45deg)',
          background: color,
          boxShadow: '0 3px 12px rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 10, height: 10,
            borderRadius: '50%',
            background: online ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.6)',
            transform: 'rotate(45deg)',
          }}
        />
      </div>
      {count > 1 && (
        <div
          style={{
            position: 'absolute',
            top: -6, right: -8,
            minWidth: 18, height: 18,
            borderRadius: 9,
            background: '#FCD116',
            color: '#212121',
            fontSize: 10,
            fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
            lineHeight: 1,
          }}
        >
          {count}
        </div>
      )}
    </div>
  )
}

// ── Popup: list of cameras at one pin (click a row → open live stream) ───────────

const PopupCameraList: React.FC<{
  cameras: PanelCamera[]
  onSelect: (c: PanelCamera) => void
}> = ({ cameras, onSelect }) => (
  <div
    style={{
      background: 'rgba(5,13,26,0.96)',
      border: '1px solid #FCD116',
      borderRadius: 8,
      padding: 8,
      minWidth: 230,
      maxHeight: 260,
      overflowY: 'auto',
      fontFamily: 'ui-sans-serif,system-ui',
    }}
  >
    <div style={{ fontSize: 11, color: '#FCD116', fontWeight: 700, padding: '2px 4px 6px' }}>
      กล้อง {cameras.length} ตัว
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {cameras.map((c) => (
        <button
          key={c.id}
          type='button'
          onClick={() => onSelect(c)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            textAlign: 'left', width: '100%',
            background: '#1c1c1c', border: '1px solid #2a2a2a',
            borderRadius: 6, padding: '6px 8px', cursor: 'pointer',
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: c.online ? '#22d3ee' : '#ef4444' }} />
          <span style={{ fontSize: 11, color: '#fff', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {c.name}
          </span>
        </button>
      ))}
    </div>
  </div>
)

// ── Map ───────────────────────────────────────────────────────────────────────

const CctvLocationMap: React.FC<Props> = ({ cameras, center, onSelectCamera, edgeFade }) => {
  const groups = useMemo<CamGroup[]>(() => {
    const map = new Map<string, CamGroup>()
    for (const cam of cameras) {
      if (!cam.coord) continue
      const key = `${cam.coord[0].toFixed(6)},${cam.coord[1].toFixed(6)}`
      const existing = map.get(key)
      if (existing) existing.cameras.push(cam)
      else map.set(key, { key, coord: cam.coord, cameras: [cam] })
    }
    return Array.from(map.values())
  }, [cameras])

  // Frame every camera pin (one per distinct coordinate) in view.
  const coords = useMemo<[number, number][]>(() => groups.map((g) => g.coord), [groups])

  // Reserve room for the right camera panel (always shown) so pins aren't hidden.
  const fitPadding = useMemo(
    () =>
      typeof window !== 'undefined' && window.innerWidth >= 768
        ? { top: 70, right: 400, bottom: 70, left: 60 }
        : 48,
    []
  )

  return (
    <BaseMap
      initialCenter={center}
      initialZoom={14}
      initialPitch={45}
      initialBearing={-10}
      edgeFade={edgeFade}
    >
      <FitBoundsEffect coords={coords} padding={fitPadding} maxZoom={16} />
      {groups.map((group) => {
        const single = group.cameras.length === 1
        return (
          <HTMLMarker
            key={group.key}
            lngLat={group.coord}
            anchor='bottom'
            title={single ? group.cameras[0].name : `กล้อง ${group.cameras.length} ตัว`}
            // One camera → open its live stream directly. Several at the same
            // spot → a popup so the user can pick which one to view.
            onClick={single ? () => onSelectCamera(group.cameras[0]) : undefined}
            popup={single ? undefined : () => <PopupCameraList cameras={group.cameras} onSelect={onSelectCamera} />}
            popupOptions={{ offset: 28, closeButton: true }}
          >
            <CameraPin online={group.cameras.some((c) => c.online)} count={group.cameras.length} />
          </HTMLMarker>
        )
      })}
    </BaseMap>
  )
}

export default React.memo<Props>(CctvLocationMap)
