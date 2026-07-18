"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import DetailTitleSection from '@/components/section/DetailTitleSection'
import { APIResponseBridgeLightingOverview } from '@/types/bridge-lighting/overall-api'
import { useAppDispatch } from '@/stores/hooks'
import { setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { useQuery } from '@tanstack/react-query'
import { getTrafficSolutionDetailAPI } from '@/services/routes/TrafficSignalService'

interface Props {
  data?: APIResponseBridgeLightingOverview
  isWarranty?: string | null
  projectId?: string | string[] | null
}

const TitleSection: React.FC<Props> = (props) => {
  const { data, isWarranty, projectId } = props
  const router = useRouter()
  // Optional chain the array access too — `data?.locations[0]` still throws
  // if `locations` itself is null (only the `data` layer is guarded by `?.`),
  // which is the real API shape returned when the detail scope resolves to
  // zero solutions. `?.[0]` short-circuits cleanly.
  const location = data?.locations?.[0]
  const dispatch = useAppDispatch()

  // Pull AnyDesk id from the shared /manage/solution/details/{id} endpoint —
  // the same one traffic-signal / incident-detection / crosswalk / VMS use.
  // Prior version had `anydesk={{ id: '' }}` hard-coded → button was always
  // disabled on every bridge-lighting project even though tbl_solution.anydesk
  // is populated (verified 5 rows non-null on 2026-07-18).
  const solutionId = location?.solution.id
  const { data: solutionDetail } = useQuery({
    queryKey: ['bridge_lighting_solution_detail', solutionId] as const,
    queryFn: () => getTrafficSolutionDetailAPI(solutionId!).then((r) => r.data),
    enabled: !!solutionId,
  })
  const anydeskId = solutionDetail?.anydesk

  const isInWarranty = isWarranty === 'true' ? true : false
  const isOnline = location?.is_online ? true : false

  return (
    <DetailTitleSection
      feature='BridgeLighting'
      roadCode={location?.road.code_name || '-'}
      installPoint={location?.solution.solution_name || '-'}
      onInfo={() =>
        dispatch(
          setProjectInfoModalOpen({
            open: true,
            project_id: projectId ?? null,
            road_id: location?.road.id ?? null,
          }),
        )
      }
      onBack={() => router.back()}
      warranty={{
        label: isInWarranty ? 'ในค้ำ' : 'หมดค้ำ',
        color: isInWarranty ? '#05F2DB' : '#979797',
      }}
      googleMap={{ coord: [Number(location?.geometry_point?.[0]), Number(location?.geometry_point?.[1])] }}
      anydesk={{ id: anydeskId ? String(anydeskId) : undefined }}
      online={{
        isOnline: isOnline
      }}
    />
  )
}

export default React.memo<Props>(TitleSection)
