"use client"
import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DetailTitleSection from '@/components/section/DetailTitleSection'
import { useAppDispatch } from '@/stores/hooks'
import { setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'
import {
  useCrosswalkCentralList,
  useCrosswalkSolutionDetail,
} from '@/hooks/queries/crosswalk'
import { useDeptId } from '@/hooks/useDeptId'
import { useDetailContext } from '../context'

interface Props {
  setCurrentTab: (value: string) => void
}

const OPTIONS = [
  { label: 'ภาพรวม', value: 'OVERALL' },
  { label: 'ข้อมูลการฝ่าฝืนสัญญาณไฟทางข้าม', value: 'VIOLATION' },
]

const TitleSection: React.FC<Props> = ({ setCurrentTab }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()
  const deptId = useDeptId()
  const { id, location } = useDetailContext()

  // `crosswalk.is_online` = ทางข้ามอุปกรณ์ health (NOT the camera's online state).
  const { data: centralData } = useCrosswalkCentralList(deptId)
  const match = (centralData ?? [])
    .flatMap((bureau) => bureau.sub_department ?? [])
    .flatMap((subDept) => subDept.solutions ?? [])
    .find((sol) => String(sol.solution.id) === String(id))

  // project_id + road_id for the Project Info modal. URL params take precedence
  // (deep-links keep working), but fall back to the central-list match so the
  // modal opens with full data when the URL only has ?dept_id= — same
  // self-derive pattern as the other detail pages (cctv / incident / …).
  const projectIdParam =
    searchParams.get('project_id') ?? (match ? String(match.project.id) : null)
  const roadIdParam =
    searchParams.get('road_id') ?? (match ? String(match.road.id) : null)
  const status = match
    ? { isOnline: match.crosswalk.is_online, isWarranty: match.is_warranty }
    : null

  // AnyDesk lives on the shared `/manage/solution/details/{id}` endpoint.
  const { data: solDetail } = useCrosswalkSolutionDetail(id)
  const anydeskId: string | undefined =
    solDetail?.anydesk == null ? undefined : String(solDetail.anydesk)

  const isOnline = status?.isOnline ?? false
  const isInWarranty = status?.isWarranty ?? false

  const roadCode = location?.road.code_name ?? '-'
  const installPoint = location?.solution.solution_name ?? '-'
  const coord = location?.GeometryPoint ?? null

  return (
    <DetailTitleSection
      feature='Crosswalk'
      roadCode={roadCode}
      installPoint={installPoint}
      onBack={() => router.back()}
      onInfo={() =>
        dispatch(
          setProjectInfoModalOpen({
            open: true,
            project_id: projectIdParam ? Number(projectIdParam) : null,
            road_id: roadIdParam ? Number(roadIdParam) : null,
          })
        )
      }
      warranty={{
        label: isInWarranty ? 'ในค้ำ' : 'หมดค้ำ',
        color: isInWarranty ? '#05F2DB' : '#979797',
      }}
      googleMap={{ coord }}
      anydesk={{ id: anydeskId }}
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
