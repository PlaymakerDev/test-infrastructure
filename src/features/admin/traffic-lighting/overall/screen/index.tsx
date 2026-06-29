"use client"
import React from 'react'
import { TitleSection, OverallSection } from '../components'
import { OverallProvider } from '../context'

const TrafficLightingScreen: React.FC = () => (
  <OverallProvider>
    <div className='main-screen px-3 sm:px-6 xl:px-10 pt-3 pb-6'>
      <TitleSection />
      <OverallSection />
    </div>
  </OverallProvider>
)

export default React.memo(TrafficLightingScreen)
