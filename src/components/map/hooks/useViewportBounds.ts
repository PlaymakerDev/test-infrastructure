"use client"
import { useEffect, useState } from 'react'
import { useMap } from './useMap'
import { countViewportRecalc } from '../utils/mapTrace'

/** [west, south, east, north] */
export type Bounds = [number, number, number, number]

type EasingMap = { isEasing?: () => boolean }

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

/** How many times too wide the published box may get before it is redrawn.
 *  Hysteresis: without it, zooming would republish on every frame. */
const SHRINK_FACTOR = 2

/**
 * The viewport box grown by `pad` × the viewport on each side, for culling
 * markers that are nowhere near the screen.
 *
 * The returned box only changes once the camera leaves it OR the box has
 * grown far larger than the viewport needs, so panning re-renders a handful
 * of times instead of 60×/second. At the default pad the box is 3× the
 * viewport wide, so a marker is mounted long before it can reach the screen
 * edge.
 */
export const useViewportBounds = (pad = 1): Bounds | null => {
  const { map, isLoaded } = useMap()
  const [bounds, setBounds] = useState<Bounds | null>(null)

  useEffect(() => {
    if (!map || !isLoaded) return
    // Local mirror of the state: `move` fires per frame and reading state
    // here would need the value as a dep, re-binding the listener each time.
    let current: Bounds | null = null
    let pendingShrink = false

    const evaluate = (allowShrink: boolean) => {
      const b = map.getBounds()
      if (!b) return
      const view: Bounds = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]
      const escaped = current === null || !boundsContain(current, view)
      // Containment alone is not enough. Zooming IN never leaves the box, so
      // the box kept the size it had at the zoom it was first computed at —
      // a box drawn at country zoom still contained the viewport at z14.5 and
      // the cull passed every marker in Thailand (635 of them, measured).
      // So also redraw once the box is more than SHRINK_FACTOR too wide.
      const width = view[2] - view[0]
      const oversized = current !== null && current[2] - current[0] > width * (1 + 2 * pad) * SHRINK_FACTOR
      if (!escaped && !oversized) return
      // Shrinking only ever REMOVES markers, so it can wait for the camera to
      // stop; the ones it would drop are off screen either way. Doing it live
      // re-rendered the tree 8 times inside a single fly-to (measured).
      // Escaping the box is the opposite — markers are MISSING until it is
      // redrawn — so that one is never deferred.
      if (!escaped && !allowShrink) {
        pendingShrink = true
        return
      }
      pendingShrink = false
      current = padBounds(view, pad)
      countViewportRecalc()
      setBounds(current)
    }

    const onMove = () => evaluate(!(map as EasingMap).isEasing?.())
    const onMoveEnd = () => { if (pendingShrink) evaluate(true) }

    evaluate(true)
    map.on('move', onMove)
    map.on('moveend', onMoveEnd)
    return () => {
      map.off('move', onMove)
      map.off('moveend', onMoveEnd)
    }
  }, [map, isLoaded, pad])

  return bounds
}

export default useViewportBounds
