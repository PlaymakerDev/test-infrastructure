"use client"
import React, { useLayoutEffect, useRef, useState } from 'react'

interface Props {
  children: React.ReactNode
  className?: string
  maxFontSize?: number
  minFontSize?: number
}

/** Shrinks its own font-size step-by-step until the text fits the width its
 *  parent gives it (parent must actually constrain that width — e.g. `flex-1
 *  min-w-0` — otherwise there's nothing to shrink against). Re-measures via
 *  ResizeObserver so it re-fits if the parent is resized or the text changes. */
const AutoFitText: React.FC<Props> = (props) => {
  const { children, className, maxFontSize = 12, minFontSize = 9 } = props
  const ref = useRef<HTMLSpanElement>(null)
  const [fontSize, setFontSize] = useState(maxFontSize)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const fit = () => {
      let size = maxFontSize
      el.style.fontSize = `${size}px`
      while (el.scrollWidth > el.clientWidth && size > minFontSize) {
        size -= 1
        el.style.fontSize = `${size}px`
      }
      setFontSize(size)
    }

    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(el)
    return () => observer.disconnect()
  }, [children, maxFontSize, minFontSize])

  return (
    <span
      ref={ref}
      className={className}
      style={{ display: 'block', fontSize, whiteSpace: 'nowrap', maxWidth: '100%' }}
    >
      {children}
    </span>
  )
}

export default React.memo(AutoFitText)
