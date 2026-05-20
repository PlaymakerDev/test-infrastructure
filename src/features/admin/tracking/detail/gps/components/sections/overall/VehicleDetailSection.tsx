import React from 'react'
import {
  VehicleStat,
  VehicleDetail,
  VehicleRoute
} from '@/features/admin/tracking/detail/gps/components'

interface Props {

}

const VehicleDetailSection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div>
      <section>
        <VehicleStat />
      </section>
      <section className='mt-5'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
          <VehicleDetail />
          <VehicleRoute />
        </div>
      </section>
    </div>
  )
}

export default React.memo<Props>(VehicleDetailSection)
