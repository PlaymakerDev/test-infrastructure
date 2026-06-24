"use client"
import React, { useMemo, useState } from 'react'
import { TitleSection, OverallSection, EventSection } from '../components'
import { DetailProvider } from '../context'
import { CCTVModal, ProjectInfoModal } from '@/components/modal'

interface Props {
  id?: string | string[]
}

const IncidentDetectionDetailScreen: React.FC<Props> = (props) => {
  const { } = props
  const [currentTab, setCurrentTab] = useState('OVERALL')

  const renderContent = useMemo(() => {
    switch (currentTab) {
      case 'OVERALL': return <OverallSection onShowAllEvents={() => setCurrentTab('EVENTS')} />
      case 'EVENTS': return <EventSection />
      default: return <OverallSection onShowAllEvents={() => setCurrentTab('EVENTS')} />
    }
  }, [currentTab])

  return (
    <DetailProvider>
      <div className='main-screen'>
        <TitleSection currentTab={currentTab} setCurrentTab={setCurrentTab} />
        <section className='mt-8 px-10'>
          {renderContent}
        </section>
        {/* Global Project Info modal — opened from the ⓘ on each camera-table
          * group header (and the title bar once wired). */}
        <ProjectInfoModal />
        {/* Central Live Stream modal — opened (via Redux) from camera cards;
          * fetches /cctv/cameras/{id} so "ประเภทอุปกรณ์" is complete (like VMS). */}
        <CCTVModal />
      </div>
    </DetailProvider>
  )
}

export default React.memo<Props>(IncidentDetectionDetailScreen)
