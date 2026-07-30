"use client"
import React from 'react'
import { CCTVModal, ProjectInfoModal } from '@/components/modal'
import {
  OverallSection,
  TitleSection,
} from '../components'
import { useSearchParams } from 'next/navigation'

const CrosswalkScreen = () => {
  const params = useSearchParams()
  const roadId = params.get('road_id')

  return (
    <div className='main-screen px-10'>
      <TitleSection />
      <section className='mt-8 pb-8'>
        <OverallSection
          roadId={roadId}
        />
      </section>
      <ProjectInfoModal />
      <CCTVModal />
    </div>
  )
}

export default React.memo(CrosswalkScreen)
