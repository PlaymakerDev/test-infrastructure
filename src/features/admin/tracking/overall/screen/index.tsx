"use client"
import React, { useEffect, useMemo, useState } from 'react'
import {
  TitleSection,
  OverallSection,
  StationSection,
  WIMSection,
  MobileSection,
  GPSSection,
  LicenseSection
} from '../components'
import { useRouter } from 'next/navigation'
import { OverallProvider } from '../context'

const TrackingScreen = () => {
  const [currentTab, setCurrentTab] = useState('OVERALL')
  const router = useRouter()

  useEffect(() => {
    if (currentTab === 'TRACK_GPS') router.push('/admin/tracking/detail/gps')
    if (currentTab === 'LICENSE') router.push('/admin/tracking/detail/license')
  }, [currentTab, router])

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
      case 'TRACK_GPS':
        return <GPSSection />
      case 'LICENSE':
        return <LicenseSection />
      default:
        return <OverallSection />
    }
  }, [currentTab])

  return (
    <OverallProvider>
      <div className='main-screen px-10'>
        <TitleSection setCurrentTab={setCurrentTab} />
        <section className='mt-8'>
          {renderContent}
        </section>
      </div>
    </OverallProvider>
  )
}

export default React.memo(TrackingScreen)
