"use client"
import React, { useMemo, useState } from 'react'
import {
  TitleSection,
  LPRSection,
  LicenseSection
} from '../components'
import { OverallProvider } from '../context'
import { CCTVModal, ProjectInfoModal } from '@/components/modal'
import { useSearchParams } from 'next/navigation'

const LPRContent = () => {
  const searchParams = useSearchParams()
  // `?tab=LICENSE` deep-links straight into the plate-search tab (e.g. the
  // detail page's "ดูประวัติการเดินทาง"); anything else opens the overview.
  const [currentTab, setCurrentTab] = useState(() => searchParams.get('tab') === 'LICENSE' ? 'LICENSE' : 'LPR')

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
      <TitleSection currentTab={currentTab} setCurrentTab={setCurrentTab} />
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
