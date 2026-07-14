"use client"
import React, { useMemo, useState } from 'react'
import {
  TitleSection,
  LPRSection,
  LicenseSection
} from '../components'
import { OverallProvider } from '../context'

const LPRScreen = () => {
  const [currentTab, setCurrentTab] = useState('LICENSE')

  const renderContent = useMemo(() => {
    switch (currentTab) {
      case 'LPR':
        return <LPRSection />
      case 'LICENSE':
        return <LicenseSection />
      default:
        return <LPRSection />
    }
  }, [currentTab])

  return (
    <OverallProvider>
      <div className='main-screen'>
        <TitleSection setCurrentTab={setCurrentTab} />
        <section className='mt-8'>
          {renderContent}
        </section>
      </div>
    </OverallProvider>
  )
}

export default React.memo(LPRScreen)
