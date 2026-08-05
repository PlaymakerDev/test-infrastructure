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
import { useLPRPoints } from '@/hooks/queries/lpr'
import { useDeptId } from '@/hooks/useDeptId'
import { scopeQuerySuffix } from '@/services/routes/scopeParam'

interface Props {
  deptId?: string | string[] | number
}

/** Overview map — one marker per LPR install-point, rendered with the shared
 *  `DeviceMarkerLayer` (menu glyph + SYSTEMS color + clustering) and the same
 *  dark popup + ดูเพิ่มเติม button as every other overall map (mirrors
 *  incident-detection's MapSection — replaced the hand-rolled teardrop pins
 *  with native `title` tooltips, 2026-07-20). */
const MapSection: React.FC<Props> = ({ deptId: deptIdProp }) => {
  const router = useRouter()
  const deptIdFromUrl = useDeptId()
  const deptId = String(deptIdProp ?? deptIdFromUrl ?? '0')
  const { data: points } = useLPRPoints()

  // Filter by department when a specific dept is selected. dept_id=0 means
  // system-wide, so no client-side filter. A non-finite coord would make
  // Mapbox reject the whole GeoJSON source, so those rows are dropped here.
  const visible = useMemo(() => {
    const all = (points ?? []).filter(
      (p) => Number.isFinite(p.lng) && Number.isFinite(p.lat),
    )
    if (!deptId || deptId === '0') return all
    const target = Number(deptId)
    return all.filter((p) => p.department_id === target)
  }, [points, deptId])

  const coords = useMemo<[number, number][]>(
    () => visible.map((p) => [p.lng, p.lat]),
    [visible],
  )

  const data = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: visible.map((p) => ({
        type: 'Feature' as const,
        properties: {
          solutionId: p.solution_id,
          codeName: p.road_code ?? '',
          solutionName: p.solution_name,
          cameraCount: p.camera_count,
          eventsToday: p.events_today,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [p.lng, p.lat] as [number, number],
        },
      })),
    }),
    [visible],
  )

  return (
    <BaseMap initialZoom={5.4} edgeFade={{ left: 10, right: 10, top: 10, bottom: 10 }}>
      <FitBoundsEffect coords={coords} padding={56} maxZoom={12} />
      <ThailandMaskLayer maskColor='#212121' maskOpacity={1} />
      <RegionSummaryLayer type='LPR' />
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
          <div style={{ padding: '8px 10px', background: 'rgba(5,13,26,0.96)', borderRadius: 8, border: `1px solid ${SYSTEM_BRIGHT.LPR}`, minWidth: 170 }}>
            <div style={{ fontSize: 10, color: SYSTEM_BRIGHT.LPR, fontWeight: 700 }}>LPR</div>
            <div style={{ fontSize: "var(--fs-12)", color: '#fff', fontWeight: 600, marginTop: 2 }}>{f.properties?.codeName || '-'}</div>
            <div style={{ fontSize: "var(--fs-12)", color: '#94a3b8', marginTop: 2 }}>{f.properties?.solutionName}</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: "var(--fs-12)", fontWeight: 600 }}>
              <span style={{ color: '#66AEFF' }}>กล้อง {Number(f.properties?.cameraCount ?? 0).toLocaleString()}</span>
              <span style={{ color: '#FCD116' }}>วันนี้ {Number(f.properties?.eventsToday ?? 0).toLocaleString()}</span>
            </div>
            {f.properties?.solutionId != null && (
              <div>
                <PopupDetailLink
                  url={`/admin/lpr/detail/${f.properties?.solutionId}?dept_id=${deptId}${scopeQuerySuffix()}`}
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
