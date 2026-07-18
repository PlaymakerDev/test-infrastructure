"use client"
import React from 'react'
import { motion, type Transition } from 'motion/react'
import useMapFocusMode, { useRegisterMapFocusConsumer } from '@/utils/hooks/useMapFocusMode'

export type MapOverlayPosition = 'left' | 'right' | 'top' | 'bottom'

interface Props {
  /** Which screen edge the panel slides toward when Map Focus Mode is on. */
  position: MapOverlayPosition
  className?: string
  style?: React.CSSProperties
  /** Force the panel visible regardless of Map Focus Mode. Useful for parts
   *  of a layout that never overlay the map (e.g. filter bars we still want
   *  to hide with a different animation would use their own component). */
  disabled?: boolean
  children: React.ReactNode
}

const DURATION = 0.42
const EASE: Transition['ease'] = [0.4, 0, 0.2, 1]

const hiddenTransform = (position: MapOverlayPosition) => {
  switch (position) {
    case 'left':
      return { x: '-110%', y: 0 }
    case 'right':
      return { x: '110%', y: 0 }
    case 'top':
      return { x: 0, y: '-110%' }
    case 'bottom':
      return { x: 0, y: '110%' }
  }
}

/** Wraps a card/panel/chart that lives OVER, BESIDE, ABOVE, or BELOW a map.
 *  When Map Focus Mode is enabled it slides toward the nearest edge, becomes
 *  non-interactive (`pointer-events:none`), and reports `aria-hidden`. */
const MapOverlayPanel: React.FC<Props> = ({
  position,
  className,
  style,
  disabled,
  children,
}) => {
  const { isMapFocus } = useMapFocusMode()
  // While mounted (and not `disabled`) the navbar's focus toggle is usable.
  useRegisterMapFocusConsumer(!disabled)
  const hidden = !disabled && isMapFocus

  // Below lg (1024px — same breakpoint MapFocusGrid uses) the panels sit in
  // NORMAL FLOW at full width (stacked under the map), so the slide-away
  // transform can't work there: x:±110% pushes the invisible panel past the
  // viewport edge → the page gains a horizontal scroll region (mobile focus
  // mode "shifted right and stuck", 2026-07-17) while its row still holds
  // the old height. On small screens a hidden panel therefore collapses
  // entirely (display:none) instead of sliding.
  const [isDesktop, setIsDesktop] = React.useState(true)
  React.useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)')
    const update = () => setIsDesktop(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [])
  const collapsed = hidden && !isDesktop

  const target = hidden ? hiddenTransform(position) : { x: 0, y: 0 }

  return (
    <motion.div
      className={className}
      style={{ ...style, ...(collapsed ? { display: 'none' } : null) }}
      initial={false}
      animate={{
        ...target,
        opacity: hidden ? 0 : 1,
        pointerEvents: hidden ? 'none' : 'auto',
      }}
      transition={{ duration: DURATION, ease: EASE }}
      aria-hidden={hidden || undefined}
    >
      {children}
    </motion.div>
  )
}

export default React.memo(MapOverlayPanel)
