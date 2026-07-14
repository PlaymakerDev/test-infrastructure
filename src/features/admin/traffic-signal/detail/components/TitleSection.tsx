"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import DetailTitleSection from '@/components/section/DetailTitleSection'
import { useAppDispatch } from '@/stores/hooks'
import { setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { useDetailContext } from '../context'

interface Props {
  setCurrentTab: (value: string) => void
}

const OPTIONS = [
  { label: 'ภาพรวม', value: 'OVERALL' },
  { label: 'สรุปข้อมูลแยกจราจร', value: 'SUMMARY' },
]

// Same color map as ProjectInfoModal — keeps the warranty pill consistent
// across the detail header + the modal + the overall tables.
const WARRANTY_COLOR: Record<string, string> = {
  ในค้ำ: '#05F2DB',
  หมดค้ำ: '#979797',
  ก่อนค้ำ: '#FCD116',
}

const TitleSection: React.FC<Props> = ({ setCurrentTab }) => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { project } = useDetailContext()
  const isOnline = project.connection === 'online'
  // BE-driven Thai status (3 values). Fall back to the boolean when contract
  // data hasn't loaded yet, so the pill still renders something sensible.
  const warrantyLabel: string =
    project.warrantyStatus ?? (project.warranty === 'in-warranty' ? 'ในค้ำ' : 'หมดค้ำ')
  const warrantyColor = WARRANTY_COLOR[warrantyLabel] ?? '#979797'
  // project_id + road_id come from the screen's resolver (URL param → else
  // derived from central list by solution id), so the Project Info modal works
  // whether the user arrives from the overall table or the dashboard popup.

  return (
    <DetailTitleSection
      feature='Traffic Signal'
      roadCode={project.roadCode}
      installPoint={project.installPoint}
      onBack={() => router.back()}
      onInfo={() =>
        dispatch(
          setProjectInfoModalOpen({
            open: true,
            project_id: project.projectId ? Number(project.projectId) : null,
            road_id: project.roadId ? Number(project.roadId) : null,
          }),
        )
      }
      warranty={{ label: warrantyLabel, color: warrantyColor }}
      googleMap={{ coord: project.coord }}
      anydesk={{ id: project.anydeskId }}
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
