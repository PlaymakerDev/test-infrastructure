"use client"
import React from 'react'
import LocationTrafficVolume from './sections/overall/LocationTrafficVolume'
import DataDisplayTrafficVolume from './sections/overall/DataDisplayTrafficVolume'

interface Props {}

const OverallSection: React.FC<Props> = () => {
  return (
    <div>
      <section>
        <LocationTrafficVolume />
      </section>
      <section className='mt-5'>
        <DataDisplayTrafficVolume />
      </section>
    </div>
  )
}

export default React.memo<Props>(OverallSection)
