"use client"
import React, { useMemo, useState } from 'react'
import { TitleSection, OverallSection, DetectionSection } from '../components'
import { DetailProvider } from '../context'
import { CCTVModal, ProjectInfoModal } from '@/components/modal'

const LPRDetailScreen = () => {
  const [currentTab, setCurrentTab] = useState('OVERALL')

  const content = useMemo(() => {
    switch (currentTab) {
      case 'OVERALL':
        return <OverallSection onShowAllDetections={() => setCurrentTab('DETECTIONS')} />
      case 'DETECTIONS':
        return <DetectionSection />
      default:
        return <OverallSection onShowAllDetections={() => setCurrentTab('DETECTIONS')} />
    }
  }, [currentTab])

  return (
    <DetailProvider>
      <div className='main-screen'>
        <TitleSection currentTab={currentTab} setCurrentTab={setCurrentTab} />
        <section className='mt-8 px-10 pb-8'>{content}</section>
        <ProjectInfoModal />
        <CCTVModal />
      </div>
    </DetailProvider>
  )
}

export default React.memo(LPRDetailScreen)
