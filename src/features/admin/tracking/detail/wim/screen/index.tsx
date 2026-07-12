import React, { useMemo } from 'react'
import {
  TitleSection,
  OverallSection,
  VehicleSection
} from '../components'
import { useSearchParams } from 'next/navigation';
import { WIMProvider, useWIMContext } from '../context'

interface Props {
  id: string[] | string | number | undefined;
}

const WIMDetailContent: React.FC = () => {
  const { currentTab } = useWIMContext()

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
    <div className='main-screen'>
      <TitleSection />
      <section className='mt-8 px-8'>
        {renderContent}
      </section>
    </div>
  )
}

const WIMDetailScreen: React.FC<Props> = (props) => {
  const { id } = props
  const searchParams = useSearchParams()
  const stationType = searchParams.get('station_type')

  return (
    <WIMProvider id={id} stationType={stationType}>
      <WIMDetailContent />
    </WIMProvider>
  )
}

export default React.memo<Props>(WIMDetailScreen)
