"use client"
import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import BaseMap from '@/components/map/BaseMap'
import ThailandMaskLayer from '@/components/map/markers/ThailandMaskLayer'
import DeviceMarkerLayer from '@/components/map/markers/DeviceMarkerLayer'
import RegionSummaryLayer, { REGION_DEVICE_MIN_ZOOM } from '@/components/map/markers/RegionSummaryLayer'
import FitBoundsEffect from '@/components/map/primitives/FitBoundsEffect'
import PopupDetailLink from '@/components/map/primitives/PopupDetailLink'
import { SYSTEM_BRIGHT } from '@/features/admin/dashboard/data/systems'
import { useLPROverview } from '@/hooks/queries/lpr'
import { useDeptId } from '@/hooks/useDeptId'
import type { Location as LPRLocation } from '@/types/lpr/new-lpr-api'

const FALLBACK_CENTER: [number, number] = [98.97, 18.8]

/** The map always asks for the whole `scope=all` tree under the department
 *  (dept 0 → nationwide), independent of the page URL. The detail link carries
 *  the same scope — a cross-department solution opened WITHOUT it would fetch
 *  own-department-only data and render "ไม่พบข้อมูล". */
const MAP_SCOPE = 'all'

type LprFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Point, Record<string, unknown>>

/** Thailand's bounding box (+ margin) — this dashboard is Thailand-only. */
const inThailand = (lng: number, lat: number) =>
  lng >= 96 && lng <= 107 && lat >= 4 && lat <= 22

/** Normalize a backend coordinate to a usable [lng, lat] inside Thailand.
 *  `geometry_point` / `centroid` from /lpr/.../overview are [lng, lat] (GeoJSON
 *  order — unlike LPR `detection_location`, which is [lat, lng]). A row that
 *  arrives swapped is recognisable (lat ≈ 5–21 can't be a Thai longitude) and
 *  is flipped back; anything else outside Thailand / null / malformed / [0,0]
 *  is dropped. Why so strict: ONE stray point makes `FitBoundsEffect` frame a
 *  bounding box the size of the world (map opens as a far-out globe with no
 *  markers), and one non-finite point makes Mapbox reject the whole source. */
const toLngLat = (g: unknown): [number, number] | null => {
  if (!Array.isArray(g) || g.length !== 2) return null
  const [a, b] = g
  if (typeof a !== 'number' || typeof b !== 'number') return null
  if (inThailand(a, b)) return [a, b]
  if (inThailand(b, a)) return [b, a]
  return null
}

interface PlottedLocation {
  loc: LPRLocation
  coord: [number, number]
}

const plotLocations = (locations: LPRLocation[]): PlottedLocation[] =>
  locations.flatMap((loc) => {
    const coord = toLngLat(loc.geometry_point)
    if (!coord && process.env.NODE_ENV !== 'production') {
      console.warn('[lpr overview] dropped location with unusable geometry_point', loc.solution.id, loc.geometry_point)
    }
    return coord ? [{ loc, coord }] : []
  })

const toGeoJSON = (plotted: PlottedLocation[]): LprFeatureCollection => ({
  type: 'FeatureCollection',
  features: plotted.map(({ loc, coord }) => ({
    type: 'Feature',
    properties: {
      id: loc.solution.id,
      solution_name: loc.solution.solution_name,
      code_name: loc.road.code_name,
      is_online: loc.is_online,
      total_camera: loc.lpr.total_camera,
      total_online: loc.lpr.total_online,
      total_offline: loc.lpr.total_offline,
    },
    geometry: { type: 'Point', coordinates: coord },
  })),
})

interface LPRPopupProps {
  feature: GeoJSON.Feature
  detailUrl: (solutionId: number) => string
  onNavigate: (path: string) => void
}

