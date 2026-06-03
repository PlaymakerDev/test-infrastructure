import React from 'react'
import { LocationSection } from '../components'

interface Props { }

const OverallSection: React.FC<Props> = () => {
  return (
    <div>
      <section>
        <LocationSection />
      </section>
    </div>
  )
}

export default React.memo<Props>(OverallSection)
