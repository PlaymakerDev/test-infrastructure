import React from 'react'
import { useVMSContext } from '../../../context';
import BaseMap from '@/components/map/BaseMap';
import { TbMapPin } from 'react-icons/tb';
import { Button } from 'antd';

interface Props {

}

const formatCoords = (lat: number, lng: number): string => {
  return `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`
}

const MapSection: React.FC<Props> = (props) => {
  const { } = props;
  const { bureau, bureauRoute, bureauSign } = useVMSContext()

  const hasCoords = bureauSign?.latitude != null && bureauSign?.longitude != null
  const googleMapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${bureauSign!.latitude},${bureauSign!.longitude}`
    : 'https://www.google.com/maps'

  const coords = hasCoords ? formatCoords(bureauSign!.latitude!, bureauSign!.longitude!) : null

  return (
    <div className='relative h-80 xl:h-96 2xl:h-104 rounded-xl overflow-hidden'>
      <BaseMap
        initialCenter={hasCoords ? [bureauSign!.longitude!, bureauSign!.latitude!] : undefined}
        initialZoom={15}
        initialPitch={45}
      />

      {/* Centered pin */}
      <div className='absolute inset-0 flex items-center justify-center pointer-events-none z-10'>
        <TbMapPin className='text-white text-4xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]' />
      </div>

      {/* Google Map button */}
      <Button
        type='primary'
        size='small'
        href={googleMapsUrl}
        target='_blank'
        className='absolute! top-3 right-3 z-10'
      >
        Google Map
      </Button>

      {/* Location overlay */}
      {hasCoords && (
        <div className='absolute bottom-3 left-3 right-3 z-10 rounded-lg bg-black/70 backdrop-blur-sm px-4 py-3 flex flex-col gap-1'>
          <div className='flex items-center gap-2'>
            <div className='shrink-0 w-6 h-6 rounded-full bg-(--yellow)/20 flex items-center justify-center'>
              <TbMapPin className='text-(--yellow) text-xs' />
            </div>
            <p className='fs-11 text-(--yellow) font-medium'>จุดติดตั้งป้าย VMS</p>
          </div>
          <p className='text-white leading-snug fs-11'>TrafficSign: {bureauSign?.name || '-'}</p>
          <p className='text-white leading-snug fs-11'>รหัสสายทาง: {bureauRoute?.title || '-'}</p>
          {coords && <p className='fs-11 text-white/60'>{coords}</p>}
        </div>
      )}
    </div>
  )
}

export default React.memo<Props>(MapSection)
