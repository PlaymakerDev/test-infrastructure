"use client"
import React from 'react'
import { ProjectInfoModal } from '@/components/modal'
import { TitleSection, OverallSection } from '../components'
import { OverallProvider } from '../context'
import TrafficLightingMinimumFontSize from '../../shared/TrafficLightingMinimumFontSize'

/** `main-screen px-10` + an `mt-8 pb-8` content section — the same shell every
 *  other overall page uses (traffic-volume, cctv, crosswalk, tunnel …). Traffic
 *  Lighting was the only one with bespoke `px-3 sm:px-6 xl:px-10 pt-3 pb-6`
 *  padding, which is what made its header sit tighter than the rest. */
const TrafficLightingScreen: React.FC = () => (
  <OverallProvider>
    <div className='main-screen px-10 traffic-lighting-font-min-14'>
      <TrafficLightingMinimumFontSize />
      <TitleSection />
      <section className='mt-8 pb-8'>
        <OverallSection />
      </section>
      <ProjectInfoModal />
    </div>
  </OverallProvider>
)

export default React.memo(TrafficLightingScreen)
