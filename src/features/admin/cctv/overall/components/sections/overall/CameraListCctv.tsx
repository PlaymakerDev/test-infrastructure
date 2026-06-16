"use client"
import React from 'react'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import type { CctvRandomOnlineCamera } from '@/types/cctv'

const CameraCard: React.FC<{ camera: CctvRandomOnlineCamera }> = ({ camera }) => (
  <div className='bg-(--mid-gray) p-3 rounded-lg flex-1 min-h-0 flex flex-col'>
    <HLSLivePlayer
      figureClassName='flex-1 min-h-0 mb-1.5 rounded-lg'
      hlsUrl={camera.hls_url}
      cameraId={camera.id}
    />
    <h4 className='camera-code'>{camera.camera_name}</h4>
    <p className='camera-location'>{camera.road_code}</p>
  </div>
)

interface Props {
  cameras: CctvRandomOnlineCamera[]
}

const CameraListCctv: React.FC<Props> = ({ cameras }) => (
  <div className='h-full flex flex-col gap-4'>
    {cameras.map((cam) => (
      <CameraCard key={cam.id} camera={cam} />
    ))}
  </div>
)

export default React.memo<Props>(CameraListCctv)
