"use client"
import React, { useMemo } from 'react'
import BaseMap, { type MapEdgeFadeProps } from '@/components/map/BaseMap'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import type { CctvInstallDetail, CctvInstallPin } from '@/features/admin/cctv/overall/data/cctvData'

interface Props {
  detail: CctvInstallDetail
  edgeFade?: MapEdgeFadeProps
}

interface PinGroup {
  coord: [number, number]
  pins: CctvInstallPin[]
}

const CameraPin: React.FC<{ online: boolean; count: number }> = ({ online, count }) => {
  const color = online ? '#ffffff' : '#E94C4C'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', position: 'relative' }}>
      <div
        style={{
          width: 32, height: 32,
          borderRadius: '50% 50% 50% 0',
          transform: 'rotate(-45deg)',
          background: color,
          boxShadow: '0 3px 12px rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 10, height: 10,
            borderRadius: '50%',
            background: online ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.6)',
            transform: 'rotate(45deg)',
          }}
        />
      </div>
      {count > 1 && (
        <div
          style={{
            position: 'absolute',
            top: -6, right: -8,
            minWidth: 18, height: 18,
            borderRadius: 9,
            background: '#FCD116',
            color: '#212121',
            fontSize: 10,
            fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
            lineHeight: 1,
          }}
        >
          {count}
        </div>
      )}
    </div>
  )
}

const CctvLocationMap: React.FC<Props> = ({ detail, edgeFade }) => {
  const pinGroups = useMemo<PinGroup[]>(() => {
    const map = new Map<string, PinGroup>()
    for (const pin of detail.pins) {
      const key = `${pin.coord[0].toFixed(6)},${pin.coord[1].toFixed(6)}`
      const existing = map.get(key)
      if (existing) {
        existing.pins.push(pin)
      } else {
        map.set(key, { coord: pin.coord, pins: [pin] })
      }
    }
    return Array.from(map.values())
  }, [detail.pins])

  return (
    <BaseMap
      initialCenter={detail.coord}
      initialZoom={14}
      initialPitch={45}
      initialBearing={-10}
      edgeFade={edgeFade}
    >
      {pinGroups.map((group) => (
        <HTMLMarker key={group.pins[0].id} lngLat={group.coord} anchor='bottom'>
          <CameraPin
            online={group.pins.some((p) => p.online)}
            count={group.pins.length}
          />
        </HTMLMarker>
      ))}
    </BaseMap>
  )
}

export default React.memo<Props>(CctvLocationMap)
