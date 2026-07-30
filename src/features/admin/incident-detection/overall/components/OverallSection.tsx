import React from 'react'
import { DataDisplaySection, LocationSection } from '../components'

interface Props {
  roadId?: string | null
}

const OverallSection: React.FC<Props> = ({ roadId }) => {
  return (
    <div>
      <section>
        <LocationSection
          roadId={roadId}
        />
      </section>
      <section className='mt-5'>
        <DataDisplaySection
          roadId={roadId}
        />
      </section>
    </div>
  )
}

export default React.memo<Props>(OverallSection)
