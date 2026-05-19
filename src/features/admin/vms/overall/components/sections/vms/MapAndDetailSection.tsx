import React from 'react'
import { MapSection, VMSDetail } from '../../../components'

interface Props {

}

const MapAndDetailSection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <>
      <section>
        <MapSection />
      </section>
      <section className='mt-5'>
        <VMSDetail />
      </section>
    </>
  )
}

export default React.memo<Props>(MapAndDetailSection)
