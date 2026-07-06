import BaseMap from '@/components/map/BaseMap'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import { APIResponseVMSDetail, Solution } from '@/types/vms/detail-api'
import { Image } from 'antd'
import React, { useMemo } from 'react'

const DEFAULT_ICON = '/images/icon-marker/Default.svg'

interface Props {
  data?: APIResponseVMSDetail
  isWarranty?: boolean
  isOnline?: boolean
}

interface SolutionPopupProps {
  data?: Solution;
  isWarranty?: boolean;
  isOnline?: boolean
}

const SolutionPopup: React.FC<SolutionPopupProps> = (props) => {
  const { data, isWarranty, isOnline } = props

  return (
    <div className={`min-w-50 rounded-lg border px-3 py-2.5 bg-(--dark-black) border-green-400`}>
      <section>
        <p className='fs-11'>ชื่อสายทาง: <strong>{data?.solution_location?.project_roads?.road?.road_name || '-'}</strong></p>
        <p className='fs-11'>รหัสสายทาง: <strong>{data?.solution_location?.project_roads?.road?.road_code || '-'}</strong></p>
        <p className='fs-11'>ชื่อจุดติดตั้ง: <strong>{data?.solution_name || '-'}</strong></p>
      </section>
      <hr className='my-3' />
      <section className='mt-1.5'>
        <p className='fs-11'>สถานะ: <strong>{isOnline ? 'ออนไลน์' : 'ออฟไลน์'}</strong></p>
        <p className='fs-11'>การค้ำประกัน: <strong>{isWarranty ? 'อยู่ในค้ำ' : 'หมดค้ำ'}</strong></p>
      </section>
    </div>
  )
}

const MapSection: React.FC<Props> = (props) => {
  const { data, isWarranty, isOnline } = props

  const point = data?.solution?.geometry_point

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
          <HTMLMarker
            key={data?.solution?.id}
            lngLat={lngLat}
            anchor="bottom"
            offset={[0, 19]}
            title={data?.solution?.solution_name}
            popup={() => <SolutionPopup data={data?.solution} isWarranty={isWarranty} isOnline={isOnline} />}
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

export default React.memo<Props>(MapSection)
