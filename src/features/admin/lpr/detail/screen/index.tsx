"use client"
import React, { useMemo, useState } from 'react'
import { TitleSection, OverallSection, NewOverallSection, ModalLicenseDetail, NewDetectionSection } from '../components'
import { DetailProvider, useLPRDetailContext, type LPRDetailTab } from '../context'
import { CCTVModal, ProjectInfoModal } from '@/components/modal'

const LPRDetailContent = () => {
  const { currentTab, setCurrentTab } = useLPRDetailContext()

  const content = useMemo(() => {
    switch (currentTab) {
      case 'OVERALL':
        // return <OverallSection onShowAllDetections={() => setCurrentTab('DETECTIONS')} />
        return <NewOverallSection />
      case 'DETECTIONS':
        // return <DetectionSection />
        return <NewDetectionSection />
      default:
        return <OverallSection onShowAllDetections={() => setCurrentTab('DETECTIONS')} />
    }
  }, [currentTab, setCurrentTab])

  return (
    <div className='main-screen'>
      <TitleSection />
      <section className='mt-8 px-10 pb-8'>
        {content}
      </section>
    </div>
  )
}

const LPRDetailScreen = () => {
  // Owned here (above DetailProvider) and handed in as props so the provider
  // can expose it via context — any section nested under it can then read
  // or switch tabs without prop-drilling through LPRDetailContent.
  const [currentTab, setCurrentTab] = useState<LPRDetailTab>('OVERALL')

  return (
    <DetailProvider currentTab={currentTab} setCurrentTab={setCurrentTab}>
      <LPRDetailContent />
      <ProjectInfoModal />
      <CCTVModal />
      <ModalLicenseDetail />
    </DetailProvider>
  )
}

export default React.memo(LPRDetailScreen)
