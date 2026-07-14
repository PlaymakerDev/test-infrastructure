import React from 'react'
import { useControlVMSContext } from '../../../context'
import BaseMap from '@/components/map/BaseMap'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import { TbMapPin } from 'react-icons/tb'
import { Button, ConfigProvider, Image } from 'antd'

const DEFAULT_ICON = '/atlas/images/icon-marker/Default.svg'

const formatCoords = (lat: number, lng: number): string =>
  `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`

const MapSection: React.FC = () => {
  const { bureauRoute, bureauSign } = useControlVMSContext()

  const [lng, lat] = bureauSign?.geo_point ?? []
  const hasCoords = lat != null && lng != null
  const center: [number, number] | undefined = hasCoords ? [lng, lat] : undefined
  const googleMapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${lat},${lng}`
    : 'https://www.google.com/maps'
  const coords = hasCoords ? formatCoords(lat, lng) : null

  return (
    <div className='relative h-80 xl:h-96 2xl:h-104 rounded-xl overflow-hidden'>
      <BaseMap
        initialCenter={center}
        initialZoom={15}
        initialPitch={45}
      >
        {hasCoords && (
          <HTMLMarker
            key={bureauSign?.vms_id}
            lngLat={[lng, lat]}
            anchor="bottom"
            offset={[0, 19]}
            title={bureauSign?.solution_name}
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

      {hasCoords && (
        <div className='absolute bottom-3 left-3 right-3 z-10 rounded-lg bg-black/70 backdrop-blur-sm px-4 py-3 flex flex-col gap-1'>
          <div className='flex items-center gap-2'>
            <div className='shrink-0 w-6 h-6 rounded-full bg-(--yellow)/20 flex items-center justify-center'>
              <TbMapPin className='text-(--yellow) text-xs' />
            </div>
            <h5 className='text-(--yellow) font-medium'>จุดติดตั้งป้าย VMS</h5>
          </div>
          <p className='text-white leading-snug fs-12'>TrafficSign: {bureauSign?.solution_name || '-'}</p>
          <p className='text-white leading-snug fs-12'>รหัสสายทาง: {bureauRoute?.road_code || '-'}</p>
          {coords && <p className='fs-12 text-white/60'>{coords}</p>}
        </div>
      )}
    </div>
  )
}

export default React.memo(MapSection)
