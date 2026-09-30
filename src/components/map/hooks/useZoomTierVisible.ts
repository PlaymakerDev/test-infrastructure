"use client"
import { useEffect, useRef, useState } from 'react'
import { useMap } from './useMap'

type EasingMap = { isEasing?: () => boolean }

/**
 * Whether a zoom-gated marker tier should be mounted right now.
 *
 * Switching a tier on or off creates or destroys every DOM marker in it, and a
 * `flyTo` from a pin click crosses every threshold on the way — so the swap
 * used to land mid-flight, dozens of mounts inside a single frame. Measured on
 * the dashboard: one 272ms frame while 68 ขทช. bubbles mounted, against a
 * 16.5ms median for the rest of the animation.
 *
 * So while the camera is easing (flyTo/easeTo) the decision is held and
 * applied when it stops. A wheel or pinch zoom is not easing, so those still
 * swap as the user zooms.
 */
export function useZoomTierVisible(
  test: (zoom: number) => boolean,
  initial = false,
  /** Re-evaluate when the THRESHOLD moves. `test` lives in a ref (a new
   *  closure every render must not re-bind the listeners), so a changed
   *  cutoff is invisible to the effect without this. */
  dep?: unknown,
): boolean {
  const { map, isLoaded } = useMap()
  const [visible, setVisible] = useState(initial)
  const testRef = useRef(test)
  useEffect(() => { testRef.current = test })

  useEffect(() => {
    if (!map || !isLoaded) return
    let pending: boolean | null = null

    const apply = (next: boolean) => setVisible((prev) => (prev === next ? prev : next))

    const onZoom = () => {
      const next = testRef.current(map.getZoom())
      if ((map as EasingMap).isEasing?.()) {
        pending = next
        return
      }
      apply(next)
    }
    const onMoveEnd = () => {
      const next = pending ?? testRef.current(map.getZoom())
      pending = null
      apply(next)
    }

    onZoom()
    map.on('zoom', onZoom)
    map.on('moveend', onMoveEnd)
    return () => {
      map.off('zoom', onZoom)
      map.off('moveend', onMoveEnd)
    }
  }, [map, isLoaded, dep])

  return visible
}

export default useZoomTierVisible
