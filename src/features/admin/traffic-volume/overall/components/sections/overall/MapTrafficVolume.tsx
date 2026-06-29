"use client"
import React, { useEffect, useMemo } from 'react'
import BaseMap from '@/components/map/BaseMap'
import ThailandMaskLayer from '@/components/map/markers/ThailandMaskLayer'
import MarkerLayer from '@/components/map/primitives/MarkerLayer'
import { useMap } from '@/components/map/hooks/useMap'
import { useTrafficVolumeOverview } from '@/hooks/queries/traffic-volume'
import { useDeptId } from '@/hooks/useDeptId'
import type { CountingLocation } from '@/types/traffic-volume/overview-api'

interface Props {}

const FALLBACK_CENTER: [number, number] = [100.5, 14.0]

type TrafficVolumeFeatureCollection = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  Record<string, unknown>
>

/** Convert raw API locations → GeoJSON FeatureCollection for MarkerLayer. */
const toGeoJSON = (locations: CountingLocation[]): TrafficVolumeFeatureCollection => ({
  type: 'FeatureCollection',
  features: locations.map((loc) => ({
    type: 'Feature',
    properties: {
      id: loc.solution.id,
      solution_name: loc.solution.solution_name,
      code_name: loc.road.code_name,
      total_count: loc.total_count,
      // Treat any non-zero count as "active" — the overview endpoint doesn't
      // expose camera health directly.
      is_active: loc.total_count > 0,
    },
    geometry: { type: 'Point', coordinates: loc.geometry_point },
  })),
})

/** Popup card shown on marker click — mirrors traffic-signal's popup style. */
const TrafficVolumePopup: React.FC<{
  feature: GeoJSON.Feature
  isActive: boolean
}> = ({ feature, isActive }) => {
  const p = feature.properties as Record<string, unknown>
  return (
    <div
      className={`min-w-50 rounded-lg border px-3 py-2.5 bg-[rgba(5,13,26,0.96)] ${
        isActive ? 'border-cyan-400' : 'border-gray-500'
      }`}
    >
      <p
        className={`fs-11 font-bold tracking-wide ${
          isActive ? 'text-cyan-400' : 'text-gray-400'
        }`}
      >
        Traffic Volume · {String(p.code_name)}
      </p>
      <p className='fs-14 font-semibold text-white leading-snug mt-0.5'>
        {String(p.solution_name)}
      </p>
      <p className='fs-11 text-slate-500 mt-1.5'>
        ปริมาณจราจร: {Number(p.total_count ?? 0).toLocaleString()} คัน
      </p>
    </div>
  )
}

// ─── Marker layer group (runs inside MapContext) ──────────────────────────────

interface MarkerLayerGroupProps {
  locations: CountingLocation[]
  centroid: [number, number] | null
  isReady: boolean
}

const TrafficVolumeMarkerLayer: React.FC<MarkerLayerGroupProps> = ({
  locations,
  centroid,
  isReady,
}) => {
  const { map, isLoaded } = useMap()

  // Fit the map to all markers so the user sees the whole fleet at once.
  // Single-marker case can't form bounds → fall back to `flyTo` at a
  // sensible street-level zoom. `maxZoom` caps how close we zoom when the
  // markers are clustered tightly (e.g. one bureau's stations within a
  // few hundred meters of each other).
  useEffect(() => {
    if (!map || !isLoaded || !isReady) return

    const valid = locations
      .map((l) => l.geometry_point)
      .filter(
        (pt): pt is [number, number] =>
          Array.isArray(pt) &&
          pt.length === 2 &&
          !(pt[0] === 0 && pt[1] === 0)
      )

    if (valid.length === 0) {
      // No coords at all — use the centroid if it's non-zero.
      if (centroid && (centroid[0] !== 0 || centroid[1] !== 0)) {
        map.flyTo({ center: centroid, zoom: 6, duration: 1200 })
      }
      return
    }

    if (valid.length === 1) {
      map.flyTo({ center: valid[0], zoom: 13, duration: 1200 })
      return
    }

    let minLng = valid[0][0],
      maxLng = valid[0][0],
      minLat = valid[0][1],
      maxLat = valid[0][1]
    for (const [lng, lat] of valid) {
      if (lng < minLng) minLng = lng
      if (lng > maxLng) maxLng = lng
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
    }

    map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      { padding: 60, maxZoom: 12, duration: 1200 }
    )
  }, [map, isLoaded, isReady, locations, centroid])

  // One source for all markers — lets Mapbox cluster nearby stations together.
  const allData = useMemo(() => toGeoJSON(locations), [locations])

  if (!isReady) return null

  return (
    <MarkerLayer
      id='traffic-volume'
      data={allData}
      cluster
      // Cluster (yellow brand) → active (cyan) → idle/zero-count (gray).
      // Cluster check must come first since cluster features lack `is_active`.
      color={[
        'case',
        ['has', 'point_count'],
        '#FCD116',
        ['==', ['get', 'is_active'], true],
        '#22d3ee',
        '#979797',
      ]}
      size={14}
      popup={(f) => (
        <TrafficVolumePopup
          feature={f}
          isActive={Boolean(
            (f.properties as Record<string, unknown>)?.is_active
          )}
        />
      )}
      popupOptions={{ offset: 10, closeButton: false }}
    />
  )
}

// ─── Map shell ─────────────────────────────────────────────────────────────────

const MapTrafficVolume: React.FC<Props> = () => {
  const deptId = useDeptId()
  const { data, isLoading, isSuccess } = useTrafficVolumeOverview(deptId)

  const centroidValid =
    !!data?.centroid && (data.centroid[0] !== 0 || data.centroid[1] !== 0)
  const initialCenter: [number, number] = centroidValid
    ? (data.centroid as [number, number])
    : FALLBACK_CENTER

  return (
    <div className='relative w-full h-full'>
      <BaseMap initialCenter={initialCenter} initialZoom={5.2} edgeFade={{ all: 20 }}>
        <ThailandMaskLayer maskColor='#212121' maskOpacity={1} />
        <TrafficVolumeMarkerLayer
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

export default React.memo<Props>(MapTrafficVolume)
