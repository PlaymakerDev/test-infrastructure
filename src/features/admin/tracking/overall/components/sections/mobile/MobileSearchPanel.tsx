import React from 'react'
import { FormSearchMobile, MobileInfoCard } from '../../../components'

interface Props {

}

const MobileSearchPanel: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div>
      <section>
        <FormSearchMobile />
      </section>
      <section className='mt-5'>
        <MobileInfoCard />
      </section>
    </div>
  )
}

export default React.memo<Props>(MobileSearchPanel)
