import React, { useMemo } from 'react'
import BaseMap from '@/components/map/BaseMap'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import { APIResponsePositionByID, PositionByIDData } from '@/types/tracking/detail-api'
import { Badge, Image } from 'antd'

interface Props {
  positionByID?: APIResponsePositionByID
}

interface PositionPopupProps {
  data?: PositionByIDData
}

const DEFAULT_ICON = '/images/icon-marker/Default.svg'

const PositionPopup: React.FC<PositionPopupProps> = (props) => {
  const { data } = props

  return (
    <div className={`min-w-50 rounded-lg border px-3 py-2.5 bg-(--dark-black) ${data?.isEnable ? 'border-green-400' : 'border-red-500'}`}>
      <section>
        <p className='fs-12'>{data?.StationName || '-'}</p>
        <p className={`fs-12 ${data?.isEnable ? 'text-green-500' : 'text-red-500'}`}>สถานะ {data?.isEnable ? 'เปิดปกติ' : 'ปิด'} <Badge color={data?.isEnable ? 'green' : 'red'} /></p>
        <p className='fs-12 text-(--yellow)'>รถเข้าชั่งทั้งหมด: {data?.Total || 0}</p>
        <p className='fs-12 text-red-500'>รถเข้าน้ำหนักเกิน: {data?.Over || 0}</p>
      </section>
    </div>
  )
}


const OverallMap: React.FC<Props> = (props) => {
  const { positionByID } = props

  const point = useMemo(() => [Number(positionByID?.[0]?.Longtitude), Number(positionByID?.[0]?.Latitude)], [positionByID])

  const lngLat = useMemo<[number, number] | null>(() => {
    if (!point || point.length < 2) return null
    if (point[0] === 0 && point[1] === 0) return null
    return [point[0], point[1]]
  }, [point])

  return (
    <div className='relative rounded-lg overflow-hidden h-[55dvh]'>
      <BaseMap
        initialCenter={lngLat ?? undefined}
        initialZoom={lngLat ? 17 : 5.2}
        initialPitch={lngLat ? 45 : 0}
        initialBearing={lngLat ? -10 : 0}
        edgeFade={{ left: 10, right: 10, top: 10, bottom: 10 }}
      >
        {lngLat && (
          <HTMLMarker
            key={positionByID?.[0]?.StationID}
            lngLat={lngLat}
            anchor="bottom"
            offset={[0, 19]}
            title={positionByID?.[0]?.StationName}
            popup={() => <PositionPopup data={positionByID?.[0]} />}
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
    </div>
  )
}

export default React.memo<Props>(OverallMap)
