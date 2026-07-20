"use client"
import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import BaseMap from '@/components/map/BaseMap'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import FitBoundsEffect from '@/components/map/primitives/FitBoundsEffect'
import { WhiteTeardropPin } from '@/components/map/markers/OverlapMarkers'
import { useLPRPoints } from '@/hooks/queries/lpr'
import { useDeptId } from '@/hooks/useDeptId'
import { scopeQuerySuffix } from '@/services/routes/scopeParam'

// Country-view fallback — sits over central Thailand until the fitBounds
// effect kicks in after the points fetch resolves.
const FALLBACK_CENTER: [number, number] = [100.5, 13.75]

interface Props {
  deptId?: string | string[] | number
}

const MapSection: React.FC<Props> = ({ deptId: deptIdProp }) => {
  const router = useRouter()
  const deptIdFromUrl = useDeptId()
  const deptId = String(deptIdProp ?? deptIdFromUrl ?? '0')
  const { data: points } = useLPRPoints()

  // Filter by department when a specific dept is selected. dept_id=0 means
  // system-wide, so no client-side filter — the API returns all 14 install
  // points and we render them all.
  const visible = useMemo(() => {
    if (!points) return []
    if (!deptId || deptId === '0') return points
    const target = Number(deptId)
    return points.filter((p) => p.department_id === target)
  }, [points, deptId])

  const coords = useMemo(
    () => visible.map((p) => [p.lng, p.lat] as [number, number]),
    [visible],
  )

  return (
    <div className="relative w-full h-full">
      <BaseMap
        initialCenter={FALLBACK_CENTER}
        initialZoom={5.5}
        edgeFade={{ left: 10, right: 10, top: 10, bottom: 10 }}
      >
        {visible.map((p) => (
          <HTMLMarker
            key={p.solution_id}
            lngLat={[p.lng, p.lat]}
            anchor="bottom"
            title={`${p.solution_name}\n${p.road_code ?? ''} · ${p.camera_count} กล้อง\nวันนี้ ${p.events_today.toLocaleString('th-TH')} ครั้ง · ชั่วโมงล่าสุด ${p.events_hour.toLocaleString('th-TH')}`}
            onClick={() =>
              router.push(
                `/admin/lpr/detail/${p.solution_id}?dept_id=${deptId}${scopeQuerySuffix()}`,
              )
            }
          >
            <WhiteTeardropPin color={p.events_hour > 0 ? '#FCD116' : undefined} />
          </HTMLMarker>
        ))}
        {coords.length > 0 && (
          <FitBoundsEffect
            coords={coords}
            maxZoom={11}
            pitch={0}
            padding={{ top: 60, bottom: 60, left: 60, right: 60 }}
          />
        )}
      </BaseMap>
    </div>
  )
}

export default React.memo<Props>(MapSection)
