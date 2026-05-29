"use client"
import React from 'react'
import { OverallSection, TitleSection } from '../components'
import { OverallProvider } from '../context'

const VMSScreen = () => {
  return (
    <OverallProvider>
      <div className='main-screen px-10'>
        <TitleSection />
        <section className='mt-8'>
          <OverallSection />
        </section>
      </div>
    </OverallProvider>
  )
}

export default React.memo(VMSScreen)
