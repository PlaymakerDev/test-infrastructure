import React, { useMemo } from 'react'
import {
  TitleSection,
  OverallSection,
  VehicleSection
} from '../components'
import { MobileProvider, useMobileContext } from '../context'

interface Props {
  id: string[] | string | number | undefined;
}

const MobileDetailContent: React.FC = () => {
  const { currentTab } = useMobileContext()

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
      <TitleSection />
      <section className='mt-8 px-8'>
        {renderContent}
      </section>
    </div>
  )
}

const MobileDetailScreen: React.FC<Props> = (props) => {
  const { id } = props

  return (
    <MobileProvider id={id}>
      <MobileDetailContent />
    </MobileProvider>
  )
}

export default React.memo<Props>(MobileDetailScreen)
