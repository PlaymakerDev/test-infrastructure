"use client"
import React from 'react'
import { OverallSection, TitleSection } from '../components'
import { OverallProvider } from '../context'
import { ProjectInfoModal } from '@/components/modal'

const IncidentDetectionScreen = () => {
  return (
    <OverallProvider>
      <div className='main-screen px-10'>
        <TitleSection />
        <section className='mt-8'>
          <OverallSection />
        </section>
      </div>
      {/* Global Project Info modal — opened via Redux from any row's ⓘ icon. */}
      <ProjectInfoModal />
    </OverallProvider>
  )
}

export default React.memo(IncidentDetectionScreen)
