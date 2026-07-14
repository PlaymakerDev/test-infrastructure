"use client"
import React from 'react'
import { CCTVModal, ProjectInfoModal } from '@/components/modal'
import {
  OverallSection,
  TitleSection,
} from '../components'

const CrosswalkScreen = () => {
  return (
    <div className='main-screen px-10'>
      <TitleSection />
      <section className='mt-8 pb-8'>
        <OverallSection />
      </section>
      <ProjectInfoModal />
      <CCTVModal />
    </div>
  )
}

export default React.memo(CrosswalkScreen)
