import React from 'react'
import {
  OverallLocationSection,
  VehicleStatSection,
  ChartSection
} from '.'

interface Props {

}

const OverallSection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div>
      <section>
        <OverallLocationSection />
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
