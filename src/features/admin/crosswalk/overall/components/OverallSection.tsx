import React from 'react'
import DataDisplaySection from './sections/overall/DataDisplaySection'
import LocationSection from './sections/overall/LocationSection'

const OverallSection: React.FC = () => (
  <div>
    <section>
      <LocationSection />
    </section>
    <section className='mt-5'>
      <DataDisplaySection />
    </section>
  </div>
)

export default React.memo(OverallSection)
