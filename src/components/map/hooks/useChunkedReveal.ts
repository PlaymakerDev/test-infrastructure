"use client"
import { useEffect, useState } from 'react'

/**
 * Walk a rendered list towards a target list, a bounded number of changes
 * per frame.
 *
 * Both directions cost a frame. Mounting a tier is 68 portals, 68
 * `new mapboxgl.Marker().addTo()`, 68 DOM inserts — 272ms in one frame when
 * measured. Dropping one is the mirror image: 89 React unmounts plus 89
 * `marker.remove()` came to 69ms. So each frame adds at most `size` markers
 * and removes at most `size * 2` (a teardown is cheaper than a build).
 *
 * Membership is by REFERENCE, so a caller must keep its items stable —
 * memoise the array the entries come from, not just the filtered result.
 * Given that, a list that is rebuilt but unchanged settles in one pass with
 * nothing mounted or unmounted, which is what makes a viewport recalc or a
 * poll free.
 */
export function useChunkedReveal<T>(items: T[], size = 12): T[] {
  const [rendered, setRendered] = useState<T[]>(() => items.slice(0, size))

  useEffect(() => {
    const wanted = new Set(items)
    const present = new Set(rendered)
    const stale = rendered.filter((x) => !wanted.has(x))
    const missing = items.filter((x) => !present.has(x))
    if (stale.length === 0 && missing.length === 0) return

    // A frame, not a timeout: the work lands with the next paint, so the
    // browser gets to draw what the previous chunk already produced.
    const raf = requestAnimationFrame(() => {
      const drop = new Set(stale.slice(0, size * 2))
      setRendered(rendered.filter((x) => !drop.has(x)).concat(missing.slice(0, size)))
    })
    return () => cancelAnimationFrame(raf)
  }, [items, rendered, size])

  return rendered
}

export default useChunkedReveal
