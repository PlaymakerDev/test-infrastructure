"use client"
import React, { useMemo, useState } from 'react'
import {
  TitleSection,
  OverallSection,
  StationSection,
  WIMSection,
  MobileSection,
  GPSSection,
  LicenseSection
} from '../components'

interface Props {

}

const TrackingScreen: React.FC<Props> = (props) => {
  const { } = props
  const [currentTab, setCurrentTab] = useState('OVERALL')

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
    <div className='main-screen px-10'>
      <TitleSection setCurrentTab={setCurrentTab} />
      <section className='mt-8'>
        {renderContent}
      </section>
    </div>
  )
}

export default React.memo<Props>(TrackingScreen)
