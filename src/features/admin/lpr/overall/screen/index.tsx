"use client"
import React, { useMemo, useState } from 'react'
import {
  TitleSection,
  LPRSection,
  LicenseSection
} from '../components'
import { OverallProvider } from '../context'
import { CCTVModal, ProjectInfoModal } from '@/components/modal'

const LPRContent = () => {
  const [currentTab, setCurrentTab] = useState('LPR')

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
    <div className='main-screen'>
      <TitleSection setCurrentTab={setCurrentTab} />
      <section className='mt-8'>
        {renderContent}
      </section>
      <ProjectInfoModal />
      <CCTVModal />
    </div>
  )
}

const LPRScreen = () => {

  return (
    <OverallProvider>
      <LPRContent />
      <ProjectInfoModal />
      <CCTVModal />
    </OverallProvider>
  )
}

export default React.memo(LPRScreen)
