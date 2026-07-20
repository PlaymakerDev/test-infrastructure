"use client"
import React, { useMemo, useState } from 'react'
import {
  TitleSection,
  LPRSection,
  LicenseSection
} from '../components'
import { OverallProvider } from '../context'
import { ProjectInfoModal } from '@/components/modal'

const LPRScreen = () => {
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
    <OverallProvider>
      <div className='main-screen'>
        <TitleSection setCurrentTab={setCurrentTab} />
        <section className='mt-8'>
          {renderContent}
        </section>
        {/* Global Project Info modal — opened via Redux from the table's
          * ContractInfoCell ⓘ and the grid cards' info icon. Mounted once per
          * screen, same as every other overall screen. */}
        <ProjectInfoModal />
      </div>
    </OverallProvider>
  )
}

export default React.memo(LPRScreen)
