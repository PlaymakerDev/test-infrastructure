"use client"
import React from 'react'
import { useSearchParams } from 'next/navigation'
import { TitleSection, OverallSection } from '../components'
import { CCTVProvider } from '../context'
import { ProjectInfoModal } from '@/components/modal'

const CCTVScreen: React.FC = () => {
  const searchParams = useSearchParams()
  const deptId = searchParams.get('dept_id')

  return (
    <CCTVProvider>
      <div className='main-screen px-10'>
        <TitleSection />
        <section className='mt-8'>
          <OverallSection deptId={deptId} />
        </section>
      </div>
      {/* Global Project Info modal — opened via Redux from any row's info icon. */}
      <ProjectInfoModal />
    </CCTVProvider>
  )
}

export default React.memo(CCTVScreen)
