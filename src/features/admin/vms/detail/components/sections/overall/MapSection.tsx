import BaseMap from '@/components/map/BaseMap'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import { APIResponseVMSDetail } from '@/types/vms/detail-api'
import React, { useMemo } from 'react'
import { TbMapPin } from 'react-icons/tb'

interface Props {
  data?: APIResponseVMSDetail
}

const MapSection: React.FC<Props> = ({ data }) => {
  const point = data?.solution.geometry_point

  const lngLat = useMemo<[number, number] | null>(() => {
    if (!point || point.length < 2) return null
    if (point[0] === 0 && point[1] === 0) return null
    return [point[0], point[1]]
  }, [point])

  return (
    <>
      <BaseMap
        initialCenter={lngLat ?? undefined}
        initialZoom={lngLat ? 17 : 5.2}
        initialPitch={lngLat ? 45 : 0}
        initialBearing={lngLat ? -10 : 0}
        edgeFade={{ left: 10, right: 10, top: 10, bottom: 10 }}
      >
        {lngLat && (
          <HTMLMarker lngLat={lngLat} anchor='bottom'>
            <div className='flex flex-col items-center'>
              <div
                className='w-9 h-9 rounded-full flex items-center justify-center'
                style={{
                  background: '#1a1a1a',
                  border: '2px solid #FCD116',
                  boxShadow: '0 0 0 4px rgba(252,209,22,0.2)',
                }}
              >
                <TbMapPin size={18} color='#FCD116' />
              </div>
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderTop: '8px solid #FCD116',
                }}
              />
            </div>
          </HTMLMarker>
        )}
      </BaseMap>
    </>
  )
}

export default React.memo<Props>(MapSection)
