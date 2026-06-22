"use client"
import React, { useEffect, useMemo } from 'react'
import BaseMap from '@/components/map/BaseMap'
import ThailandMaskLayer from '@/components/map/markers/ThailandMaskLayer'
import MarkerLayer from '@/components/map/primitives/MarkerLayer'
import { useMap } from '@/components/map/hooks/useMap'
import { useTrafficOverview } from '@/hooks/queries/traffic-signal'
import { useDeptId } from '@/hooks/useDeptId'
import { useSolutionId } from '@/hooks/useSolutionId'
import type { TrafficLocation } from '@/types/traffic-signal/overview-api'

interface Props {}

const FALLBACK_CENTER: [number, number] = [100.5, 14.0]

type TrafficFeatureCollection = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  Record<string, unknown>
>

/** Convert raw API locations → GeoJSON FeatureCollection for MarkerLayer. */
const toGeoJSON = (locations: TrafficLocation[]): TrafficFeatureCollection => ({
  type: 'FeatureCollection',
  features: locations.map((loc) => ({
    type: 'Feature',
    properties: {
      id: loc.solution.id,
      solution_name: loc.solution.solution_name,
      code_name: loc.road.code_name,
      is_online: loc.traffic.is_online,
      total_pcu: loc.traffic.total_pcu,
      total_phases: loc.traffic.total_phases,
    },
    geometry: { type: 'Point', coordinates: loc.GeometryPoint },
  })),
})

/** Popup card shown on marker click — matches VMS popup style for consistency. */
const TrafficSignalPopup: React.FC<{ feature: GeoJSON.Feature; isOnline: boolean }> = ({
  feature,
  isOnline,
}) => {
  const p = feature.properties as Record<string, unknown>
  return (
    <div
      className={`min-w-50 rounded-lg border px-3 py-2.5 bg-[rgba(5,13,26,0.96)] ${
        isOnline ? 'border-cyan-400' : 'border-red-500'
      }`}
    >
      <p
        className={`fs-11 font-bold tracking-wide ${
          isOnline ? 'text-cyan-400' : 'text-red-400'
        }`}
      >
        Traffic Signal · {String(p.code_name)}
      </p>
      <p className='fs-14 font-semibold text-white leading-snug mt-0.5'>
        {String(p.solution_name)}
      </p>
      <p
        className={`fs-11 font-semibold mt-1.5 ${
          isOnline ? 'text-emerald-400' : 'text-red-400'
        }`}
      >
        ● {isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
      </p>
      <p className='fs-11 text-slate-500 mt-0.5'>
        PCU: {Number(p.total_pcu ?? 0).toLocaleString()} · Phase:{' '}
        {String(p.total_phases ?? '-')}
      </p>
    </div>
  )
}

// ─── Marker layer group (runs inside MapContext) ──────────────────────────────

interface MarkerLayerGroupProps {
  locations: TrafficLocation[]
  centroid: [number, number] | null
  isReady: boolean
}

const TrafficSignalMarkerLayer: React.FC<MarkerLayerGroupProps> = ({
  locations,
  centroid,
  isReady,
}) => {
  const { map, isLoaded } = useMap()

  // Fly to centroid once API resolves so the map zooms to actual data area.
  useEffect(() => {
    if (!map || !isLoaded || !isReady || !centroid) return
    if (centroid[0] === 0 && centroid[1] === 0) return
    map.flyTo({ center: centroid, zoom: 10, duration: 1200 })
  }, [map, isLoaded, isReady, centroid])

  // One source for all markers — lets Mapbox cluster across online/offline
  // when two signals are geographically close (e.g. solutions 1557 and 2480
  // are ~25m apart). Separate layers would never cluster together.
  const allData = useMemo(() => toGeoJSON(locations), [locations])

  if (!isReady) return null

  return (
    <MarkerLayer
      id='traffic-signal'
      data={allData}
      cluster
      // Tri-state color: yellow brand color for clusters (so users know to
      // zoom in), cyan for online, red for offline. Cluster features don't
      // carry `is_online`, so the `has point_count` branch must come first.
      color={[
        'case',
        ['has', 'point_count'],
        '#FCD116',
        ['==', ['get', 'is_online'], true],
        '#22d3ee',
        '#ef4444',
      ]}
      size={14}
      popup={(f) => (
        <TrafficSignalPopup
          feature={f}
          isOnline={Boolean((f.properties as Record<string, unknown>)?.is_online)}
        />
      )}
      popupOptions={{ offset: 10, closeButton: false }}
    />
  )
}

// ─── Map shell ─────────────────────────────────────────────────────────────────

const MapTrafficSignal: React.FC<Props> = () => {
  const deptId = useDeptId()
  const solutionId = useSolutionId()
  const { data, isLoading, isSuccess } = useTrafficOverview(
    deptId,
    solutionId ? { solution_id: solutionId } : {}
  )

  const centroidValid =
    !!data?.centroid && (data.centroid[0] !== 0 || data.centroid[1] !== 0)
  const initialCenter: [number, number] = centroidValid
    ? (data.centroid as [number, number])
    : FALLBACK_CENTER

  return (
    <div className='relative w-full h-full'>
      <BaseMap initialCenter={initialCenter} initialZoom={5.2} edgeFade={{ all: 20 }}>
        <ThailandMaskLayer maskColor='#212121' maskOpacity={1} />
        <TrafficSignalMarkerLayer
          locations={data?.locations ?? []}
          centroid={data?.centroid ?? null}
          isReady={isSuccess}
        />
      </BaseMap>

      {isLoading && (
        <div className='absolute inset-0 flex items-center justify-center bg-black/40 z-10 rounded-lg'>
          <div className='flex flex-col items-center gap-2'>
            <div className='w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin' />
            <span className='text-yellow-400 text-xs'>กำลังโหลด...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo<Props>(MapTrafficSignal)
