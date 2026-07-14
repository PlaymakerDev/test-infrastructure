"use client"
import React, { useMemo, useState } from 'react'
import { CCTVModal, ProjectInfoModal } from '@/components/modal'
import { useTrafficVolumeOverview } from '@/hooks/queries/traffic-volume'
import { useDeptId } from '@/hooks/useDeptId'
import { DetailProvider } from '../context'
import {
  TitleSection,
  OverallSection,
  AnalyticVolumeSection,
  StatHourVolumeSection,
  ReportVolumeSection,
} from '../components'

interface Props {
  id: string
}

const ScreenDetailTrafficVolume: React.FC<Props> = ({ id }) => {
  const deptId = useDeptId()
  const [currentTab, setCurrentTab] = useState('OVERALL')

  // Filter the overview endpoint to this single solution. Cache is shared
  // with the overall page when the user navigated here from there.
  const { data, isLoading } = useTrafficVolumeOverview(deptId, {
    solution_id: id,
  })
  const location = data?.locations[0] ?? null

  const renderContent = useMemo(() => {
    switch (currentTab) {
      case 'OVERALL':
        return <OverallSection />
      case 'ANALYTIC':
        return <AnalyticVolumeSection />
      case 'STAT_HOUR':
        return <StatHourVolumeSection />
      case 'REPORT':
        return <ReportVolumeSection />
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
        <section className='mt-8 px-10 pb-8'>{renderContent}</section>
        {/* Global Project Info modal — fires when the ⓘ icon in the title
          * bar is clicked. Reads project_id/road_id from URL search params. */}
        <ProjectInfoModal />
        {/* Global CCTV modal — fires when a camera tile/row in the cameras
          * grid is clicked. Reads camera_id from Redux (cctv_modal slice). */}
        <CCTVModal />
      </div>
    </DetailProvider>
  )
}

export default React.memo<Props>(ScreenDetailTrafficVolume)
