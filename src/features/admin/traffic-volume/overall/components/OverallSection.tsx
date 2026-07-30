"use client"
import React from 'react'
import LocationTrafficVolume from './sections/overall/LocationTrafficVolume'
import DataDisplayTrafficVolume from './sections/overall/DataDisplayTrafficVolume'

interface Props {
  roadId?: string | null
}

const OverallSection: React.FC<Props> = ({ roadId }) => {
  return (
    <div>
      <section>
        <LocationTrafficVolume
          roadId={roadId}
        />
      </section>
      <section className='mt-5'>
        <DataDisplayTrafficVolume
          roadId={roadId}
        />
      </section>
    </div>
  )
}

export default React.memo<Props>(OverallSection)
