"use client"
import React from 'react'
import { ProjectInfoModal } from '@/components/modal'
import { TitleSection, OverallSection } from '../components'
import { OverallProvider } from '../context'
import TrafficLightingMinimumFontSize from '../../shared/TrafficLightingMinimumFontSize'

const TrafficLightingScreen: React.FC = () => (
  <OverallProvider>
    <div className='main-screen px-3 sm:px-6 xl:px-10 pt-3 pb-6 traffic-lighting-font-min-14'>
      <TrafficLightingMinimumFontSize />
      <TitleSection />
      <OverallSection />
      <ProjectInfoModal />
    </div>
  </OverallProvider>
)

export default React.memo(TrafficLightingScreen)
