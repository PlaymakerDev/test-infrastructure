import React from 'react'
import BaseMap from '@/components/map/BaseMap'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import { TbMapPin } from 'react-icons/tb'

interface Props { }

const STATION_COORD: [number, number] = [100.5018, 13.7563]

const OverallMap: React.FC<Props> = () => {
  return (
    <div className='relative rounded-lg overflow-hidden h-[55dvh]'>
      <BaseMap
        initialCenter={STATION_COORD}
        initialZoom={16}
        initialPitch={45}
        edgeFade={{ left: 10, right: 10, top: 10, bottom: 10 }}
      >
        <HTMLMarker lngLat={STATION_COORD} anchor='bottom'>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#FCD116',
              boxShadow: '0 4px 12px rgba(252,209,22,0.6)',
              border: '2px solid #fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TbMapPin size={20} color='#212121' />
          </div>
        </HTMLMarker>
      </BaseMap>
    </div>
  )
}

export default React.memo<Props>(OverallMap)
