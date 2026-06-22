"use client"
import React from 'react'
import { ProjectInfoModal } from '@/components/modal'
import { TitleSection, OverallSection } from '../components'

const ScreenOverallTrafficSignal = () => {
  return (
    <div className='main-screen px-10'>
      <TitleSection />
      <section className='mt-8'>
        <OverallSection />
      </section>
      {/* Single global Project Info modal — triggered via Redux from any
        * row's info icon. Rendered once here so we don't mount duplicates. */}
      <ProjectInfoModal />
    </div>
  )
}

export default React.memo(ScreenOverallTrafficSignal)
