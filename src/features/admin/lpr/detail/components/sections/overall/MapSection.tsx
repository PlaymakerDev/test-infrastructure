"use client"
import React, { useMemo } from 'react'
import BaseMap from '@/components/map/BaseMap'
import OverlapMarkers, { type OverlapMarkerItem } from '@/components/map/markers/OverlapMarkers'
import type { LPRInstallPoint } from '@/types/lpr/lpr-api'
import { useLPRDetailContext } from '../../../context'

/** Popup card — install-point info shown when the pin is clicked. Mirrors the
 *  crosswalk / incident-detection detail popup styling (dark panel, blue
 *  border, blue title). LPR has no per-camera HLS URL on this payload, so the
 *  popup is info-only. */
const PointPopup: React.FC<{ point: LPRInstallPoint }> = ({ point }) => (
  <div
    style={{
      width: 260,
      background: 'rgba(14,14,14,0.97)',
      border: '1px solid #2f6db0',
      borderRadius: 12,
      padding: 10,
    }}
  >
    {/* All popup text on the project fs-12 scale, per design 2026-07-20. */}
    <p className='fs-12' style={{ color: '#66AEFF', fontWeight: 600, lineHeight: 1.35, margin: 0 }}>
      {point.solution_name}
    </p>
    {point.road_code && (
      <p className='fs-12' style={{ color: '#94a3b8', margin: '2px 0 0' }}>{point.road_code}</p>
    )}
    <div className='fs-12' style={{ display: 'flex', gap: 10, marginTop: 6, fontWeight: 600 }}>
      <span style={{ color: '#ffffff' }}>
        กล้อง {point.camera_count.toLocaleString('th-TH')}
      </span>
      <span style={{ color: '#FCD116' }}>
        วันนี้ {point.events_today.toLocaleString('th-TH')}
      </span>
      <span style={{ color: '#66AEFF' }}>
        ชม.ล่าสุด {point.events_hour.toLocaleString('th-TH')}
      </span>
    </div>
  </div>
)

/** Map centred on the install-point. One WHITE teardrop pin (shared
 *  `OverlapMarkers`, same as the crosswalk/incident detail maps) at the
 *  averaged coord of the solution's cameras — click opens an info popup. */
const MapSection: React.FC = () => {
  const { point } = useLPRDetailContext()

  const hasCoord = !!point && !!point.lat && !!point.lng
  const center: [number, number] = hasCoord ? [point.lng, point.lat] : [100.5, 13.75]

  const markerItems = useMemo<OverlapMarkerItem[]>(() => {
    if (!point || !hasCoord) return []
    return [
      {
        id: String(point.solution_id),
        coord: [point.lng, point.lat],
        title: point.solution_name,
        popup: <PointPopup point={point} />,
        popupOptions: { offset: 22, closeButton: false, maxWidth: '300px' },
      },
    ]
  }, [point, hasCoord])

  return (
    <div className='relative w-full h-full min-h-72'>
      <BaseMap initialCenter={center} initialZoom={hasCoord ? 15 : 6} initialPitch={30}>
        {markerItems.length > 0 && <OverlapMarkers items={markerItems} variant='white' />}
      </BaseMap>
    </div>
  )
}

export default React.memo(MapSection)
