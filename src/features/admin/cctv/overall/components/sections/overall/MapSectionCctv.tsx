"use client"
import { scopeQuerySuffix } from '@/services/routes/scopeParam'
import React, { useMemo } from 'react'
import BaseMap, { type MapEdgeFadeProps } from '@/components/map/BaseMap'
import ThailandMaskLayer from '@/components/map/markers/ThailandMaskLayer'
import DeviceMarkerLayer from '@/components/map/markers/DeviceMarkerLayer'
import RegionSummaryLayer, { REGION_DEVICE_MIN_ZOOM } from '@/components/map/markers/RegionSummaryLayer'
import FitBoundsEffect from '@/components/map/primitives/FitBoundsEffect'
import PopupDetailLink from '@/components/map/primitives/PopupDetailLink'
import { useCctvOverview } from '@/hooks/queries/cctv'
import { useDeptId } from '@/hooks/useDeptId'
import { useRouter } from 'next/navigation'

interface Props {
  deptId?: string | null
  roadId?: string | null
  edgeFade?: MapEdgeFadeProps
}

const MapSectionCctv: React.FC<Props> = ({ deptId, roadId, edgeFade }) => {
  const { data: overview } = useCctvOverview(deptId, roadId ? { road_id: Number(roadId) } : {})
  const router = useRouter()
  // Guaranteed dept id for the popup's detail link (matches how the overall
  // table navigates). The detail page self-derives project_id / road_id.
  const navDeptId = useDeptId()

  // Every solution location with a coordinate — the map frames all of them
  // (bureau → แขวง → สายทาง) instead of a fixed centroid zoom.
  const coords = useMemo<[number, number][]>(
    () =>
      (overview?.locations ?? [])
        .filter((loc) => Array.isArray(loc.geometry_point) && loc.geometry_point.length === 2)
        .map((loc) => loc.geometry_point as [number, number]),
    [overview?.locations]
  )

  // Uniform padding — the map sits in its own grid column now (no overlays),
  // so no need to reserve extra space on left/right for overlay panels.
  const fitPadding = 60

  const data = useMemo(() => ({
    type: 'FeatureCollection' as const,
    // Drop locations without coords — a single feature with `coordinates: null`
    // makes Mapbox reject the whole GeoJSON source (→ no markers render at all).
    features: (overview?.locations ?? [])
      .filter((loc) => Array.isArray(loc.geometry_point) && loc.geometry_point.length === 2)
      .map((loc) => ({
        type: 'Feature' as const,
        properties: {
          solutionId: loc.solution.id,
          codeName: loc.road.code_name,
          solutionName: loc.solution.solution_name,
          totalCameras: loc.total_cameras,
          onlineCount: loc.online_count,
          offlineCount: loc.offline_count,
        },
        geometry: { type: 'Point' as const, coordinates: loc.geometry_point as [number, number] },
      })),
  }), [overview?.locations])

  return (
    <BaseMap initialZoom={5.4} edgeFade={edgeFade}>
      <FitBoundsEffect coords={coords} padding={fitPadding} maxZoom={12} />
      <ThailandMaskLayer maskColor='#212121' maskOpacity={1} />
      {/* สทช./ขทช. aggregate bubbles (dashboard-style ladder, menu colors) —
          the pin layer below only shows past the ขทช. tier. */}
      <RegionSummaryLayer type='CCTV' />
      <DeviceMarkerLayer
        type='CCTV'
        id='cctv-locations'
        data={data}
        cluster
        minZoom={REGION_DEVICE_MIN_ZOOM}
        size={18}
        strokeColor='#ffffff'
        popupOptions={{ offset: 10, closeButton: false }}
        popup={(f) => (
          <div style={{ padding: '8px 10px', background: 'rgba(5,13,26,0.96)', borderRadius: 8, border: '1px solid #4DA3FF', minWidth: 170 }}>
            <div style={{ fontSize: 10, color: '#4DA3FF', fontWeight: 700 }}>CCTV</div>
            <div style={{ fontSize: "var(--fs-12)", color: '#fff', fontWeight: 600, marginTop: 2 }}>{f.properties?.codeName}</div>
            <div style={{ fontSize: "var(--fs-12)", color: '#94a3b8', marginTop: 2 }}>{f.properties?.solutionName}</div>
            <div style={{ fontSize: "var(--fs-12)", color: '#94a3b8', marginTop: 4 }}>
              ทั้งหมด {Number(f.properties?.totalCameras).toLocaleString()} กล้อง
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 3, fontSize: "var(--fs-12)", fontWeight: 600 }}>
              <span style={{ color: '#66AEFF' }}>● ออนไลน์ {Number(f.properties?.onlineCount ?? 0).toLocaleString()}</span>
              <span style={{ color: '#E94C4C' }}>● ออฟไลน์ {Number(f.properties?.offlineCount ?? 0).toLocaleString()}</span>
            </div>
            {f.properties?.solutionId != null && (
              <div>
                <PopupDetailLink
                  url={`/admin/cctv/detail/${f.properties?.solutionId}?dept_id=${navDeptId}${scopeQuerySuffix()}`}
                  onNavigate={(u) => router.push(u)}
                />
              </div>
            )}
          </div>
        )}
      />
    </BaseMap>
  )
}

export default React.memo(MapSectionCctv)
