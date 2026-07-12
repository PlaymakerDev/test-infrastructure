"use client"
import React from 'react'
import { motion, type Transition } from 'motion/react'
import useMapFocusMode from '@/utils/hooks/useMapFocusMode'

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
  const hidden = !disabled && isMapFocus
  const target = hidden ? hiddenTransform(position) : { x: 0, y: 0 }

  return (
    <motion.div
      className={className}
      style={style}
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
