"use client"
import React, { useMemo } from 'react'
import BaseMap, { type MapEdgeFadeProps } from '@/components/map/BaseMap'
import ThailandMaskLayer from '@/components/map/markers/ThailandMaskLayer'
import MarkerLayer from '@/components/map/primitives/MarkerLayer'
import { CCTV_PROVINCE_CLUSTERS } from '@/features/admin/cctv/overall/data/cctvData'

interface Props {
  edgeFade?: MapEdgeFadeProps
}

const MapSectionCctv: React.FC<Props> = ({ edgeFade }) => {
  const data = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: CCTV_PROVINCE_CLUSTERS.map((province) => ({
      type: 'Feature' as const,
      properties: { id: province.id, name: province.name, count: province.count },
      geometry: { type: 'Point' as const, coordinates: province.coord },
    })),
  }), [])

  return (
    <BaseMap initialCenter={[101.0, 13.5]} initialZoom={5.4} edgeFade={edgeFade}>
      <ThailandMaskLayer maskColor='#212121' maskOpacity={1} />
      <MarkerLayer
        id='cctv-provinces'
        data={data}
        color='#FCD116'
        size={22}
        strokeColor='#ffffff'
        onClick={(e, f) => {
          if (f.geometry.type === 'Point') {
            e.target.flyTo({ center: f.geometry.coordinates as [number, number], zoom: 9, duration: 800 })
          }
        }}
        popup={(f) => (
          <div style={{ padding: '8px 10px', background: 'rgba(5,13,26,0.96)', borderRadius: 8, border: '1px solid #FCD116', fontFamily: 'ui-sans-serif,system-ui', minWidth: 140 }}>
            <div style={{ fontSize: 10, color: '#FCD116', fontWeight: 700 }}>CCTV</div>
            <div style={{ fontSize: 13, color: '#fff', fontWeight: 600, marginTop: 2 }}>{f.properties?.name}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{Number(f.properties?.count).toLocaleString()} กล้อง</div>
          </div>
        )}
      />
    </BaseMap>
  )
}

export default React.memo(MapSectionCctv)
