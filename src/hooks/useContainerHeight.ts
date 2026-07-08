import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Tracks the clientHeight of a ref'd element in real time via ResizeObserver.
 *
 * Returns a tuple `[attach, height, ref]` where:
 *   - `attach` is a ref-callback to spread onto the target element
 *   - `height` is the current measured height (0 before mount / SSR)
 *   - `ref`    is the underlying MutableRefObject for imperative access
 *
 * Falls back to 0 when the element is unmounted or `window` is unavailable.
 */
export function useContainerHeight<T extends HTMLElement = HTMLDivElement>() {
  const [height, setHeight] = useState(0)
  const ref = useRef<T | null>(null)
  const attach = useCallback((el: T | null) => {
    ref.current = el
    if (el) setHeight(el.clientHeight)
  }, [])
  useEffect(() => {
    if (!ref.current) return
    if (typeof window === 'undefined' || typeof ResizeObserver === 'undefined') return
    const obs = new ResizeObserver((entries) => {
      for (const e of entries) setHeight(e.contentRect.height)
    })
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [ref.current])
  return [attach, height, ref] as const
}
