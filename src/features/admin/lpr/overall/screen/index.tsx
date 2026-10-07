"use client"
import React, { useEffect, useMemo, useState } from 'react'
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
  const wantsLicenseTab = searchParams.get('tab') === 'LICENSE'
  // `?tab=LICENSE` is a ONE-SHOT deep link into the plate-search tab — only the
  // detail page's "ดูประวัติการเดินทาง" (TableTop5DetectionData.handleViewHistory)
  // sets it. Anything else opens the overview.
  const [currentTab, setCurrentTab] = useState(() => wantsLicenseTab ? 'LICENSE' : 'LPR')

  // Consume the deep link: drop `tab` from THIS history entry once the tab has
  // been picked. Left in the URL, every later arrival at the entry — router.back()
  // from a detail page, browser back/forward — re-mounts the screen, re-reads
  // `tab=LICENSE` and reopens the license tab even after the user had switched
  // to LPR. replaceState (Next syncs it into useSearchParams) rather than
  // router.replace, which would fire a navigation for a URL-only cleanup.
  useEffect(() => {
    if (!wantsLicenseTab) return
    const params = new URLSearchParams(window.location.search)
    params.delete('tab')
    const qs = params.toString()
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`,
    )
  }, [wantsLicenseTab])

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
