"use client"
import React from 'react'
import BaseMap from '@/components/map/BaseMap'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import { WhiteTeardropPin } from '@/components/map/markers/OverlapMarkers'
import { useLPRDetailContext } from '../../../context'

/** Map centred on the install-point. One pin at the averaged coord of the
 *  solution's cameras — same coord the /lpr/points endpoint returns. */
const MapSection: React.FC = () => {
  const { point } = useLPRDetailContext()

  const hasCoord = !!point && point.lat && point.lng
  const center: [number, number] = hasCoord ? [point.lng, point.lat] : [100.5, 13.75]

  return (
    <div className='relative w-full h-full min-h-72'>
      <BaseMap initialCenter={center} initialZoom={hasCoord ? 15 : 6} initialPitch={30}>
        {point && hasCoord && (
          <HTMLMarker
            lngLat={[point.lng, point.lat]}
            anchor='bottom'
            title={`${point.solution_name} · ${point.camera_count} กล้อง`}
          >
            <WhiteTeardropPin color={point.events_hour > 0 ? '#FCD116' : undefined} />
          </HTMLMarker>
        )}
      </BaseMap>
    </div>
  )
}

export default React.memo(MapSection)
