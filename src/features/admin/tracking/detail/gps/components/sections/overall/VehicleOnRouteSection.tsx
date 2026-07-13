import React from 'react'
import {
  CompareInfoSection,
  MapOverallSection
} from '@/features/admin/tracking/detail/gps/components'

interface Props {

}

const VehicleOnRouteSection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div>
      <section>
        <MapOverallSection />
      </section>
      <section className='mt-5'>
        <CompareInfoSection />
      </section>
    </div>
  )
}

export default React.memo<Props>(VehicleOnRouteSection)
