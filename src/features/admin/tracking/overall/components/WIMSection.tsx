import React from 'react'
import { TableWIM } from '../components'
import WIMLocationSection from './sections/wim/WIMLocationSection'

const WIMSection = () => {

  return (
    <div>
      <section>
        <WIMLocationSection />
      </section>
      <section className='mt-5'>
        <TableWIM />
      </section>
    </div>
  )
}

export default React.memo(WIMSection)
