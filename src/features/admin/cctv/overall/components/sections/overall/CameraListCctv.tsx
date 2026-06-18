"use client"
import React from 'react'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import type { CctvRandomOnlineCamera } from '@/types/cctv'

const CameraCard: React.FC<{ camera: CctvRandomOnlineCamera }> = ({ camera }) => (
  <div
    style={{
      background: 'rgba(0,0,0,0.75)',
      border: '1px solid #1f2d3d',
      borderRadius: 12,
      overflow: 'hidden',
      backdropFilter: 'blur(6px)',
    }}
  >
    <HLSLivePlayer
      hlsUrl={camera.hls_url}
      cameraId={camera.id}
      showLiveBadge
      enableViewportPause
      style={{ height: 120, display: 'block' }}
    />
    <div style={{ padding: '8px 12px 10px' }}>
      <p
        style={{
          color: '#66AEFF',
          fontSize: 11,
          lineHeight: 1.5,
          wordBreak: 'break-all',
        }}
      >
        {camera.camera_name}
      </p>
      <p style={{ color: '#6b7280', fontSize: 10, marginTop: 2 }}>
        {camera.road_code}
      </p>
    </div>
  </div>
)

interface Props {
  cameras: CctvRandomOnlineCamera[]
}

const CameraListCctv: React.FC<Props> = ({ cameras }) => (
  <div className='flex flex-col gap-3'>
    {cameras.map((cam) => (
      <CameraCard key={cam.id} camera={cam} />
    ))}
  </div>
)

export default React.memo<Props>(CameraListCctv)
