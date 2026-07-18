"use client"
import React, { useEffect, useRef, useState } from 'react'
import { TbPlugConnectedX } from 'react-icons/tb'
import { useLightingDiagram } from '@/hooks/queries/lighting'

interface Props {
  imei: string
  /** Minimum container height in px. */
  minHeight?: number
  className?: string
}

/** Circuit diagram iframe — passes the container's live pixel size to the
 *  viewer so the SVG scales to fill instead of hugging the top-left.
 *  Some devices have `connections` saved with no matching `components`
 *  (a backend data gap — see LightingDiagram) which the viewer renders as a
 *  silent blank canvas, so this checks that first and shows a placeholder
 *  instead of an empty-looking iframe. */
const DiagramIframe: React.FC<Props> = ({ imei, minHeight = 260, className = '' }) => {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  const { data: diagram, isLoading, isError } = useLightingDiagram(imei)

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

  // Fail open on error — if the check itself fails, still try the iframe
  // rather than hiding a diagram that might actually render fine.
  const isEmpty = !isLoading && !isError && (diagram?.components.length ?? 0) === 0

  const url = size && imei && !isEmpty
    ? `${process.env.NEXT_PUBLIC_HOST_BACKEND}/lighting/diagram/view/${imei}?w=${size.w}&h=${size.h}`
    : ''

  return (
    // No `h-full` here — a flex item's `height:100%` needs a provably
    // definite ancestor height to resolve and silently collapses to
    // `minHeight` when one link in the chain is sized via flex/min-height
    // instead of an explicit `height`. Relying on the parent's
    // `items-stretch` (which stretches `height:auto` items directly through
    // the flex algorithm, no percentage resolution involved) is what
    // actually fills the available height reliably.
    <div
      ref={wrapRef}
      className={`w-full flex items-stretch justify-center ${className}`}
      style={{ minHeight }}
    >
      {isEmpty ? (
        <div className='flex flex-col items-center justify-center gap-2 text-center'>
          <TbPlugConnectedX className='fs-28' style={{ color: '#979797' }} />
          <p className='fs-12 m-0' style={{ color: '#979797' }}>ไม่มีข้อมูลวงจรไฟฟ้า</p>
        </div>
      ) : url ? (
        <iframe
          key={url}
          src={url}
          title='วงจรไฟฟ้า'
          className='block w-full border-0'
          style={{ minHeight }}
          loading='lazy'
        />
      ) : null}
    </div>
  )
}

export default React.memo(DiagramIframe)
