import React, { useMemo, useState } from 'react'
import {
  TitleSection,
  OverallSection,
  SummarySection
} from '../components'
import { LicenseProvider } from '../context'

interface Props {
}

const LicenseDetailScreen: React.FC<Props> = (props) => {
  const { } = props
  const [currentTab, setCurrentTab] = useState('OVERALL')

  const renderContent = useMemo(() => {
    switch (currentTab) {
      case 'OVERALL':
        return <OverallSection />
      case 'SUMMARY':
        return <SummarySection />
      default:
        return <OverallSection />
    }
  }, [currentTab])

  return (
    <LicenseProvider>
      <div className='main-screen'>
        <TitleSection setCurrentTab={setCurrentTab} />
        <section className='mt-8'>
          {renderContent}
        </section>
      </div>
    </LicenseProvider>
  )
}

export default React.memo<Props>(LicenseDetailScreen)
