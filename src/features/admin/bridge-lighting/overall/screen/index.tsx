"use client"
import React from 'react'
import { ProjectInfoModal } from '@/components/modal'
import { TitleSection, OverallSection } from '../components'
import { OverallProvider } from '../context'

const BridgeLightingScreen: React.FC = () => {
  return (
    <OverallProvider>
      <div className='main-screen px-10'>
        <TitleSection />
        <section className='mt-8 pb-8'>
          <OverallSection />
        </section>
        {/* Shared project-info modal opened by the GRID card ⓘ (Redux-driven). */}
        <ProjectInfoModal />
      </div>
    </OverallProvider>
  )
}

export default React.memo(BridgeLightingScreen)
