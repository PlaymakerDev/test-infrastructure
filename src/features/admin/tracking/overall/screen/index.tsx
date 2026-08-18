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
import { useUserRole } from '@/hooks/useUserRole'
import { Spin } from 'antd'

const TrackingScreenContent = () => {
  const { currentTab } = useOverallContext()
  // Tab visibility is role-driven, and on a hard load the role arrives one tick
  // after mount (AuthHydrator). Rendering the default tab in that window would
  // fire the overview queries for a contractor who may only have WIM — so
  // hold the content area until the role is known. The context clamps
  // `currentTab` itself, this just avoids the pre-clamp render.
  const { isResolved } = useUserRole()

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
        {isResolved ? renderContent : (
          <div className='flex justify-center py-20'>
            <Spin size='large' />
          </div>
        )}
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
