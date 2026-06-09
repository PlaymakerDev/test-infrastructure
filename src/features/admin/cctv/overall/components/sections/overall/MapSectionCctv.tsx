"use client"
import React, { useEffect, useMemo } from 'react'
import BaseMap, { type MapEdgeFadeProps } from '@/components/map/BaseMap'
import ThailandMaskLayer from '@/components/map/markers/ThailandMaskLayer'
import MarkerLayer from '@/components/map/primitives/MarkerLayer'
import { useMap } from '@/components/map/hooks/useMap'
import { useAppSelector } from '@/stores/hooks'

const CentroidEffect: React.FC<{ centroid: [number, number] | undefined }> = ({ centroid }) => {
  const { map, isLoaded } = useMap()
  useEffect(() => {
    if (!map || !isLoaded || !centroid) return
    map.flyTo({ center: centroid, zoom: 8, duration: 1000 })
  }, [map, isLoaded, centroid])
  return null
}

interface Props {
  edgeFade?: MapEdgeFadeProps
}

const MapSectionCctv: React.FC<Props> = ({ edgeFade }) => {
  const overview = useAppSelector((s) => s.cctv.overview)

  const data = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: (overview?.locations ?? []).map((loc) => ({
      type: 'Feature' as const,
      properties: {
        codeName: loc.road.code_name,
        solutionName: loc.solution.solution_name,
        totalCameras: loc.total_cameras,
      },
      geometry: { type: 'Point' as const, coordinates: loc.geometry_point },
    })),
  }), [overview?.locations])

  return (
    <BaseMap initialZoom={5.4} edgeFade={edgeFade}>
      <CentroidEffect centroid={overview?.centroid} />
      <ThailandMaskLayer maskColor='#212121' maskOpacity={1} />
      <MarkerLayer
        id='cctv-locations'
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
          <div style={{ padding: '8px 10px', background: 'rgba(5,13,26,0.96)', borderRadius: 8, border: '1px solid #FCD116', fontFamily: 'ui-sans-serif,system-ui', minWidth: 160 }}>
            <div style={{ fontSize: 10, color: '#FCD116', fontWeight: 700 }}>CCTV</div>
            <div style={{ fontSize: 13, color: '#fff', fontWeight: 600, marginTop: 2 }}>{f.properties?.codeName}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{f.properties?.solutionName}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{Number(f.properties?.totalCameras).toLocaleString()} กล้อง</div>
          </div>
        )}
      />
    </BaseMap>
  )
}

export default React.memo(MapSectionCctv)
