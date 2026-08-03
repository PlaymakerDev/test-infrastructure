"use client"
import { scopeQuerySuffix } from '@/services/routes/scopeParam'
import React, { useMemo } from 'react'
import BaseMap from '@/components/map/BaseMap'
import ThailandMaskLayer from '@/components/map/markers/ThailandMaskLayer'
import DeviceMarkerLayer from '@/components/map/markers/DeviceMarkerLayer'
import FitBoundsEffect from '@/components/map/primitives/FitBoundsEffect'
import PopupDetailLink from '@/components/map/primitives/PopupDetailLink'
import { useTrafficOverview } from '@/hooks/queries/traffic-signal'
import { useDeptId } from '@/hooks/useDeptId'
import { useRouter } from 'next/navigation'
import type { TrafficLocation } from '@/types/traffic-signal/overview-api'

interface Props {
  roadId?: string | null
}

const FALLBACK_CENTER: [number, number] = [100.5, 14.0]

type TrafficFeatureCollection = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  Record<string, unknown>
>

/** A usable coordinate — guards against null / missing / [0,0]. A single bad
 *  point with `coordinates: null` makes Mapbox reject the WHOLE GeoJSON source
 *  (→ no markers at all) and would crash fitBounds, so we drop them. NOTE:
 *  signals the backend has no lat/lon for simply can't be plotted — they appear
 *  in the table (central/list) but never on the map. */
const isValidCoord = (g: unknown): g is [number, number] =>
  Array.isArray(g) && g.length === 2 &&
  typeof g[0] === 'number' && typeof g[1] === 'number' &&
  (g[0] !== 0 || g[1] !== 0)

/** Convert raw API locations → GeoJSON FeatureCollection for MarkerLayer.
 *  Locations without a usable coordinate are dropped. */
const toGeoJSON = (locations: TrafficLocation[]): TrafficFeatureCollection => ({
  type: 'FeatureCollection',
  features: locations.filter((loc) => isValidCoord(loc.GeometryPoint)).map((loc) => ({
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
const TrafficSignalPopup: React.FC<{
  feature: GeoJSON.Feature
  isOnline: boolean
  deptId: string
  onNavigate: (url: string) => void
}> = ({ feature, isOnline, deptId, onNavigate }) => {
  const p = feature.properties as Record<string, unknown>
  return (
    <div
      className='min-w-50 rounded-lg border px-3 py-2.5 bg-[rgba(5,13,26,0.96)]'
      style={{ borderColor: '#A3E635' }}
    >
      <p
        className='fs-12 font-bold tracking-wide'
        style={{ color: '#A3E635' }}
      >
        Traffic Signal · {String(p.code_name)}
      </p>
      <p className='fs-14 font-semibold text-white leading-snug mt-0.5'>
        {String(p.solution_name)}
      </p>
      <p
        className={`fs-12 font-semibold mt-1.5 ${isOnline ? 'text-emerald-400' : 'text-red-400'
          }`}
      >
        ● {isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
      </p>
      <p className='fs-12 text-slate-500 mt-0.5'>
        PCU: {Number(p.total_pcu ?? 0).toLocaleString()} · Phase:{' '}
        {String(p.total_phases ?? '-')}
      </p>
      {p.id != null && (
        <PopupDetailLink
          url={`/admin/traffic-signal/detail/${String(p.id)}?dept_id=${deptId}${scopeQuerySuffix()}`}
          onNavigate={onNavigate}
        />
      )}
    </div>
  )
}

// ─── Marker layer group (runs inside MapContext) ──────────────────────────────

interface MarkerLayerGroupProps {
  locations: TrafficLocation[]
  isReady: boolean
}

const TrafficSignalMarkerLayer: React.FC<MarkerLayerGroupProps> = ({
  locations,
  isReady,
}) => {
  const router = useRouter()
  const deptId = useDeptId()
  // One source for all markers — lets Mapbox cluster across online/offline
  // when two signals are geographically close (e.g. solutions 1557 and 2480
  // are ~25m apart). Separate layers would never cluster together.
  const allData = useMemo(() => toGeoJSON(locations), [locations])

  // Frame EVERY plottable signal marker in view (instead of a fixed centroid
  // zoom) so all สำนัก/แขวง/สายทาง points are visible at once. Uses the same
  // coord guard as the markers, so map framing matches what's rendered.
  const coords = useMemo<[number, number][]>(
    () => locations.map((l) => l.GeometryPoint).filter(isValidCoord),
    [locations]
  )

  if (!isReady) return null

  return (
    <>
      <FitBoundsEffect coords={coords} padding={56} maxZoom={13} />
      <DeviceMarkerLayer
        type='Traffic'
        id='traffic-signal'
        data={allData}
        cluster
        size={18}
        popup={(f) => (
          <TrafficSignalPopup
            feature={f}
            isOnline={Boolean((f.properties as Record<string, unknown>)?.is_online)}
            deptId={deptId}
            onNavigate={(u) => router.push(u)}
          />
        )}
        popupOptions={{ offset: 10, closeButton: false }}
      />
    </>
  )
}

// ─── Map shell ─────────────────────────────────────────────────────────────────

const MapTrafficSignal: React.FC<Props> = (props) => {
  const { roadId } = props
  const deptId = useDeptId()
  // Overall map shows EVERY signal in the department — same approach as the
  // cctv / incident-detection overall maps. (Earlier this read `solution_id`
  // from the URL and filtered the request, which made the markers disappear
  // when the deep-link param was carried over from another menu.)
  const { data, isLoading, isSuccess } = useTrafficOverview(deptId, roadId ? { road_id: roadId } : {})

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

export default React.memo<Props>(MapTrafficSignal)
