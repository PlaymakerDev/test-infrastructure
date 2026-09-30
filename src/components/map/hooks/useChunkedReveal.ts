"use client"
import { useEffect, useMemo, useState } from 'react'

/**
 * Hand a list back a chunk at a time, one chunk per frame.
 *
 * A tier swap mounts every bubble in the same React commit: 68 portals, 68
 * `new mapboxgl.Marker().addTo()`, 68 DOM inserts. Measured at 272ms in one
 * frame before the swap was moved off the fly-to — moving it only hid that
 * cost behind a stationary camera, it did not remove it. Chunking splits the
 * commit so no single frame carries more than `size` of them.
 *
 * `items` must be a stable reference (memoise it), otherwise every render
 * restarts the reveal.
 */
export function useChunkedReveal<T>(items: T[], size = 12): T[] {
  // Reset during render when the list changes — an effect would paint one
  // frame with the previous list's count first.
  const [seen, setSeen] = useState(items)
  const [count, setCount] = useState(() => Math.min(items.length, size))
  if (seen !== items) {
    setSeen(items)
    setCount(Math.min(items.length, size))
  }

  useEffect(() => {
    if (count >= items.length) return
    const raf = requestAnimationFrame(() =>
      setCount((c) => Math.min(items.length, c + size)),
    )
    return () => cancelAnimationFrame(raf)
  }, [items, count, size])

  return useMemo(
    () => (count >= items.length ? items : items.slice(0, count)),
    [items, count],
  )
}

export default useChunkedReveal
