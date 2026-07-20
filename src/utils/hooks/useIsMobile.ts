"use client"
import { useCallback, useSyncExternalStore } from 'react'

/** Returns true when viewport width is at or below `breakpoint` (default 640px). */
const useIsMobile = (breakpoint = 640) => {
  const query = `(max-width: ${breakpoint}px)`

  const subscribe = useCallback((onStoreChange: () => void) => {
    const mql = window.matchMedia(query)
    const handler = () => onStoreChange()
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query],
  )

  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

export default useIsMobile
