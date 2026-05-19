import React from 'react'
import {
  DetailTitle,
  DetailVMSSign,
  DetailItemStorage,
  FormAddDetail
} from '../../../components'
import { useVMSContext } from '../../../context'

interface Props {

}

const DetailSection: React.FC<Props> = (props) => {
  const { } = props
  const { isAddMode } = useVMSContext()

  return (
    <div className='lg:px-8'>
      <section>
        <DetailTitle />
      </section>
      <section className='mt-5'>
        <DetailVMSSign />
      </section>
      <section className='mt-5'>
        {isAddMode ? <FormAddDetail /> : <DetailItemStorage />}
      </section>
    </div>
  )
}

export default React.memo<Props>(DetailSection)
