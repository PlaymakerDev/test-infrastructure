"use client"
import React from 'react'
import { TitleSection, OverallSection } from '../components'

const BridgeLightingScreen: React.FC = () => {
  return (
    <div className='main-screen px-10'>
      <TitleSection />
      <section className='mt-8'>
        <OverallSection />
      </section>
    </div>
  )
}

export default React.memo(BridgeLightingScreen)
