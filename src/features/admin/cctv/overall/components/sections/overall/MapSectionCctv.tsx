"use client"
import React from 'react'
import BaseMap from '@/components/map/BaseMap'
import ThailandMaskLayer from '@/components/map/markers/ThailandMaskLayer'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import { CCTV_PROVINCE_CLUSTERS } from '@/features/admin/cctv/overall/data/cctvData'

interface ClusterMarkerProps {
  count: number
}

const ClusterMarker: React.FC<ClusterMarkerProps> = ({ count }) => {
  const fontSize = count >= 1000 ? 10 : count >= 100 ? 11 : 13
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: '#FCD116',
        color: '#212121',
        fontWeight: 700,
        fontSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 12px rgba(252,209,22,0.55)',
        border: '2px solid #fff',
        fontFamily: 'ui-sans-serif, system-ui',
        letterSpacing: '-0.5px',
      }}
    >
      {count}
    </div>
  )
}

const MapSectionCctv: React.FC = () => {
  return (
    <BaseMap initialCenter={[101.0, 13.5]} initialZoom={5.4}>
      <ThailandMaskLayer maskColor='#212121' maskOpacity={1} />
      {CCTV_PROVINCE_CLUSTERS.map((province) => (
        <HTMLMarker
          key={province.id}
          lngLat={province.coord}
          anchor='center'
          title={`${province.name} — ${province.count.toLocaleString()} กล้อง`}
        >
          <ClusterMarker count={province.count} />
        </HTMLMarker>
      ))}
    </BaseMap>
  )
}

export default React.memo(MapSectionCctv)
