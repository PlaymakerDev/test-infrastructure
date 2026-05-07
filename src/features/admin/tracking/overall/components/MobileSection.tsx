import React from 'react'
import { MobileLocationSection, TableMobile } from '../components'

const MobileSection = () => {

  return (
    <div>
      <section>
        <MobileLocationSection />
      </section>
      <section className='mt-5'>
        <p>CHART</p>
      </section>
      <section className='mt-5'>
        <TableMobile />
      </section>
    </div>
  )
}

export default React.memo(MobileSection)
