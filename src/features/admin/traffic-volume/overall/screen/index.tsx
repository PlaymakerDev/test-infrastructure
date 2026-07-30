"use client"
import React from 'react'
import { CCTVModal, ProjectInfoModal } from '@/components/modal'
import { TitleSection, OverallSection } from '../components'
import { useSearchParams } from 'next/navigation'

const ScreenOverallTrafficVolume = () => {
  const searchParams = useSearchParams()
  const roadId = searchParams.get('road_id')

  return (
    <div className='main-screen px-10'>
      <TitleSection />
      <section className='mt-8 pb-8'>
        <OverallSection
          roadId={roadId}
        />
      </section>
      {/* Single global Project Info modal — triggered via Redux from any
        * row's info icon. Rendered once here so we don't mount duplicates. */}
      <ProjectInfoModal />
      {/* Global Live Stream modal — opened via Redux from any camera preview. */}
      <CCTVModal />
    </div>
  )
}

export default React.memo(ScreenOverallTrafficVolume)
