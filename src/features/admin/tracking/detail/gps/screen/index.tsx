import React, { useMemo, useState } from 'react'
import {
  TitleSection,
  OverallSection,
  VehicleSection,
  SummarySection
} from '../components'
import { GPSProvider } from '../context'

interface Props {

}

const GPSDetailScreen: React.FC<Props> = (props) => {
  const { } = props
  const [currentTab, setCurrentTab] = useState('OVERALL')

  const renderContent = useMemo(() => {
    switch (currentTab) {
      case 'OVERALL':
        return <OverallSection />
      case 'VEHICLE':
        return <VehicleSection />
      case 'SUMMARY':
        return <SummarySection />
      default:
        return <OverallSection />
    }
  }, [currentTab])

  return (
    <GPSProvider>
      <div className='main-screen flex flex-col h-[calc(100vh-var(--nav-offset))]'>
        <TitleSection setCurrentTab={setCurrentTab} />
        <section className='mt-8 flex-1 min-h-0'>
          {renderContent}
        </section>
      </div>
    </GPSProvider>
  )
}

export default React.memo<Props>(GPSDetailScreen)
