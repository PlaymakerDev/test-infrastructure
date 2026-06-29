import React from 'react'
import { FormSearchWIM, WIMInfoCard } from '../../../components'

interface Props {

}

const StationSearchPanel: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div>
      <section>
        <FormSearchWIM />
      </section>
      <section className='mt-5'>
        <WIMInfoCard />
      </section>
    </div>
  )
}

export default React.memo<Props>(StationSearchPanel)
