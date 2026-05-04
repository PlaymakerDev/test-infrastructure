import React from 'react'
import {
  LocationSection,
  VehicleStatSection,
  ChartSection
} from '../components'

interface Props {

}

const OverallSection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div>
      <section>
        <LocationSection />
      </section>
      <section className='mt-5'>
        <VehicleStatSection />
      </section>
      <section className='mt-5'>
        <ChartSection />
      </section>
    </div>
  )
}

export default React.memo<Props>(OverallSection)
