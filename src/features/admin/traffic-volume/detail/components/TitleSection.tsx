"use client"
import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DetailTitleSection from '@/components/section/DetailTitleSection'
import { useAppDispatch } from '@/stores/hooks'
import { setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'
import {
  useTrafficVolumeCentralList,
  useTrafficVolumeSolutionDetail,
} from '@/hooks/queries/traffic-volume'
import { useDeptId } from '@/hooks/useDeptId'
import { useDetailContext } from '../context'

interface Props {
  setCurrentTab: (value: string) => void
}

const OPTIONS = [
  { label: 'ภาพรวม', value: 'OVERALL' },
  { label: 'วิเคราะห์ปริมาณจราจร', value: 'ANALYTIC' },
  { label: 'สถิติรายชั่วโมงแยกตามประเภท', value: 'STAT_HOUR' },
  { label: 'รายงานการนับปริมาณจราจร', value: 'REPORT' },
]

const TitleSection: React.FC<Props> = ({ setCurrentTab }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()
  const deptId = useDeptId()
  const { id, location } = useDetailContext()

  // Pull project_id + road_id from the URL — the overall list page passes
  // both when navigating here so the Project Info modal can fetch contract
  // data without needing a dedicated detail endpoint.
  const projectIdParam = searchParams.get('project_id')
  const roadIdParam = searchParams.get('road_id')

  // Warranty + online flags come from the central-list response — cached
  // when the user navigated in from the overall page, so this is free.
  // No useMemo: React Compiler auto-memoizes when `reactCompiler: true`
  // (next.config.ts). Manual useMemo with nested for-loops + early return
  // blocked the compiler ("could not preserve existing memoization").
  const { data: centralData } = useTrafficVolumeCentralList(deptId, {})
  const match = (centralData ?? [])
    .flatMap((bureau) => bureau.sub_department)
    .flatMap((subDept) => subDept.solutions)
    .find((sol) => String(sol.solution.id) === String(id))
  const status = match
    ? { isOnline: match.camera.is_online, isWarranty: match.is_warranty }
    : null

  // project_id + road_id for the Project Info modal: prefer the URL params
  // (passed by the overall table), else DERIVE from the matched central-list
  // row — so arriving from the dashboard marker popup (which has no project_id
  // in the URL) still opens a fully-populated ⓘ modal. Mirrors cctv detail.
  const projectId = projectIdParam ? Number(projectIdParam) : match?.project.id ?? null
  const roadId = roadIdParam ? Number(roadIdParam) : match?.road.id ?? null

  // AnyDesk lives on the shared `/manage/solution/details/{id}` endpoint.
  const { data: solDetail } = useTrafficVolumeSolutionDetail(id)
  // Preserve the empty-string case — title shows a muted "no number set"
  // button so users know AnyDesk is a configurable field for this solution.
  const anydeskId: string | undefined =
    solDetail?.anydesk == null ? undefined : String(solDetail.anydesk)

  const isOnline = status?.isOnline ?? false
  const isInWarranty = status?.isWarranty ?? false

  const roadCode = location?.road.code_name ?? '-'
  const installPoint = location?.solution.solution_name ?? '-'
  const coord = location?.geometry_point ?? null

  return (
    <DetailTitleSection
      feature='Traffic Volume'
      roadCode={roadCode}
      installPoint={installPoint}
      onBack={() => router.back()}
      onInfo={() =>
        dispatch(
          setProjectInfoModalOpen({
            open: true,
            project_id: projectId,
            road_id: roadId,
          })
        )
      }
      warranty={{
        label: isInWarranty ? 'ในค้ำ' : 'หมดค้ำ',
        color: isInWarranty ? '#05F2DB' : '#979797',
      }}
      googleMap={{ coord }}
      anydesk={anydeskId !== undefined ? { id: anydeskId } : undefined}
      online={{ isOnline }}
      tabs={{
        options: OPTIONS,
        defaultActive: 'OVERALL',
        onChange: setCurrentTab,
      }}
    />
  )
}

export default React.memo<Props>(TitleSection)
