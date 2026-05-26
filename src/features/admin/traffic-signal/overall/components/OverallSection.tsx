"use client"
import React from 'react'
import LocationTrafficSignal from './sections/overall/LocationTrafficSignal'
import DataDisplayTrafficSignal from './sections/overall/DataDisplayTrafficSignal'

interface Props {}

const OverallSection: React.FC<Props> = () => {
  return (
    <div>
      <section>
        <LocationTrafficSignal />
      </section>
      <section className='mt-5'>
        <DataDisplayTrafficSignal />
      </section>
    </div>
  )
}

export default React.memo<Props>(OverallSection)
