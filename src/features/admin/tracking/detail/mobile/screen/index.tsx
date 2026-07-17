import React, { useMemo, useState } from 'react'
import {
  TitleSection,
  OverallSection,
  VehicleSection
} from '../components'
import { MobileProvider } from '../context';

interface Props {
  id: string[] | string | number | undefined;
}

const MobileDetailScreen: React.FC<Props> = (props) => {
  const { id } = props
  const [currentTab, setCurrentTab] = useState('OVERALL')

  const renderContent = useMemo(() => {
    switch (currentTab) {
      case 'OVERALL':
        return <OverallSection id={id} />
      case 'VEHICLE':
        return <VehicleSection id={id} />
      default:
        return <OverallSection id={id} />
    }
  }, [currentTab, id])

  return (
    <MobileProvider>
      <div className='main-screen'>
        <TitleSection setCurrentTab={setCurrentTab} />
        <section className='mt-8 px-8'>
          {renderContent}
        </section>
      </div>
    </MobileProvider>
  )
}

export default React.memo<Props>(MobileDetailScreen)
