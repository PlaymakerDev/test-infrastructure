import React from 'react'
import DataDisplaySection from './sections/overall/DataDisplaySection'
import LocationSection from './sections/overall/LocationSection'

interface Props {
  roadId: string | null
}

const OverallSection: React.FC<Props> = (props) => {
  const { roadId } = props

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

export default React.memo(OverallSection)