const LPRPopup: React.FC<LPRPopupProps> = ({ feature, detailUrl, onNavigate }) => {
  const p = feature.properties as Record<string, unknown>
  const isOnline = Boolean(p.is_online)
  return (
    <div className='min-w-50 rounded-lg border px-3 py-2.5 bg-(--dark-black)' style={{ borderColor: SYSTEM_BRIGHT.LPR }}>
      <section>
        <p className='fs-12 font-bold' style={{ color: SYSTEM_BRIGHT.LPR }}>LPR</p>
        <h5>{String(p.solution_name)}</h5>
        <p className='fs-12 tracking-wide text-gray-400'>สายทาง : {String(p.code_name || '-')}</p>
        <p className={`fs-12 font-semibold mt-0.5 ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
          ● {isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
        </p>
      </section>
      <section className='mt-1.5 flex gap-2.5 fs-12 font-semibold'>
        <span className='text-(--default-blue)'>กล้อง {Number(p.total_camera ?? 0).toLocaleString()}</span>
        <span className='text-green-400'>ออนไลน์ {Number(p.total_online ?? 0).toLocaleString()}</span>
        <span className='text-red-400'>ออฟไลน์ {Number(p.total_offline ?? 0).toLocaleString()}</span>
      </section>
      <PopupDetailLink url={detailUrl(Number(p.id))} onNavigate={onNavigate} />
    </div>
  )
}

// ─── Marker layer — runs inside MapContext ────────────────────────────────────

interface MarkerLayerProps {
  plotted: PlottedLocation[]
  deptId: string
  isReady: boolean
}

const LprMarkerLayer: React.FC<MarkerLayerProps> = ({ plotted, deptId, isReady }) => {
  const router = useRouter()

  const data = useMemo(() => toGeoJSON(plotted), [plotted])

  // Frame EVERY plottable marker (fitBounds) — derived from the same normalized
  // list as the markers so framing matches what renders; maxZoom stops a single
  // dept / tight cluster from over-zooming to street level.
  const coords = useMemo<[number, number][]>(() => plotted.map((p) => p.coord), [plotted])

  if (!isReady) return null

  return (
    <>
      <FitBoundsEffect coords={coords} padding={56} maxZoom={12} />
      <DeviceMarkerLayer
        minZoom={REGION_DEVICE_MIN_ZOOM}
        type='LPR'
        id='lpr-locations'
        data={data}
        cluster
        size={18}
        strokeColor='#ffffff'
        popupOptions={{ offset: 10, closeButton: false }}
        popup={(f) => (
          <LPRPopup
            feature={f}
            onNavigate={router.push}
            detailUrl={(solutionId) => `/admin/lpr/detail/${solutionId}?dept_id=${deptId}&scope=${MAP_SCOPE}`}
          />
        )}
      />
    </>
  )
}

// ─── MapSection ───────────────────────────────────────────────────────────────

interface Props {
  deptId?: string | string[] | number
}

/** Overview map — one marker per LPR install-point from
 *  `GET /lpr/departments/{id}/overview?scope=all` (`getLPROverviewAPI`),
 *  rendered with the shared `DeviceMarkerLayer` (menu glyph + SYSTEMS color +
 *  clustering). Structure mirrors vms/overall's MapSection. */
const MapSection: React.FC<Props> = ({ deptId: deptIdProp }) => {
  const deptIdFromUrl = useDeptId()
  const deptId = String(deptIdProp ?? deptIdFromUrl ?? '0')

  const { data, isLoading, isSuccess } = useLPROverview(deptId, { scope: MAP_SCOPE })

  // BE sends `centroid: null` when the scope has no LPR at all — validate shape
  // before touching indices (vms/overall crashed on exactly this, 2026-07-21).
  const initialCenter = toLngLat(data?.centroid) ?? FALLBACK_CENTER

  // One normalized list feeds BOTH the pins and the region bubbles, so the two
  // zoom tiers always count the same install points.
  const locations = data?.locations
  const plotted = useMemo(() => plotLocations(locations ?? []), [locations])
  const regionPoints = useMemo(
    () => plotted.map((p) => ({ lng: p.coord[0], lat: p.coord[1] })),
    [plotted]
  )

  return (
    <div className='relative w-full h-full'>
      <BaseMap
        initialCenter={initialCenter}
        initialZoom={5.4}
        edgeFade={{ all: 10 }}
      >
        <ThailandMaskLayer maskColor='#212121' maskOpacity={1} />
        <RegionSummaryLayer type='LPR' />
        <LprMarkerLayer
          plotted={plotted}
          deptId={deptId}
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

export default React.memo<Props>(MapSection)
