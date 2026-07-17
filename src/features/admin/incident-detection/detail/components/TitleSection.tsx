"use client"
import React, { useMemo } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import DetailTitleSection from '@/components/section/DetailTitleSection'
import { useAppDispatch } from '@/stores/hooks'
import { setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'
import {
  useIncidentCentralList,
  useIncidentSolutionCameras,
  useIncidentCameraTotals,
  useIncidentSolutionDetail,
} from '@/hooks/queries/incident-detection'
import { useDeptId } from '@/hooks/useDeptId'

interface Props {
  currentTab: string
  setCurrentTab: (value: string) => void
}

const OPTIONS = [
  { label: 'ภาพรวม', value: 'OVERALL' },
  { label: 'รายงานเหตุการณ์', value: 'EVENTS' },
]

/** Detail header — mirrors the traffic-signal detail header (same layout +
 *  buttons). Data sources:
 *  - road code / warranty: `/overview/central/list` (overall table source).
 *  - install point name: `/manage/solution/details/{id}` solution_name (with
 *    central-list as fallback).
 *  - anydesk + coord: `/manage/solution/details/{id}`.
 *  - online indicator: `/cameras/totals` (live).
 *
 *  Falling back to central/list for road/warranty keeps the header working even
 *  for "Analytic :"-prefixed solutions, where the `/cameras*` endpoints return
 *  0 despite the cameras existing (BE bug — see memory). */
const TitleSection: React.FC<Props> = ({ currentTab, setCurrentTab }) => {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()
  const deptId = useDeptId()
  const solutionId = Array.isArray(params.id) ? params.id[0] : params.id

  const { data: central } = useIncidentCentralList(deptId)
  const { data: totals } = useIncidentCameraTotals(deptId, { solution_id: solutionId })
  const { data: solutionDetail } = useIncidentSolutionDetail(solutionId)
  // Same cache as MapSection — only fetches the geometry needed by the map.
  // We only read its centroid as a fallback for the Google Map button.
  const { data: camerasGeo } = useIncidentSolutionCameras(deptId, solutionId)

  // Find this solution inside the bureau → แขวง → solutions tree.
  const solution = useMemo(() => {
    if (!solutionId || !central) return null
    const target = String(solutionId)
    for (const bureau of central) {
      for (const sub of bureau.sub_department) {
        for (const sol of sub.solutions) {
          if (String(sol.solution.id) === target) return sol
        }
      }
    }
    return null
  }, [central, solutionId])

  const roadCode = solution?.road.code_name ?? '-'
  // Prefer /manage's solution_name (authoritative canonical name) — falls back
  // to central/list while /manage is loading or fails.
  const installPoint =
    solutionDetail?.solution_name ?? solution?.solution.solution_name ?? '-'
  const isInWarranty = solution?.is_warranty ?? false
  const onlineCount =
    totals?.camera.online ??
    solution?.camera.online_count ??
    (solution
      ? (solution.camera.total ?? 0) - (solution.camera.offline_count ?? 0)
      : 0)
  const isOnline = onlineCount > 0

  // Anydesk: undefined while loading → button hidden by `disabled` style;
  //          '' loaded-but-unset → muted "-" placeholder;
  //          value → shown verbatim.
  const anydeskId = solutionDetail?.anydesk

  // URL params take precedence (so deep-links keep working), but fall back to
  // central/list's lookup for the same solution. Lets the Project Info modal
  // open with real data even when the user navigates directly to /detail/{id}
  // without project_id / road_id in the URL.
  const projectIdParam =
    searchParams.get('project_id') ?? (solution ? String(solution.project.id) : null)
  const roadIdParam =
    searchParams.get('road_id') ?? (solution ? String(solution.road.id) : null)

  // Coord priority: /manage geometry (canonical) → cameras endpoint centroid →
  // first camera with a coord → null (disable button).
  const coord: [number, number] | null = useMemo(() => {
    const fromSolution = solutionDetail?.geometry_point
    if (fromSolution && Array.isArray(fromSolution) && fromSolution.length === 2) {
      return fromSolution as [number, number]
    }
    if (camerasGeo?.centroid) return camerasGeo.centroid
    const fc = camerasGeo?.cameras?.find((c) => Array.isArray(c.geometry_point))
    return (fc?.geometry_point as [number, number] | undefined) ?? null
  }, [solutionDetail?.geometry_point, camerasGeo])

  return (
    <DetailTitleSection
      feature='Incident Detection'
      roadCode={roadCode}
      installPoint={installPoint}
      onBack={() => router.back()}
      onInfo={() =>
        dispatch(
          setProjectInfoModalOpen({
            open: true,
            project_id: projectIdParam ? Number(projectIdParam) : null,
            road_id: roadIdParam ? Number(roadIdParam) : null,
          }),
        )
      }
      warranty={{
        label: isInWarranty ? 'ในค้ำ' : 'หมดค้ำ',
        color: isInWarranty ? '#05F2DB' : '#979797',
      }}
      googleMap={{ coord, keepWhenEmpty: true }}
      anydesk={{ id: anydeskId ? String(anydeskId) : undefined }}
      online={{ isOnline }}
      tabs={{
        options: OPTIONS,
        defaultActive: 'OVERALL',
        activeValue: currentTab,
        onChange: setCurrentTab,
      }}
    />
  )
}

export default React.memo<Props>(TitleSection)
