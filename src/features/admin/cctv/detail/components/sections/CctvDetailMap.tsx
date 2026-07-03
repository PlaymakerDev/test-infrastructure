"use client"
import React, { useEffect, useMemo, useRef } from 'react'
import BaseMap, { type MapEdgeFadeProps } from '@/components/map/BaseMap'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import FitBoundsEffect from '@/components/map/primitives/FitBoundsEffect'
import { useMap } from '@/components/map/hooks/useMap'
import type { PanelCamera } from '@/features/admin/cctv/overall/data/cctvData'

/** Cameras sharing an exact coordinate are merged into one pin (a count badge
 *  shows how many) — without this, install points with several cameras at the
 *  same spot would stack invisibly on top of each other. */
export interface CamGroup {
  key: string
  coord: [number, number]
  cameras: PanelCamera[]
}

interface Props {
  /** Cameras on the road (only those with a coordinate are plotted). */
  cameras: PanelCamera[]
  /** Map center — usually the clicked solution's first camera. */
  center: [number, number]
  /** Key of the currently-selected pin (for highlight + zoom). */
  selectedKey: string | null
  /** Click a pin → select it (zoom in + show its info panel); click the same
   *  pin again → deselect (`null`, zoom back out to the overview). */
  onToggleGroup: (group: CamGroup | null) => void
  edgeFade?: MapEdgeFadeProps
}

// ── Teardrop pin ────────────────────────────────────────────────────────────────

const CameraPin: React.FC<{ online: boolean; count: number; selected: boolean }> = ({ online, count, selected }) => {
  const color = online ? '#ffffff' : '#E94C4C'
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', position: 'relative',
        transform: selected ? 'scale(1.25)' : 'scale(1)',
        transition: 'transform 0.15s ease',
      }}
    >
      <div
        style={{
          width: 32, height: 32,
          borderRadius: '50% 50% 50% 0',
          transform: 'rotate(-45deg)',
          background: color,
          boxShadow: selected
            ? '0 0 0 3px #FCD116, 0 3px 14px rgba(252,209,22,0.6)'
            : '0 3px 12px rgba(0,0,0,0.55)',
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

// ── Selection camera effect — flyTo on select, fit back to overview on close ──

function boundsOf(coords: [number, number][]): [[number, number], [number, number]] {
  let minLng = coords[0][0], maxLng = coords[0][0], minLat = coords[0][1], maxLat = coords[0][1]
  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng
    if (lng > maxLng) maxLng = lng
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
  }
  return [[minLng, minLat], [maxLng, maxLat]]
}

const SelectionEffect: React.FC<{
  groups: CamGroup[]
  selectedKey: string | null
  coords: [number, number][]
  fitPadding: number | { top: number; right: number; bottom: number; left: number }
}> = ({ groups, selectedKey, coords, fitPadding }) => {
  const { map, isLoaded } = useMap()
  const wasSelected = useRef(false)

  useEffect(() => {
    if (!map || !isLoaded) return
    if (selectedKey) {
      wasSelected.current = true
      const g = groups.find((x) => x.key === selectedKey)
      if (g) map.flyTo({ center: g.coord, zoom: 17.5, pitch: 55, duration: 1000 })
    } else if (wasSelected.current) {
      // Deselected — zoom back out to frame all pins (the overview).
      wasSelected.current = false
      if (coords.length) {
        map.fitBounds(boundsOf(coords), { padding: fitPadding, maxZoom: 16, duration: 1000 })
      }
    }
  }, [map, isLoaded, selectedKey, groups, coords, fitPadding])

  return null
}

// ── Map ───────────────────────────────────────────────────────────────────────

const CctvDetailMap: React.FC<Props> = ({ cameras, center, selectedKey, onToggleGroup, edgeFade }) => {
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
      <SelectionEffect groups={groups} selectedKey={selectedKey} coords={coords} fitPadding={fitPadding} />
      {groups.map((group) => {
        const selected = group.key === selectedKey
        return (
          <HTMLMarker
            key={group.key}
            lngLat={group.coord}
            anchor='bottom'
            title={group.cameras.length === 1 ? group.cameras[0].name : `กล้อง ${group.cameras.length} ตัว`}
            // Click selects this pin (zoom in + info panel); clicking the
            // selected pin again deselects (zoom back out). No popup.
            onClick={() => onToggleGroup(selected ? null : group)}
          >
            <CameraPin online={group.cameras.some((c) => c.online)} count={group.cameras.length} selected={selected} />
          </HTMLMarker>
        )
      })}
    </BaseMap>
  )
}

export default React.memo<Props>(CctvDetailMap)
