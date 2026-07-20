"use client"
import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DetailTitleSection from '@/components/section/DetailTitleSection'
import { useAppDispatch } from '@/stores/hooks'
import { setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { useLPRDetailContext } from '../context'

interface Props {
  currentTab: string
  setCurrentTab: (value: string) => void
}

const OPTIONS = [
  { label: 'ภาพรวม', value: 'OVERALL' },
  { label: 'รายการตรวจจับ', value: 'DETECTIONS' },
]

/** Header for the LPR install-point detail page. Reuses `DetailTitleSection`
 *  so tabs / back / info / Google Map behave exactly like the other feature
 *  detail pages (traffic-signal, incident-detection, etc.). */
const TitleSection: React.FC<Props> = ({ currentTab, setCurrentTab }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()
  const { point } = useLPRDetailContext()

  const roadCode = point?.road_code ?? '-'
  const installPoint = point?.solution_name ?? '-'
  const isOnline = (point?.events_hour ?? 0) > 0

  const projectIdParam =
    searchParams.get('project_id') ??
    (point?.project_id != null ? String(point.project_id) : null)
  const roadIdParam =
    searchParams.get('road_id') ??
    (point?.road_id != null ? String(point.road_id) : null)

  const coord: [number, number] | null =
    point && point.lat && point.lng ? [point.lng, point.lat] : null

  return (
    <DetailTitleSection
      feature='LPR'
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
      googleMap={{ coord, keepWhenEmpty: true }}
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
