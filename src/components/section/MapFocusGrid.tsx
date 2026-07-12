"use client"
import React from 'react'
import useMapFocusMode from '@/utils/hooks/useMapFocusMode'

interface Props {
  children: React.ReactNode
  /** Base classes for the grid wrapper. The columns are driven by inline
   *  style, so the caller only supplies row/gap/height classes — not
   *  grid-template-columns. */
  className?: string
  /** Desktop column template when Map Focus Mode is OFF. Matches the existing
   *  LocationSection convention (`[280px_1fr_280px]`). */
  desktopCols?: string
  /** Desktop column template when Map Focus Mode is ON. Collapses side
   *  columns to `0` so the center map expands to `100%`. */
  focusedCols?: string
  /** Extra desktop breakpoint. Default matches Tailwind `lg` (1024px). */
  desktopBreakpoint?: number
}

/** Wrapper for the shared 3-column "cards | map | cards" grid used by every
 *  overall page. Animates `grid-template-columns` when Map Focus Mode is
 *  toggled, so the map cell expands smoothly to fill the row.
 *
 *  Below the desktop breakpoint the panels stack vertically (mobile grid)
 *  and this wrapper leaves the columns untouched. */
const MapFocusGrid: React.FC<Props> = ({
  children,
  className = 'grid grid-cols-1 gap-4 lg:h-[75dvh]',
  desktopCols = '280px minmax(0, 1fr) 280px',
  focusedCols = '0px minmax(0, 1fr) 0px',
  desktopBreakpoint = 1024,
}) => {
  const { isMapFocus } = useMapFocusMode()
  const [isDesktop, setIsDesktop] = React.useState(false)

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${desktopBreakpoint}px)`)
    const update = () => setIsDesktop(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [desktopBreakpoint])

  // NO transition on the columns, on purpose: animating the map cell's width
  // makes the Mapbox canvas re-buffer on every frame of the 420ms tween, and
  // each re-buffer clears the canvas before the next paint — the user sees the
  // map "blink" while it stretches. Snapping the columns instead means ONE
  // resize + ONE repaint → the map fills the row instantly with no flicker.
  // The side panels still get their own exit animation from MapOverlayPanel.
  const style: React.CSSProperties = isDesktop
    ? { gridTemplateColumns: isMapFocus ? focusedCols : desktopCols }
    : {}

  return (
    <div className={className} style={style}>
      {children}
    </div>
  )
}

export default React.memo(MapFocusGrid)
