"use client"
import React, { memo, useCallback, useMemo, useState } from 'react'
import { TbMapPin } from 'react-icons/tb'
import type { PopupOptions } from 'mapbox-gl'
import HTMLMarker from '../primitives/HTMLMarker'
import { useMap } from '../hooks/useMap'
import { showReactPopup } from '../primitives/popupHelper'

/** One clickable map point. When several share the same coordinate they fan
 *  out (spider) so each stays individually clickable. */
export interface OverlapMarkerItem {
  id: string
  coord: [number, number]
  title?: string
  /** React content rendered inside the popup when this marker is clicked. */
  popup: React.ReactNode
  /** Extra mapbox popup options (offset / closeButton / maxWidth …). */
  popupOptions?: PopupOptions
}

// Match the normal pin diameter so the spider center is indistinguishable in
// size from a singleton pin next to it.
const MARKER_SIZE = 32
// Leg length must clear the marker radius so fanned tips don't overlap center.
const LEG_PX = 44

/** [x, y] pixel offsets for the i-th leg of an n-leg fan (starts 12 o'clock). */
function fanOffset(i: number, n: number, r: number): [number, number] {
  const angle = (i / n) * Math.PI * 2 - Math.PI / 2
  return [Math.cos(angle) * r, Math.sin(angle) * r]
}

const YellowPin: React.FC<{ size?: number }> = ({ size = MARKER_SIZE }) => (
  <div
    className='flex items-center justify-center cursor-pointer'
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: '#FCD116',
      boxShadow: '0 4px 12px rgba(252,209,22,0.6)',
      border: '2px solid #fff',
    }}
  >
    <TbMapPin size={Math.round(size * 0.56)} color='#212121' />
  </div>
)

/** Thin SVG legs from the center badge to each fanned tip. */
const FanLegs: React.FC<{ count: number; length: number }> = memo(function FanLegs({ count, length }) {
  const size = length * 2 + MARKER_SIZE + 12
  return (
    <svg
      width={size}
      height={size}
      style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 1 }}
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

/** Renders one coordinate group: a single pin, or a count badge that fans out
 *  into individually-clickable pins on click. Popups use the shared
 *  single-popup-per-map helper so opening one closes any other. */
const Stack: React.FC<{ items: OverlapMarkerItem[] }> = ({ items }) => {
  const { map } = useMap()
  const [expanded, setExpanded] = useState(false)
  const center = items[0].coord

  const showPopup = useCallback(
    (item: OverlapMarkerItem) => {
      if (!map) return
      import('mapbox-gl').then(({ default: mb }) => {
        showReactPopup({
          map,
          mb,
          lngLat: item.coord,
          content: item.popup,
          options: { offset: 18, closeButton: true, ...(item.popupOptions ?? {}) },
        })
      })
    },
    [map],
  )

  if (items.length === 1) {
    const it = items[0]
    return (
      <HTMLMarker lngLat={center} anchor='center' title={it.title} onClick={() => showPopup(it)}>
        <YellowPin />
      </HTMLMarker>
    )
  }

  const n = items.length
  return (
    <HTMLMarker lngLat={center} anchor='center'>
      <div style={{ position: 'relative', width: MARKER_SIZE, height: MARKER_SIZE, overflow: 'visible' }}>
        {expanded && <FanLegs count={n} length={LEG_PX} />}

        {/* Center count badge — click toggles the fan. */}
        <button
          type='button'
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v) }}
          title={expanded ? `ปิด — ${n} กล้องที่จุดนี้` : `${n} กล้องที่จุดนี้ — คลิกเพื่อขยาย`}
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
          items.map((it, i) => {
            const [x, y] = fanOffset(i, n, LEG_PX)
            return (
              <button
                key={it.id}
                type='button'
                onClick={(e) => { e.stopPropagation(); showPopup(it) }}
                title={it.title}
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
                <YellowPin />
              </button>
            )
          })}
      </div>
    </HTMLMarker>
  )
}

/**
 * Overlap-aware marker layer. Groups items by exact coordinate; coords with a
 * single item render as a normal pin, coords shared by ≥2 render a count badge
 * that fans out (spider) so each item stays individually clickable. Mirrors the
 * dashboard's OverlapStackMarker UX, but generic over any popup content.
 */
const OverlapMarkers: React.FC<{ items: OverlapMarkerItem[] }> = ({ items }) => {
  const groups = useMemo(() => {
    const m = new Map<string, OverlapMarkerItem[]>()
    for (const it of items) {
      const key = `${it.coord[0].toFixed(6)},${it.coord[1].toFixed(6)}`
      const arr = m.get(key)
      if (arr) arr.push(it)
      else m.set(key, [it])
    }
    return [...m.values()]
  }, [items])

  return (
    <>
      {groups.map((g) => (
        <Stack key={`${g[0].coord[0]},${g[0].coord[1]}`} items={g} />
      ))}
    </>
  )
}

export default OverlapMarkers
