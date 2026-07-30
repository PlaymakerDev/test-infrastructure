"use client"
import React from 'react'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { useAppDispatch } from '@/stores/hooks'
import { setCCTVModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { useTrafficVolumeRandomCameras } from '@/hooks/queries/traffic-volume'
import { useDeptId } from '@/hooks/useDeptId'
import { Tooltip } from 'antd'

interface Props {
  roadId?: string | null
}

/** Left rail — live CCTV camera previews for traffic-volume counting stations.
 *  Data: `GET /counting/departments/{deptId}/cameras/random-online?limit=3` */
const CctvListTrafficVolume: React.FC<Props> = ({ roadId }) => {
  const deptId = useDeptId()
  const dispatch = useAppDispatch()
  const openCamera = (id: string) => dispatch(setCCTVModalOpen({ open: true, camera_id: id }))
  const { data, isLoading } = useTrafficVolumeRandomCameras(deptId, roadId ? { road_id: roadId, limit: 3 } : { limit: 3 })
  // Prefer online cameras; if none are online, still show the (offline) cards
  // rather than a blank slot (backend random-online backfills offline anyway).
  const cameras = data?.data ?? []
  const online = cameras.filter((entry) => entry.camera.is_online)
  const toShow = online.length > 0 ? online : cameras

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

  if (toShow.length === 0) {
    return (
      <div className='h-full flex items-center justify-center text-gray-500 fs-12 p-4'>
        ไม่มีกล้องในขณะนี้
      </div>
    )
  }

  return (
    <div className='h-full flex flex-col gap-4'>
      {toShow.map((entry) => {
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
            <Tooltip title={cam.name}>
              <h4 className='camera-code truncate'>{cam.name}</h4>
            </Tooltip>
            <p className='camera-location'>IP Address : {cam.ip_address}</p>
          </div>
        )
      })}
    </div>
  )
}

export default React.memo<Props>(CctvListTrafficVolume)
