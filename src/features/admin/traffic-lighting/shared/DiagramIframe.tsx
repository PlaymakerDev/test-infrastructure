"use client"
import React, { useEffect, useRef, useState } from 'react'

interface Props {
  imei: string
  /** Minimum container height in px. */
  minHeight?: number
  className?: string
}

/** Circuit diagram iframe — passes the container's live pixel size to the
 *  viewer so the SVG scales to fill instead of hugging the top-left. */
const DiagramIframe: React.FC<Props> = ({ imei, minHeight = 260, className = '' }) => {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect
      const w = Math.max(1, Math.round(cr.width))
      const h = Math.max(1, Math.round(cr.height))
      setSize({ w, h })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const url = size && imei
    ? `${process.env.NEXT_PUBLIC_HOST_BACKEND}/lighting/diagram/view/${imei}?w=${size.w}&h=${size.h}`
    : ''

  return (
    <div
      ref={wrapRef}
      className={`w-full h-full flex items-center justify-center ${className}`}
      style={{ minHeight }}
    >
      {url ? (
        <iframe
          key={url}
          src={url}
          title='วงจรไฟฟ้า'
          className='block w-full h-full border-0'
          style={{ minHeight }}
          loading='lazy'
        />
      ) : null}
    </div>
  )
}

export default React.memo(DiagramIframe)
