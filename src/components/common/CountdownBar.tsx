'use client'
import React, { useEffect, useRef } from 'react'

interface Props {
  durationMs: number
  className?: string
}

/** Yellow bar that drains over `durationMs` — the cue that a notice closes by
 *  itself. Remount it (change its `key`) to restart the countdown. */
const CountdownBar: React.FC<Props> = ({ durationMs, className = 'mt-6' }) => {
  const barRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const animation = barRef.current?.animate(
      [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }],
      { duration: durationMs, easing: 'linear', fill: 'forwards' },
    )
    return () => animation?.cancel()
  }, [durationMs])
  return (
    <div className={`${className} h-[3px] w-full overflow-hidden rounded-full bg-(--mid-gray)`} aria-hidden>
      <div ref={barRef} className='h-full w-full origin-left bg-(--yellow)' />
    </div>
  )
}

export default React.memo<Props>(CountdownBar)
