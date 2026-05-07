import React, { useMemo, useState } from 'react'
import {
  TitleSection,
  OverallSection,
  VehicleSection
} from '../components'

interface Props {
  id: string[] | string | number | undefined;
}

const MobileDetailScreen: React.FC<Props> = (props) => {
  const { } = props
  const [currentTab, setCurrentTab] = useState('OVERALL')

  const renderContent = useMemo(() => {
    switch (currentTab) {
      case 'OVERALL':
        return <OverallSection />
      case 'VEHICLE':
        return <VehicleSection />
      default:
        return <OverallSection />
    }
  }, [currentTab])
  return (
    <div className='main-screen'>
      <TitleSection setCurrentTab={setCurrentTab} />
      <section className='mt-8 px-10'>
        {renderContent}
      </section>
    </div>
  )
}

export default React.memo<Props>(MobileDetailScreen)
