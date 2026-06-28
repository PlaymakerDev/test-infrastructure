"use client"
import React from 'react'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { useAppDispatch } from '@/stores/hooks'
import { setCCTVModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { useTrafficVolumeRandomCameras } from '@/hooks/queries/traffic-volume'
import { useDeptId } from '@/hooks/useDeptId'

interface Props {}

/** Left rail — live CCTV camera previews for traffic-volume counting stations.
 *  Data: `GET /counting/departments/{deptId}/cameras/random-online?limit=3` */
const CctvListTrafficVolume: React.FC<Props> = () => {
  const deptId = useDeptId()
  const dispatch = useAppDispatch()
  const openCamera = (id: string) => dispatch(setCCTVModalOpen({ open: true, camera_id: id }))
  const { data, isLoading } = useTrafficVolumeRandomCameras(deptId, 3)
  const cameras = data?.data ?? []

  if (isLoading && cameras.length === 0) {
    return (
      <div className='h-full flex flex-col gap-4'>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className='bg-(--mid-gray) p-3 rounded-lg flex-1 min-h-0 animate-pulse'
          />
        ))}
      </div>
    )
  }

  return (
    <div className='h-full flex flex-col gap-4'>
      {cameras.map((entry) => {
        const cam = entry.camera
        return (
          <div
            key={cam.id}
            className='bg-(--mid-gray) p-3 rounded-lg flex-1 min-h-0 flex flex-col cursor-pointer'
            onClick={() => openCamera(cam.id)}
            role='button'
            tabIndex={0}
          >
            {/* Inner "video card" — darker frame behind the stream so the
              * camera tile reads as a card-on-card layer, with the text info
              * sitting below the frame instead of floating in the same plane. */}
            <div className='bg-black/60 border border-white/5 rounded-lg overflow-hidden flex-1 min-h-0 mb-2'>
              <HLSLivePlayer
                figureClassName='w-full h-full rounded-lg'
                hlsUrl={cam.hls_url}
                cameraId={cam.id}
                style={{ pointerEvents: 'none' }}
              />
            </div>
            <h4 className='camera-code'>{cam.name}</h4>
            <p className='camera-location'>IP Address : {cam.ip_address}</p>
          </div>
        )
      })}
    </div>
  )
}

export default React.memo<Props>(CctvListTrafficVolume)
