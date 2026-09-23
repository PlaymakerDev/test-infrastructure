"use client"
import { useEffect, useState } from 'react'
import { useMap } from './useMap'

/** [west, south, east, north] */
export type Bounds = [number, number, number, number]

/** Grow a box by `pad` × its own width/height on every side. */
export const padBounds = (b: Bounds, pad: number): Bounds => {
  const w = b[2] - b[0]
  const h = b[3] - b[1]
  return [b[0] - w * pad, b[1] - h * pad, b[2] + w * pad, b[3] + h * pad]
}

/** Is `inner` fully inside `outer`? */
export const boundsContain = (outer: Bounds, inner: Bounds): boolean =>
  inner[0] >= outer[0] && inner[1] >= outer[1] && inner[2] <= outer[2] && inner[3] <= outer[3]

export const inBounds = (b: Bounds, lng: number, lat: number): boolean =>
  lng >= b[0] && lng <= b[2] && lat >= b[1] && lat <= b[3]

/**
 * The viewport box grown by `pad` × the viewport on each side, for culling
 * markers that are nowhere near the screen.
 *
 * The returned box only changes once the camera leaves it, so panning
 * re-renders a handful of times instead of 60×/second. At the default pad the
 * box is 3× the viewport wide, so a marker is mounted long before it can
 * reach the screen edge.
 */
export const useViewportBounds = (pad = 1): Bounds | null => {
  const { map, isLoaded } = useMap()
  const [bounds, setBounds] = useState<Bounds | null>(null)

  useEffect(() => {
    if (!map || !isLoaded) return
    // Local mirror of the state: `move` fires per frame and reading state
    // here would need the value as a dep, re-binding the listener each time.
    let current: Bounds | null = null

    const update = () => {
      const b = map.getBounds()
      if (!b) return
      const view: Bounds = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]
      // Compare the VIEWPORT against the padded box we last published — the
      // margin is what makes this quiet, so don't recompute while inside it.
      if (current && boundsContain(current, view)) return
      current = padBounds(view, pad)
      setBounds(current)
    }

    update()
    map.on('move', update)
    return () => {
      map.off('move', update)
    }
  }, [map, isLoaded, pad])

  return bounds
}

export default useViewportBounds
