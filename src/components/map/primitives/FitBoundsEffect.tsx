"use client"
import { useEffect } from 'react'
import { useMap } from '../hooks/useMap'

type Padding = number | { top: number; bottom: number; left: number; right: number }

interface Props {
  /** [lng, lat][] — every point that must stay visible. */
  coords: [number, number][]
  /**
   * Space (px) kept between the points and the map edges. Use a per-side object
   * to reserve room for overlay panels so markers don't hide behind them.
   * Padding is clamped to the canvas so it never breaks on small screens.
   */
  padding?: Padding
  /** Cap zoom-in so a single (or tightly-clustered) point doesn't go to street level. */
  maxZoom?: number
  duration?: number
}

/**
 * Camera effect that frames ALL `coords` in view (Mapbox `fitBounds`), instead
 * of a hard-coded center/zoom. Re-runs whenever the set of points changes.
 * A single point falls back to `flyTo` at `maxZoom`.
 */
const FitBoundsEffect: React.FC<Props> = ({ coords, padding = 48, maxZoom = 14, duration = 900 }) => {
  const { map, isLoaded } = useMap()
  // Stable key from the coord set — identical points (new array ref each render)
  // must NOT re-trigger the camera animation.
  const key = coords.map((c) => `${c[0].toFixed(6)},${c[1].toFixed(6)}`).join('|')

  useEffect(() => {
    if (!map || !isLoaded || coords.length === 0) return

    if (coords.length === 1) {
      map.flyTo({ center: coords[0], zoom: maxZoom, duration })
      return
    }

    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity
    for (const [lng, lat] of coords) {
      minLng = Math.min(minLng, lng)
      maxLng = Math.max(maxLng, lng)
      minLat = Math.min(minLat, lat)
      maxLat = Math.max(maxLat, lat)
    }

    // Clamp padding to the canvas — fitBounds misbehaves when opposite paddings
    // exceed the map size (e.g. a wide right-panel reserve on a phone).
    const canvas = map.getCanvas()
    const w = canvas.clientWidth || canvas.width || 0
    const h = canvas.clientHeight || canvas.height || 0
    const clampPair = (a: number, b: number, total: number): [number, number] => {
      const room = Math.max(0, total - 48) // leave ≥48px for the bounds itself
      if (a + b <= room) return [a, b]
      const scale = room / (a + b || 1)
      return [Math.floor(a * scale), Math.floor(b * scale)]
    }
    const p = typeof padding === 'number'
      ? { top: padding, bottom: padding, left: padding, right: padding }
      : padding
    const [left, right] = clampPair(p.left, p.right, w)
    const [top, bottom] = clampPair(p.top, p.bottom, h)

    map.fitBounds(
      [[minLng, minLat], [maxLng, maxLat]],
      { padding: { top, bottom, left, right }, maxZoom, duration },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, isLoaded, key])

  return null
}

export default FitBoundsEffect
