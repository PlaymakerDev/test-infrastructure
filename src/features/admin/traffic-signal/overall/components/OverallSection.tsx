"use client"
import React from 'react'
import LocationTrafficSignal from './sections/overall/LocationTrafficSignal'
import DataDisplayTrafficSignal from './sections/overall/DataDisplayTrafficSignal'

interface Props {
  roadId?: string | null
}

const OverallSection: React.FC<Props> = ({ roadId }) => {
  return (
    <div>
      <section>
        <LocationTrafficSignal
          roadId={roadId}
        />
      </section>
      <section className='mt-5'>
        <DataDisplayTrafficSignal
          roadId={roadId}
        />
      </section>
    </div>
  )
}

export default React.memo<Props>(OverallSection)
