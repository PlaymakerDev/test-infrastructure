"use client"
import React from 'react'
import { useSearchParams } from 'next/navigation'
import { TitleSection, OverallSection } from '../components'
import { CCTVModal, ProjectInfoModal } from '@/components/modal'

const SerchCctvScreen: React.FC = () => {
  const searchParams = useSearchParams()
  const deptId = searchParams.get('dept_id')

  return (
    <div className='main-screen'>
      <TitleSection />
      <section className='mt-5 px-10'>
        <OverallSection deptId={deptId} />
      </section>
      {/* Global Project Info modal — opened via Redux from group ⓘ icons. */}
      <ProjectInfoModal />
      {/* Central Live Stream modal — opened via Redux from camera cards. */}
      <CCTVModal />
    </div>
  )
}

export default React.memo(SerchCctvScreen)
