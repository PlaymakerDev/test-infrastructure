"use client"
import React from 'react'
import { ProjectInfoModal } from '@/components/modal'
import { TitleSection, OverallSection } from '../components'
import { OverallProvider } from '../context'
import { useSearchParams } from 'next/navigation'

interface Props { }

const BridgeLightingScreen: React.FC<Props> = (props) => {
  const { } = props
  const searchParams = useSearchParams()
  const deptId = searchParams.get('dept_id')
  const roadId = searchParams.get('road_id')

  return (
    <OverallProvider>
      <div className='main-screen px-10'>
        <TitleSection />
        <section className='mt-8 pb-8'>
          <OverallSection
            deptId={deptId!}
            roadId={roadId!}
          />
        </section>
        {/* Shared project-info modal opened by the GRID card ⓘ (Redux-driven). */}
        <ProjectInfoModal />
      </div>
    </OverallProvider>
  )
}

export default React.memo(BridgeLightingScreen)
