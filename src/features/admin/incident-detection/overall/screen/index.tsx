"use client"
import React from 'react'
import { OverallSection, TitleSection } from '../components'
import { OverallProvider } from '../context'
import { CCTVModal, ProjectInfoModal } from '@/components/modal'
import { useSearchParams } from 'next/navigation'

const IncidentDetectionScreen = () => {
  const searchParams = useSearchParams()
  const roadId = searchParams.get('road_id')

  return (
    <OverallProvider>
      <div className='main-screen px-10'>
        <TitleSection />
        <section className='mt-8 pb-8'>
          <OverallSection
            roadId={roadId}
          />
        </section>
      </div>
      {/* Global Project Info modal — opened via Redux from any row's ⓘ icon. */}
      <ProjectInfoModal />
      {/* Global Live Stream modal — opened via Redux from any camera preview. */}
      <CCTVModal />
    </OverallProvider>
  )
}

export default React.memo(IncidentDetectionScreen)
