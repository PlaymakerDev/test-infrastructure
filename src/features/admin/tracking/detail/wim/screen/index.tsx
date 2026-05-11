import React, { useMemo, useState } from 'react'
import {
  TitleSection,
  OverallSection,
  VehicleSection
} from '../components'
import { WIMProvider } from '../context';

interface Props {
  id: string[] | string | number | undefined;
}

const WIMDetailScreen: React.FC<Props> = (props) => {
  const { } = props
  const [currentTab, setCurrentTab] = useState('OVERALL')

  const renderContent = useMemo(() => {
    switch (currentTab) {
      case 'OVERALL':
        return <OverallSection />
      case 'VEHICLE':
        return <VehicleSection />
      case 'CCTV':
        return <p>CCTV</p>
      default:
        return <OverallSection />
    }
  }, [currentTab])

  return (
    <WIMProvider>
      <div className='main-screen'>
        <TitleSection setCurrentTab={setCurrentTab} />
        <section className='mt-8 px-10'>
          {renderContent}
        </section>
      </div>
    </WIMProvider>
  )
}

export default React.memo<Props>(WIMDetailScreen)
