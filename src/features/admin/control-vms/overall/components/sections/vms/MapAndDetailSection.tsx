import React from 'react'
import { DetailItemStorage, MapSection, VMSDetail } from '../../../components'
import { useControlVMSContext } from '../../../context'

interface Props {

}

const MapAndDetailSection: React.FC<Props> = (props) => {
  const { } = props
  const { isAddMode } = useControlVMSContext()

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
