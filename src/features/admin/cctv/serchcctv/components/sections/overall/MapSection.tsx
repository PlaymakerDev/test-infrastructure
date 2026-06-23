"use client"
import React, { useMemo } from 'react'
import BaseMap, { type MapEdgeFadeProps } from '@/components/map/BaseMap'
import ThailandMaskLayer from '@/components/map/markers/ThailandMaskLayer'
import MarkerLayer from '@/components/map/primitives/MarkerLayer'
import FitBoundsEffect from '@/components/map/primitives/FitBoundsEffect'

export interface SearchMapCamera {
  id: string
  name: string
  online: boolean
  coord: [number, number]
}

interface Props {
  cameras: SearchMapCamera[]
  edgeFade?: MapEdgeFadeProps
}

const MapSection: React.FC<Props> = ({ cameras, edgeFade }) => {
  const features = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: cameras.map((c) => ({
        type: 'Feature' as const,
        properties: { name: c.name, online: c.online },
        geometry: { type: 'Point' as const, coordinates: c.coord },
      })),
    }),
    [cameras]
  )

  const coords = useMemo<[number, number][]>(() => cameras.map((c) => c.coord), [cameras])

  // Reserve room for the search + info-card overlay on the right (always shown).
  const fitPadding = useMemo(
    () =>
      typeof window !== 'undefined' && window.innerWidth >= 640
        ? { top: 60, right: 350, bottom: 60, left: 50 }
        : 48,
    []
  )

  return (
    <BaseMap initialCenter={[100.5018, 13.7563]} initialZoom={11} edgeFade={edgeFade}>
      <FitBoundsEffect coords={coords} padding={fitPadding} maxZoom={15} />
      <ThailandMaskLayer maskColor='#212121' maskOpacity={1} />
      <MarkerLayer
        id='cctv-search-cameras'
        data={features}
        color={['case', ['get', 'online'], '#22d3ee', '#ef4444']}
        size={15}
        strokeColor='#ffffff'
        popup={(f) => {
          const online = Boolean((f.properties as Record<string, unknown>)?.online)
          return (
            <div
              style={{
                padding: '6px 10px',
                background: 'rgba(5,13,26,0.96)',
                borderRadius: 8,
                border: `1px solid ${online ? '#22d3ee' : '#ef4444'}`,
                minWidth: 150,
              }}
            >
              <div style={{ fontSize: 10, color: online ? '#22d3ee' : '#f87171', fontWeight: 700 }}>
                CCTV · {online ? 'ออนไลน์' : 'ออฟไลน์'}
              </div>
              <div style={{ fontSize: 12, color: '#fff', marginTop: 2 }}>
                {String((f.properties as Record<string, unknown>)?.name ?? '')}
              </div>
            </div>
          )
        }}
        popupOptions={{ offset: 10, closeButton: false }}
      />
    </BaseMap>
  )
}

export default React.memo(MapSection)
