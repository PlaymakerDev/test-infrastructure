import React from 'react'
import BaseMap from '@/components/map/BaseMap'
import ThailandMaskLayer from '@/components/map/markers/ThailandMaskLayer'
import RouteLineLayer from './RouteLineLayer'
import VehicleMarkerLayer from './VehicleMarkerLayer'
import { GeoRoadData, VehicleLocationData } from '@/types/tracking/detail-gps-api'

interface Props {
  road?: GeoRoadData
  vehicle?: VehicleLocationData
  vehicleLocationIsLoading?: boolean
  vehicleLocationIsError?: boolean
  geoRoadIsLoading?: boolean
  geoRoadIsError?: boolean
}

const MapSection: React.FC<Props> = (props) => {
  const { road, vehicle, vehicleLocationIsLoading, geoRoadIsLoading } = props
  const isLoading = geoRoadIsLoading || vehicleLocationIsLoading

  return (
    <div className='h-full w-full'>
      <div className="map-wrapper h-full">
        <BaseMap
          initialCenter={[101.0, 14.5]}
          initialZoom={5.4}
          edgeFade={{ all: 10 }}
        >
          <ThailandMaskLayer />
          <RouteLineLayer positions={road?.position} />
          <VehicleMarkerLayer cars={vehicle?.car_list} />
        </BaseMap>

        {isLoading && (
          <div className='absolute inset-0 flex items-center justify-center bg-black/40 z-10 rounded-lg'>
            <div className='flex flex-col items-center gap-2'>
              <div className='w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin' />
              <span className='text-yellow-400 text-xs'>กำลังโหลด...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default React.memo<Props>(MapSection)
