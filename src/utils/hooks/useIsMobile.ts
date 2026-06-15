"use client"
import { useEffect, useState } from 'react'

/** Returns true when viewport width is at or below `breakpoint` (default 640px). */
const useIsMobile = (breakpoint = 640) => {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`)
    setIsMobile(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [breakpoint])
  return isMobile
}

export default useIsMobile
