"use client"
import React, { useMemo, useState } from 'react'
import BaseMap, { type MapEdgeFadeProps } from '@/components/map/BaseMap'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import FitBoundsEffect from '@/components/map/primitives/FitBoundsEffect'
import { OFFLINE_PIN_COLOR } from '@/components/map/markers/OverlapMarkers'
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
  /** Distinct install-point (solution_location) ids at this pin — drives the
   *  hover-group highlight. Empty on the single-install detail map. */
  installIds: string[]
}

// ── Teardrop pin ────────────────────────────────────────────────────────────────

const CameraPin: React.FC<{
  online: boolean
  count: number
  /** Hovering another install point → this pin isn't in it, fade it back. */
  dimmed?: boolean
  /** This pin shares the hovered install point → lift + yellow ring. */
  grouped?: boolean
  /** Install-point name — rendered as a chip above the actively-hovered pin. */
  label?: string
  showLabel?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}> = ({ online, count, dimmed, grouped, label, showLabel, onMouseEnter, onMouseLeave }) => {
  // `online` = "any camera at this pin is online" (group.cameras.some) — so
  // false means EVERY camera here is offline → red; any online → blue (#66AEFF).
  const color = online ? '#ffffff' : OFFLINE_PIN_COLOR
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', position: 'relative',
        transition: 'opacity 0.18s ease, transform 0.18s ease',
        // Pins from other install points fully vanish (not just faded) so the
        // hovered จุดติดตั้ง stands alone and the map doesn't look cluttered.
        opacity: dimmed ? 0 : 1,
        pointerEvents: dimmed ? 'none' : 'auto',
        transform: grouped ? 'scale(1.12)' : dimmed ? 'scale(0.85)' : 'scale(1)',
        zIndex: showLabel ? 3 : grouped ? 2 : 1,
      }}
    >
      {/* Install-point name chip — only on the pin under the cursor, so the
        * hovered group is clearly labelled without cluttering every pin. */}
      {showLabel && label && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            marginBottom: 6,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(5,13,26,0.96)',
            border: '1px solid #FCD116',
            color: '#FCD116',
            fontSize: 16,
            fontFamily: 'var(--font-ibm-plex-sans-thai)',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 6,
            // Single line, full width — never wrap or truncate the name.
            whiteSpace: 'nowrap',
            lineHeight: 1.3,
            pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}
        >
          {label}
        </div>
      )}
      <div
        style={{
          width: 32, height: 32,
          borderRadius: '50% 50% 50% 0',
          transform: 'rotate(-45deg)',
          background: color,
          // Same-install pins get a yellow ring so the hovered group reads as
          // one cluster distinct from the dimmed pins around it.
          boxShadow: grouped
            ? '0 0 0 3px rgba(252,209,22,0.95), 0 3px 12px rgba(0,0,0,0.55)'
            : '0 3px 12px rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 10, height: 10,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.25)',
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
    }}
  >
    <div style={{ fontSize: "var(--fs-12)", color: '#FCD116', fontWeight: 700, padding: '2px 4px 6px' }}>
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
          <span style={{ fontSize: "var(--fs-12)", color: '#fff', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {c.name}
          </span>
        </button>
      ))}
    </div>
  </div>
)

// ── Map ───────────────────────────────────────────────────────────────────────

const CctvLocationMap: React.FC<Props> = ({ cameras, center, onSelectCamera, edgeFade }) => {
  // Install-point currently hovered (null = none). When set, pins NOT sharing
  // it are dimmed so it's clear they belong to a different จุดติดตั้ง.
  const [hoverIds, setHoverIds] = useState<string[] | null>(null)
  // Key of the exact pin under the cursor — its name chip is the one shown.
  const [hoverKey, setHoverKey] = useState<string | null>(null)

  const groups = useMemo<CamGroup[]>(() => {
    const map = new Map<string, CamGroup>()
    for (const cam of cameras) {
      if (!cam.coord) continue
      const key = `${cam.coord[0].toFixed(6)},${cam.coord[1].toFixed(6)}`
      const existing = map.get(key)
      if (existing) {
        existing.cameras.push(cam)
        if (cam.groupId && !existing.installIds.includes(cam.groupId)) existing.installIds.push(cam.groupId)
      } else {
        map.set(key, { key, coord: cam.coord, cameras: [cam], installIds: cam.groupId ? [cam.groupId] : [] })
      }
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
        // Hover-group state: only meaningful when install ids are present
        // (route-search map). `shares` = this pin is in the hovered install
        // point; `dimmed` = a different install point is hovered.
        const hovering = hoverIds !== null && hoverIds.length > 0
        const shares = hovering && group.installIds.some((id) => hoverIds!.includes(id))
        const dimmed = hovering && group.installIds.length > 0 && !shares
        const grouped = hovering && shares
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
            <CameraPin
              online={group.cameras.some((c) => c.online)}
              count={group.cameras.length}
              dimmed={dimmed}
              grouped={grouped}
              label={group.cameras[0]?.groupName}
              showLabel={hoverKey === group.key}
              onMouseEnter={
                group.installIds.length
                  ? () => { setHoverIds(group.installIds); setHoverKey(group.key) }
                  : undefined
              }
              onMouseLeave={
                group.installIds.length
                  ? () => { setHoverIds(null); setHoverKey(null) }
                  : undefined
              }
            />
          </HTMLMarker>
        )
      })}
    </BaseMap>
  )
}

export default React.memo<Props>(CctvLocationMap)
