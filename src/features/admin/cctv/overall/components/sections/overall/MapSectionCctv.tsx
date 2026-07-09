"use client"
import React, { useMemo } from 'react'
import BaseMap, { type MapEdgeFadeProps } from '@/components/map/BaseMap'
import ThailandMaskLayer from '@/components/map/markers/ThailandMaskLayer'
import DeviceMarkerLayer from '@/components/map/markers/DeviceMarkerLayer'
import FitBoundsEffect from '@/components/map/primitives/FitBoundsEffect'
import PopupDetailLink from '@/components/map/primitives/PopupDetailLink'
import { useCctvOverview } from '@/hooks/queries/cctv'
import { useDeptId } from '@/hooks/useDeptId'
import { useRouter } from 'next/navigation'

interface Props {
  deptId?: string | null
  edgeFade?: MapEdgeFadeProps
}

const MapSectionCctv: React.FC<Props> = ({ deptId, edgeFade }) => {
  const { data: overview } = useCctvOverview(deptId)
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

  // Reserve space for the left camera-list + right stats overlays on xl screens
  // so markers don't end up hidden behind them. Below xl the overlays stack
  // under the map, so a small uniform padding is enough.
  const fitPadding = useMemo(
    () =>
      typeof window !== 'undefined' && window.innerWidth >= 1280
        ? { top: 60, right: 350, bottom: 60, left: 320 }
        : 56,
    []
  )

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
      <DeviceMarkerLayer
        type='CCTV'
        id='cctv-locations'
        data={data}
        cluster
        size={16}
        strokeColor='#ffffff'
        popupOptions={{ offset: 10, closeButton: false }}
        popup={(f) => (
          <div style={{ padding: '8px 10px', background: 'rgba(5,13,26,0.96)', borderRadius: 8, border: '1px solid #4DA3FF', fontFamily: 'ui-sans-serif,system-ui', minWidth: 170 }}>
            <div style={{ fontSize: 10, color: '#4DA3FF', fontWeight: 700 }}>CCTV</div>
            <div style={{ fontSize: 13, color: '#fff', fontWeight: 600, marginTop: 2 }}>{f.properties?.codeName}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{f.properties?.solutionName}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
              ทั้งหมด {Number(f.properties?.totalCameras).toLocaleString()} กล้อง
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 3, fontSize: 11, fontWeight: 600 }}>
              <span style={{ color: '#66AEFF' }}>● ออนไลน์ {Number(f.properties?.onlineCount ?? 0).toLocaleString()}</span>
              <span style={{ color: '#E94C4C' }}>● ออฟไลน์ {Number(f.properties?.offlineCount ?? 0).toLocaleString()}</span>
            </div>
            {f.properties?.solutionId != null && (
              <div>
                <PopupDetailLink
                  url={`/admin/cctv/detail/${f.properties?.solutionId}?dept_id=${navDeptId}`}
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
