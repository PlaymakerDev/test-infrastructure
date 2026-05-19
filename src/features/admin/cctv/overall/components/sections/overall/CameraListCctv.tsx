"use client"
import React from 'react'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import type { CctvCamera } from '@/features/admin/cctv/overall/data/cctvData'

interface CameraCardProps {
  camera: CctvCamera
}

const CameraCard: React.FC<CameraCardProps> = ({ camera }) => (
  <div
    style={{
      background: 'rgba(0,0,0,0.75)',
      border: '1px solid #1f2d3d',
      borderRadius: 12,
      overflow: 'hidden',
      backdropFilter: 'blur(6px)',
    }}
  >
    {/* HLS player */}
    <HLSLivePlayer
      hlsUrl={camera.hlsUrl}
      cameraId={camera.id}
      showLiveBadge
      enableViewportPause
      style={{ height: 120, display: 'block' }}
    />

    {/* Info */}
    <div style={{ padding: '8px 12px 10px' }}>
      <p
        style={{
          color: '#66AEFF',
          fontSize: 11,
          lineHeight: 1.5,
          wordBreak: 'break-all',
        }}
      >
        {camera.name}
      </p>
      <p style={{ color: '#6b7280', fontSize: 10, marginTop: 2 }}>
        IP Address : {camera.ip}
      </p>
    </div>
  </div>
)

interface Props {
  cameras: CctvCamera[]
}

const CameraListCctv: React.FC<Props> = ({ cameras }) => (
  <div className='flex flex-col gap-3'>
    {cameras.map((cam) => (
      <CameraCard key={cam.id} camera={cam} />
    ))}
  </div>
)

export default React.memo<Props>(CameraListCctv)
