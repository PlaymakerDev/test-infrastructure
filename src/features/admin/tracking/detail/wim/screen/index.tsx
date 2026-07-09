import React, { useMemo, useState } from 'react'
import {
  TitleSection,
  OverallSection,
  VehicleSection
} from '../components'
import { useSearchParams } from 'next/navigation';

interface Props {
  id: string[] | string | number | undefined;
}

const WIMDetailScreen: React.FC<Props> = (props) => {
  const { id } = props
  const [currentTab, setCurrentTab] = useState('OVERALL')
  const searchParams = useSearchParams()
  const stationType = searchParams.get('station_type')

  const renderContent = useMemo(() => {
    switch (currentTab) {
      case 'OVERALL':
        return <OverallSection id={id} stationType={stationType} />
      case 'VEHICLE':
        return <VehicleSection />
      case 'CCTV':
        return <p>CCTV</p>
      default:
        return <OverallSection id={id} stationType={stationType} />
    }
  }, [currentTab, id, stationType])

  return (
    <div className='main-screen'>
      <TitleSection
        id={id}
        stationType={stationType}
        setCurrentTab={setCurrentTab}
      />
      <section className='mt-8 px-10'>
        {renderContent}
      </section>
    </div>
  )
}

export default React.memo<Props>(WIMDetailScreen)
