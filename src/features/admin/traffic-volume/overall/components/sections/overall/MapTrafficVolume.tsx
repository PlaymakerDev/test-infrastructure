"use client"
import { scopeQuerySuffix } from '@/services/routes/scopeParam'
import React, { useMemo } from 'react'
import BaseMap from '@/components/map/BaseMap'
import ThailandMaskLayer from '@/components/map/markers/ThailandMaskLayer'
import DeviceMarkerLayer from '@/components/map/markers/DeviceMarkerLayer'
import RegionSummaryLayer, { REGION_DEVICE_MIN_ZOOM } from '@/components/map/markers/RegionSummaryLayer'
import FitBoundsEffect from '@/components/map/primitives/FitBoundsEffect'
import PopupDetailLink from '@/components/map/primitives/PopupDetailLink'
import { useTrafficVolumeOverview } from '@/hooks/queries/traffic-volume'
import { useDeptId } from '@/hooks/useDeptId'
import { useRouter } from 'next/navigation'
import type { CountingLocation } from '@/types/traffic-volume/overview-api'

interface Props {
  roadId?: string | null
}

const FALLBACK_CENTER: [number, number] = [100.5, 14.0]

type TrafficVolumeFeatureCollection = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  Record<string, unknown>
>

/** A usable [lng, lat] — drops null / malformed / [0,0]. One bad point makes
 *  Mapbox reject the WHOLE GeoJSON source (fires a map `error`: "object null
 *  is not iterable") → no markers at all. Hit for real on dept 0 + scope=all
 *  where 3/410 counting locations came back with a null geometry_point. */
const isValidCoord = (g: unknown): g is [number, number] =>
  Array.isArray(g) && g.length === 2 &&
  typeof g[0] === 'number' && typeof g[1] === 'number' &&
  !(g[0] === 0 && g[1] === 0)

/** Convert raw API locations → GeoJSON FeatureCollection for MarkerLayer. */
const toGeoJSON = (locations: CountingLocation[]): TrafficVolumeFeatureCollection => ({
  type: 'FeatureCollection',
  features: locations.filter((loc) => isValidCoord(loc.geometry_point)).map((loc) => ({
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
  deptId: string
  onNavigate: (url: string) => void
}> = ({ feature, deptId, onNavigate }) => {
  const p = feature.properties as Record<string, unknown>
  return (
    <div
      className='min-w-50 rounded-lg border px-3 py-2.5 bg-[rgba(5,13,26,0.96)]'
      style={{ borderColor: '#2DD4BF' }}
    >
      <p
        className='fs-12 font-bold tracking-wide'
        style={{ color: '#2DD4BF' }}
      >
        Traffic Volume · {String(p.code_name)}
      </p>
      <p className='fs-14 font-semibold text-white leading-snug mt-0.5'>
        {String(p.solution_name)}
      </p>
      <p
        className={`fs-12 font-semibold mt-1.5 ${p.is_active ? 'text-emerald-400' : 'text-red-400'}`}
      >
        ● {p.is_active ? 'ออนไลน์' : 'ออฟไลน์'}
      </p>
      <p className='fs-12 text-slate-500 mt-0.5'>
        ปริมาณจราจร: {Number(p.total_count ?? 0).toLocaleString()} คัน
      </p>
      {p.id != null && (
        <PopupDetailLink
          url={`/admin/traffic-volume/detail/${String(p.id)}?dept_id=${deptId}${scopeQuerySuffix()}`}
          onNavigate={onNavigate}
        />
      )}
    </div>
  )
}

// ─── Marker layer group (runs inside MapContext) ──────────────────────────────

interface MarkerLayerGroupProps {
  locations: CountingLocation[]
  isReady: boolean
}

const TrafficVolumeMarkerLayer: React.FC<MarkerLayerGroupProps> = ({
  locations,
  isReady,
}) => {
  const router = useRouter()
  const deptId = useDeptId()

  // Frame every station with a coordinate — same FitBoundsEffect (and the
  // same outlier guard) as the cctv / incident-detection overall maps, so a
  // bureau opens framed on the bureau instead of the whole country.
  const coords = useMemo<[number, number][]>(
    () => locations.map((l) => l.geometry_point).filter(isValidCoord),
    [locations]
  )

  // One source for all markers — lets Mapbox cluster nearby stations together.
  const allData = useMemo(() => toGeoJSON(locations), [locations])

  if (!isReady) return null

  return (
    <>
      <FitBoundsEffect coords={coords} padding={60} maxZoom={12} trimOutliers />
      <DeviceMarkerLayer
        minZoom={REGION_DEVICE_MIN_ZOOM}
        type='Counting'
        id='traffic-volume'
        data={allData}
        cluster
        size={18}
        popup={(f) => (
          <TrafficVolumePopup feature={f} deptId={deptId} onNavigate={(u) => router.push(u)} />
        )}
        popupOptions={{ offset: 10, closeButton: false }}
      />
    </>
  )
}

// ─── Map shell ─────────────────────────────────────────────────────────────────

const MapTrafficVolume: React.FC<Props> = ({ roadId }) => {
  const deptId = useDeptId()
  const { data, isLoading, isSuccess } = useTrafficVolumeOverview(deptId, roadId ? { road_id: roadId } : {})

  const centroidValid =
    !!data?.centroid && (data.centroid[0] !== 0 || data.centroid[1] !== 0)
  const initialCenter: [number, number] = centroidValid
    ? (data.centroid as [number, number])
    : FALLBACK_CENTER

  return (
    <div className='relative w-full h-full'>
      <BaseMap initialCenter={initialCenter} initialZoom={5.2} edgeFade={{ all: 20 }}>
        <ThailandMaskLayer maskColor='#212121' maskOpacity={1} />
        <RegionSummaryLayer type='Counting' />
        <TrafficVolumeMarkerLayer
          locations={data?.locations ?? []}
          isReady={isSuccess}
        />
      </BaseMap>

      {isLoading && (
        <div className='absolute inset-0 flex items-center justify-center bg-black/40 z-10 rounded-lg'>
          <div className='flex flex-col items-center gap-2'>
            <div className='w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin' />
            <span className='text-yellow-400 fs-12'>กำลังโหลด...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo<Props>(MapTrafficVolume)
