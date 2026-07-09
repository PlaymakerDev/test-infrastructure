"use client"
import React, { useMemo } from 'react'
import BaseMap from '@/components/map/BaseMap'
import ThailandMaskLayer from '@/components/map/markers/ThailandMaskLayer'
import DeviceMarkerLayer from '@/components/map/markers/DeviceMarkerLayer'
import FitBoundsEffect from '@/components/map/primitives/FitBoundsEffect'
import PopupDetailLink from '@/components/map/primitives/PopupDetailLink'
import { useIncidentOverview } from '@/hooks/queries/incident-detection'
import { useDeptId } from '@/hooks/useDeptId'
import { useRouter } from 'next/navigation'

interface Props { }

/** Overview map — one marker per analytic solution. Frames all solutions that
 *  have a coordinate (bureau → แขวง → สายทาง) instead of a fixed centroid zoom. */
const MapSection: React.FC<Props> = () => {
  const deptId = useDeptId()
  const { data: overview } = useIncidentOverview(deptId)
  const router = useRouter()

  // Only solutions with a valid [lng, lat]. A feature with `coordinates: null`
  // makes Mapbox reject the whole GeoJSON source (→ no markers render at all).
  const withCoord = useMemo(
    () =>
      (overview?.locations ?? []).filter(
        (l) => Array.isArray(l.geometry_point) && l.geometry_point.length === 2
      ),
    [overview?.locations]
  )

  const coords = useMemo<[number, number][]>(
    () => withCoord.map((l) => l.geometry_point as [number, number]),
    [withCoord]
  )

  const data = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: withCoord.map((l) => ({
        type: 'Feature' as const,
        properties: {
          solutionId: l.solution.id,
          codeName: l.road.code_name,
          solutionName: l.solution.solution_name,
          totalCameras: l.camera.total,
          eventsCount: l.camera.events_count,
        },
        geometry: { type: 'Point' as const, coordinates: l.geometry_point as [number, number] },
      })),
    }),
    [withCoord]
  )

  return (
    <BaseMap initialZoom={5.4} edgeFade={{ left: 10, right: 10, top: 10, bottom: 10 }}>
      <FitBoundsEffect coords={coords} padding={56} maxZoom={12} />
      <ThailandMaskLayer maskColor='#212121' maskOpacity={1} />
      <DeviceMarkerLayer
        type='Analytic'
        id='incident-locations'
        data={data}
        cluster
        size={16}
        strokeColor='#ffffff'
        popupOptions={{ offset: 10, closeButton: false }}
        popup={(f) => (
          <div style={{ padding: '8px 10px', background: 'rgba(5,13,26,0.96)', borderRadius: 8, border: '1px solid #3DD68C', fontFamily: 'ui-sans-serif,system-ui', minWidth: 170 }}>
            <div style={{ fontSize: 10, color: '#3DD68C', fontWeight: 700 }}>Incident Detection</div>
            <div style={{ fontSize: 13, color: '#fff', fontWeight: 600, marginTop: 2 }}>{f.properties?.codeName}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{f.properties?.solutionName}</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: 11, fontWeight: 600 }}>
              <span style={{ color: '#66AEFF' }}>กล้อง {Number(f.properties?.totalCameras ?? 0).toLocaleString()}</span>
              <span style={{ color: '#FF5E00' }}>เหตุการณ์ {Number(f.properties?.eventsCount ?? 0).toLocaleString()}</span>
            </div>
            {f.properties?.solutionId != null && (
              <div>
                <PopupDetailLink
                  url={`/admin/incident-detection/detail/${f.properties?.solutionId}?dept_id=${deptId}`}
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

export default React.memo<Props>(MapSection)
