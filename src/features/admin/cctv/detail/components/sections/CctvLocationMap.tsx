"use client"
import React from 'react'
import BaseMap, { type MapEdgeFadeProps } from '@/components/map/BaseMap'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import type { CctvInstallDetail } from '@/features/admin/cctv/overall/data/cctvData'

interface Props {
  detail: CctvInstallDetail
  edgeFade?: MapEdgeFadeProps
}

const CameraPin: React.FC<{ index: number; online: boolean }> = ({ index, online }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
    <div
      style={{
        width: 28, height: 28,
        borderRadius: '50% 50% 50% 0',
        transform: 'rotate(-45deg)',
        background: online ? '#ffffff' : '#E94C4C',
        boxShadow: '0 2px 8px rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <span style={{ transform: 'rotate(45deg)', fontSize: 10, fontWeight: 700, color: '#212121', lineHeight: 1 }}>
        {index}
      </span>
    </div>
  </div>
)

const CctvLocationMap: React.FC<Props> = ({ detail, edgeFade }) => (
  <BaseMap
    initialCenter={detail.coord}
    initialZoom={14}
    initialPitch={45}
    initialBearing={-10}
    edgeFade={edgeFade}
  >
    {detail.pins.map((pin, i) => (
      <HTMLMarker key={pin.id} lngLat={pin.coord} anchor='bottom'>
        <CameraPin index={i + 1} online={pin.online} />
      </HTMLMarker>
    ))}
  </BaseMap>
)

export default React.memo<Props>(CctvLocationMap)
