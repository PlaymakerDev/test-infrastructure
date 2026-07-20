import React, { useMemo } from 'react'
import BaseMap from '@/components/map/BaseMap';
import { TbMapPin } from 'react-icons/tb';
import { Button, ConfigProvider, Image } from 'antd';
import { MobileMasterDepartmentByTIDData } from '@/types/tracking/detail-api';
import HTMLMarker from '@/components/map/primitives/HTMLMarker';

interface Props {
  departmentData?: MobileMasterDepartmentByTIDData
}

const formatCoords = (lat: number, lng: number): string => {
  return `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`
}

// Prepend the Next.js basePath (`/atlas` in prod). A bare `/images/...`
// slips past nginx's app-scoped locations and gets 301'd into `/dashvue`,
// where the asset doesn't exist either → 404 flood.
const DEFAULT_ICON = `${process.env.__NEXT_ROUTER_BASEPATH ?? ''}/images/icon-marker/Default.svg`

const MobileDetailMap: React.FC<Props> = (props) => {
  const { departmentData } = props;

  const point = useMemo(() => [Number(departmentData?.longitude), Number(departmentData?.latitude)], [departmentData])

  const lngLat = useMemo<[number, number] | null>(() => {
    if (!point || point.length < 2) return null
    if (point[0] === 0 && point[1] === 0) return null
    return [point[0], point[1]]
  }, [point])


  const hasCoords = departmentData?.latitude != null && departmentData?.longitude != null
  const googleMapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${departmentData!.latitude},${departmentData!.longitude}`
    : 'https://www.google.com/maps'

  const coords = hasCoords ? formatCoords(Number(departmentData!.latitude!), Number(departmentData!.longitude!)) : null

  return (
    <div className='relative h-full min-h-80 rounded-xl overflow-hidden'>
      <BaseMap
        initialCenter={lngLat ?? undefined}
        initialZoom={lngLat ? 17 : 5.2}
        initialPitch={lngLat ? 45 : 0}
        initialBearing={lngLat ? -10 : 0}
        edgeFade={{ left: 10, right: 10, top: 10, bottom: 10 }}
      >
        {lngLat && (
          <HTMLMarker
            key={departmentData?.tid}
            lngLat={lngLat}
            anchor="bottom"
            offset={[0, 19]}
            title={departmentData?.way_name}
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

      {/* Google Map button */}
      <ConfigProvider theme={{ token: { colorPrimary: '#1A73E8', colorTextLightSolid: '#FFFFFF' } }}>
        <Button
          type='primary'
          size='small'
          href={googleMapsUrl}
          target='_blank'
          className='absolute! top-3 right-3 z-10'
          shape='round'
        >
          Google Map
        </Button>
      </ConfigProvider>

      {/* Location overlay */}
      {hasCoords && (
        <div className='absolute bottom-3 left-3 right-3 z-10 rounded-lg bg-black/70 backdrop-blur-sm px-4 py-3 flex flex-col gap-1'>
          <div className='flex items-center gap-2'>
            <TbMapPin className='text-(--yellow) fs-22' />
            <h5 className='text-(--yellow) font-medium'>จุดตั้งด่าน</h5>
          </div>
          <p className='text-white leading-snug fs-12'>{departmentData?.way_name || '-'}</p>
          {coords && <p className='fs-12 text-white/60'>{coords}</p>}
        </div>
      )}
    </div>
  )
}

export default React.memo<Props>(MobileDetailMap)
