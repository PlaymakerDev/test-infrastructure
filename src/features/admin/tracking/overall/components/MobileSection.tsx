import React from 'react'
import { MobileLocationSection, TableMobile } from '../components'
import ChartMobileUnitPlan from './sections/mobile/ChartMobileUnitPlan'

const MobileSection = () => {

  return (
    <div>
      <section>
        <MobileLocationSection />
      </section>
      <section className='mt-5'>
        <ChartMobileUnitPlan />
      </section>
      <section className='mt-5'>
        <TableMobile />
      </section>
    </div>
  )
}

export default React.memo(MobileSection)
