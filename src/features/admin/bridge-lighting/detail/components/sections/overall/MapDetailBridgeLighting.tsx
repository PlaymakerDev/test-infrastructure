import BaseMap from '@/components/map/BaseMap'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { APIResponseBridgeLightingOverview, BridgeLightingLocation } from '@/types/bridge-lighting/overall-api'
import { APIResponseVMSDetail } from '@/types/vms/detail-api'
import { Image } from 'antd'
import React, { useMemo } from 'react'

const DEFAULT_ICON = '/images/icon-marker/Default.svg'

interface Props {
  locationData?: APIResponseBridgeLightingOverview
  isLocationSuccess?: boolean

}

interface SolutionPopupProps {
  data?: BridgeLightingLocation;
}

const SolutionPopup: React.FC<SolutionPopupProps> = (props) => {
  const { data } = props

  return (
    <div className={`min-w-50 rounded-lg border px-3 py-2.5 bg-(--dark-black) ${data?.is_online ? 'border-green-400' : 'border-red-400'}`}>
      <section>
        <p className='fs-12'>ชื่อจุดติดตั้ง: <strong>{data?.solution?.solution_name || '-'}</strong></p>
        <p className='fs-12'>รหัสสายทาง: <strong>{data?.road.code_name || '-'}</strong></p>
        <p className='fs-12'>สถานะ: <strong>{data?.is_online ? 'ออนไลน์' : 'ออฟไลน์'}</strong></p>
      </section>
    </div>
  )
}

const MapDetailBridgeLighting: React.FC<Props> = (props) => {
  const { locationData, isLocationSuccess } = props
  const location = locationData?.locations?.[0]

  const point = location?.geometry_point

  const lngLat = useMemo<[number, number] | null>(() => {
    if (!point || point.length < 2) return null
    if (point[0] === 0 && point[1] === 0) return null
    return [point[0], point[1]]
  }, [point])

  if (!isLocationSuccess) return null

  return (
    <>
      <BaseMap
        initialCenter={lngLat ?? undefined}
        initialZoom={lngLat ? 17 : 5.2}
        initialPitch={lngLat ? 45 : 0}
        initialBearing={lngLat ? -10 : 0}
        edgeFade={{ all: 10 }}
      >
        {lngLat && (
          <HTMLMarker
            key={location?.solution.id}
            lngLat={lngLat}
            anchor="bottom"
            offset={[0, 19]}
            title={location?.solution.solution_name}
            popup={() => (
              <SolutionPopup
                data={location}
              />
            )}
            popupOptions={{ offset: 10, closeButton: false }}
          >
            <Image
              src={DEFAULT_ICON}
              alt="station-pin"
              width={52}
              height={55}
              preview={false}
            />
          </HTMLMarker>
        )}
      </BaseMap>
    </>
  )
}

export default React.memo<Props>(MapDetailBridgeLighting)
