"use client"
import BaseMap from '@/components/map/BaseMap'
import React from 'react'

const FALLBACK_CENTER: [number, number] = [98.97, 18.8]

// ─── MapSection ───────────────────────────────────────────────────────────────

interface Props {
  deptId?: string | string[] | number
}

const MapSection: React.FC<Props> = (props) => {
  const { deptId } = props

  const centroidValid = FALLBACK_CENTER
  const initialCenter = centroidValid
    ? (FALLBACK_CENTER as [number, number])
    : FALLBACK_CENTER

  return (
    <div className="relative w-full h-full">
      <BaseMap
        initialCenter={initialCenter}
        edgeFade={{ left: 10, right: 10, top: 10, bottom: 10 }}
      >
      </BaseMap>
    </div>
  )
}

export default React.memo<Props>(MapSection)
