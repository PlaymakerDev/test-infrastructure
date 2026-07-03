"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { CCTVModal, ProjectInfoModal } from '@/components/modal'
import { useCrosswalkOverview } from '@/hooks/queries/crosswalk'
import { useDeptId } from '@/hooks/useDeptId'
import { useAppDispatch } from '@/stores/hooks'
import {
  resetCCTVModalOpen,
  resetProjectInfoModalOpen,
} from '@/stores/reducers/layout/layoutSlice'
import {
  TitleSection,
  OverallSection,
  ViolationSection,
} from '../components'
import { DetailProvider } from '../context'

interface Props {
  id: string
}

const CrosswalkDetailScreen: React.FC<Props> = ({ id }) => {
  const deptId = useDeptId()
  const dispatch = useAppDispatch()
  const [currentTab, setCurrentTab] = useState('OVERALL')

  // Modal state lives in Redux (persisted across route changes). Reset both
  // on mount so navigating in from the overall page never inherits a stale
  // `open=true` (e.g. the ⓘ modal was left open when the user clicked a
  // detail link) and shows the ProjectInfo modal unprompted.
  useEffect(() => {
    dispatch(resetProjectInfoModalOpen())
    dispatch(resetCCTVModalOpen())
  }, [dispatch])

  // Filter the overview endpoint to this single solution. Cache is shared
  // with the overall page when the user navigated here from there.
  const { data, isLoading } = useCrosswalkOverview(deptId, {
    solution_id: id,
  })
  const location = data?.locations[0] ?? null

  const renderContent = useMemo(() => {
    switch (currentTab) {
      case 'OVERALL':
        return <OverallSection />
      case 'VIOLATION':
        return <ViolationSection />
      default:
        return <OverallSection />
    }
  }, [currentTab])

  if (isLoading && !location) {
    return (
      <div className='main-screen px-10 pt-10 flex items-center justify-center'>
        <div className='flex flex-col items-center gap-3'>
          <div className='w-10 h-10 border-2 border-(--yellow) border-t-transparent rounded-full animate-spin' />
          <p className='text-white/70'>กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  return (
    <DetailProvider id={id} location={location}>
      <div className='main-screen'>
        <TitleSection setCurrentTab={setCurrentTab} />
        <section className='mt-8 px-10'>{renderContent}</section>
        {/* Global Project Info modal — fires when the ⓘ icon in the title
          * bar is clicked. Reads project_id/road_id from URL search params. */}
        <ProjectInfoModal />
        {/* Global CCTV modal — fires when a camera tile/row is clicked.
          * Reads camera_id from Redux (cctv_modal slice). */}
        <CCTVModal />
      </div>
    </DetailProvider>
  )
}

export default React.memo<Props>(CrosswalkDetailScreen)
