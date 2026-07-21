"use client"
import React, { useMemo } from 'react'
import {
  TitleSection,
  OverallSection,
  StationSection,
  WIMSection,
  MobileSection,
  ModalCCTVData,
} from '../components'
import { OverallProvider, useOverallContext } from '../context'

const TrackingScreenContent = () => {
  const { currentTab } = useOverallContext()

  const renderContent = useMemo(() => {
    switch (currentTab) {
      case 'OVERALL':
        return <OverallSection />
      case 'STATION':
        return <StationSection />
      case 'WIM':
        return <WIMSection />
      case 'MOBILE':
        return <MobileSection />
      default:
        return <OverallSection />
    }
  }, [currentTab])

  return (
    <div className='main-screen px-10'>
      <TitleSection />
      <section className='mt-8 pb-8'>
        {renderContent}
      </section>
    </div>
  )
}

const TrackingScreen = () => {
  return (
    <OverallProvider>
      <TrackingScreenContent />
      <ModalCCTVData />
    </OverallProvider>
  )
}

export default React.memo(TrackingScreen)
