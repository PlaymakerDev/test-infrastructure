"use client"
import React from 'react'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import type { CCTVRandomOnlineCamera } from '@/types/cctv/camera-api'

interface Props {
  cameras: CCTVRandomOnlineCamera[]
}

/** Left-rail live preview — up to 3 ONLINE CCTV cameras.
 *
 *  ⚠ Backend `random-online` backfills with offline cameras when there aren't
 *  enough online ones, so an `is_online` filter is required to keep the
 *  preview true to its name. Card visual matches Traffic Signal / Incident
 *  Detection (bg-(--mid-gray) + camera-code / camera-location classes). */
const CameraListCctv: React.FC<Props> = ({ cameras }) => {
  const onlineCameras = cameras.filter((c) => c.is_online)

  if (onlineCameras.length === 0) {
    return (
      <div className='h-full flex items-center justify-center text-gray-500 fs-12 p-4'>
        ไม่มีกล้องออนไลน์ในขณะนี้
      </div>
    )
  }

  return (
    <div className='h-full flex flex-col gap-4'>
      {onlineCameras.map((cam) => (
        <div
          key={cam.id}
          className='bg-(--mid-gray) p-3 rounded-lg flex-1 min-h-0 flex flex-col'
        >
          <HLSLivePlayer
            figureClassName='flex-1 min-h-0 mb-1.5 rounded-lg'
            hlsUrl={cam.hls_url}
            cameraId={cam.id}
            showLiveBadge
            enableViewportPause
          />
          <h4 className='camera-code'>{cam.camera_name}</h4>
          <p className='camera-location'>{cam.road_code}</p>
        </div>
      ))}
    </div>
  )
}

export default React.memo<Props>(CameraListCctv)
