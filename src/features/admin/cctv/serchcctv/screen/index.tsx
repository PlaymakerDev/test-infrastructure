"use client"
import React from 'react'
import { TitleSection, OverallSection } from '../components'

const SerchCctvScreen: React.FC = () => {
  return (
    <div className='main-screen'>
      <TitleSection />
      <section className='mt-5 px-10'>
        <OverallSection />
      </section>
    </div>
  )
}

export default React.memo(SerchCctvScreen)
