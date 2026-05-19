import React from 'react'
import { DetailItemStorage, MapSection, VMSDetail } from '../../../components'
import { useVMSContext } from '../../../context'

interface Props {

}

const MapAndDetailSection: React.FC<Props> = (props) => {
  const { } = props
  const { isAddMode } = useVMSContext()

  return (
    <>
      <section>
        <MapSection />
      </section>
      <section className='mt-5'>
        <VMSDetail />
      </section>
      {isAddMode && (
        <section className='mt-5'>
          <DetailItemStorage />
        </section>
      )}
    </>
  )
}

export default React.memo<Props>(MapAndDetailSection)
