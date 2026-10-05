"use client"
import React, { useMemo } from 'react'
import { Skeleton } from 'antd'
import BaseMap from '@/components/map/BaseMap'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import { WhiteTeardropPin, OFFLINE_PIN_COLOR } from '@/components/map/markers/OverlapMarkers'
import { useLPRPointOverview } from '@/hooks/queries/lpr'
import { useLPRDetailContext } from '../../../context'

interface Props {

}

const FALLBACK_CENTER: [number, number] = [100.5, 13.75]

/** Usable [lng, lat] inside Thailand, or null. `geometry_point` from
 *  /lpr/.../overview is [lng, lat], but a row can arrive swapped — recognisable
 *  because lat ≈ 5–21 can't be a Thai longitude — so it's flipped back. Strict
 *  on purpose: Mapbox THROWS on a latitude outside ±90 (a swapped [13.7, 100.5]
 *  would crash the map at construction). Same rule as `toLngLat` in
 *  `lpr/overall/.../MapSection.tsx`, kept local so detail doesn't import from
 *  the overall module. */
const inThailand = (lng: number, lat: number) =>
  lng >= 96 && lng <= 107 && lat >= 4 && lat <= 22

const toLngLat = (g: unknown): [number, number] | null => {
  if (!Array.isArray(g) || g.length !== 2) return null
  const [a, b] = g
  if (typeof a !== 'number' || typeof b !== 'number') return null
  if (inThailand(a, b)) return [a, b]
  if (inThailand(b, a)) return [b, a]
  return null
}

interface PointPopupProps {
  name?: string
  roadCode?: string
  cameras?: { total: number; online?: number; offline?: number }
}

/** Info card opened by clicking the pin. Dark panel + blue border/title, same
 *  look as the LPR detail's other map (`sections/overall/MapSection.tsx`). */
const PointPopup: React.FC<PointPopupProps> = ({ name, roadCode, cameras }) => (
  <div className='min-w-50 max-w-65 rounded-lg border border-(--default-blue) bg-(--dark-black) px-3 py-2.5'>
    <p className='fs-12 font-semibold text-(--default-blue)'>{name || '-'}</p>
    <p className='fs-12 mt-0.5'>รหัสสายทาง: <strong>{roadCode || '-'}</strong></p>
    {cameras && (
      <p className='fs-12 mt-1.5'>
        กล้อง {cameras.total.toLocaleString('th-TH')}
        {cameras.online != null && cameras.offline != null && (
          <span> (ออนไลน์ {cameras.online.toLocaleString('th-TH')} / ออฟไลน์ {cameras.offline.toLocaleString('th-TH')})</span>
        )}
      </p>
    )}
  </div>
)

/** Center map — fills the full remaining device height below the fixed
 *  chrome above it (navbar + `DetailTitleSection` + the page's own margins),
 *  same `calc(viewport - Npx)` technique as cctv detail's map row
 *  (`cctv/detail/components/OverallSection.tsx`, 280px there). LPR's chrome
 *  budget: navbar `--nav-h` (72) + `DetailTitleSection` (~164, same shared
 *  component) + screen `mt-8` (32) + `NewOverallSection`'s own `mt-5` (20)
 *  before this row ⇒ 288px. `dvh` (not `vh`) so mobile browsers' collapsing
 *  address bar doesn't leave a gap at the bottom. `minHeight` guards very
 *  short viewports the same way cctv's `minHeight: 480` does.
 *
 *  No `relative`/`absolute` wrapper needed here: this component always
 *  renders inside an antd `<Col>` (`NewOverallSection.tsx`), and antd's own
 *  grid CSS already sets `.ant-col { position: relative }` — BaseMap's
 *  internal `absolute inset-0` layers bind to that for free. */
const ContentMap: React.FC<Props> = () => {
  const { point, isLoading: isPointLoading, departmentId, roadId, solutionId } = useLPRDetailContext()
  // Same hook + args as TitleSection → one shared cache entry, one request.
  const overview = useLPRPointOverview(departmentId, roadId, solutionId)

  // Overview first (the install point's own geometry). Fall back to the
  // /lpr/points row so a page opened without ?dept_id / ?road_id — where the
  // overview query stays disabled — still centres on the point.
  const location = overview.data?.locations?.[0]
  const overviewCoord = toLngLat(location?.geometry_point)
  const overviewLng = overviewCoord?.[0]
  const overviewLat = overviewCoord?.[1]
  const pointLng = point?.lng
  const pointLat = point?.lat
  // Memoized on the numbers, not on tuples: HTMLMarker re-runs `setLngLat`
  // whenever its `lngLat` reference changes, and a fresh tuple per render
  // (every 60s refetch included) would do that for nothing.
  const coord = useMemo<[number, number] | null>(() => {
    if (overviewLng != null && overviewLat != null) return [overviewLng, overviewLat]
    if (pointLng && pointLat) return [pointLng, pointLat]
    return null
  }, [overviewLng, overviewLat, pointLng, pointLat])

  // Name / road / camera counts for the popup — overview when we have it,
  // /lpr/points row otherwise (same fallback as the coord).
  const name = location?.solution?.solution_name ?? point?.solution_name
  const roadCode = location?.road?.code_name ?? point?.road_code
  const cameras = location?.lpr
    ? { total: location.lpr.total_camera, online: location.lpr.total_online, offline: location.lpr.total_offline }
    : point
      ? { total: point.camera_count }
      : undefined
  // Only an explicit `false` paints the pin red — "unknown" (no overview yet)
  // is not "offline".
  const isOffline = location?.is_online === false

  // BaseMap builds the Mapbox instance once and only reads `initialCenter` /
  // `initialZoom` at that moment — a coord arriving after mount would never
  // move it, leaving the map parked on the country view. So hold the map back
  // until a coord is known or both sources have settled without one.
  const isResolving = !coord && (overview.isLoading || isPointLoading)

  return (
    <div className='h-[calc(100dvh-288px)] min-h-120 rounded-2xl overflow-hidden'>
      {isResolving ? (
        <Skeleton.Node active style={{ width: '100%', height: '100%' }}>
          <span />
        </Skeleton.Node>
      ) : (
        <BaseMap
          initialCenter={coord ?? FALLBACK_CENTER}
          initialZoom={coord ? 15 : 6}
          initialPitch={30}
          edgeFade={{ all: 10 }}
        >
          {coord && (
            <HTMLMarker
              key={solutionId}
              lngLat={coord}
              anchor='bottom'
              title={name}
              popup={() => <PointPopup name={name} roadCode={roadCode} cameras={cameras} />}
              popupOptions={{ offset: 18, closeButton: false }}
            >
              {/* Shared detail-map teardrop — same marker language as vms /
                  crosswalk / incident detail; offline paints it red. */}
              <WhiteTeardropPin color={isOffline ? OFFLINE_PIN_COLOR : undefined} />
            </HTMLMarker>
          )}
        </BaseMap>
      )}
    </div>
  )
}

export default React.memo<Props>(ContentMap)
