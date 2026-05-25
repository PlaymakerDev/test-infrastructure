"use client"
import React from 'react'
import { TitleSection, OverallSection } from '../components'
import { CCTVProvider } from '../context'

const CCTVScreen: React.FC = () => {

  return (
    <CCTVProvider>
      <div className='main-screen px-10'>
        <TitleSection />
        <section className='mt-8'>
          <OverallSection />
        </section>
      </div>
    </CCTVProvider>
  )
}

export default React.memo(CCTVScreen)
