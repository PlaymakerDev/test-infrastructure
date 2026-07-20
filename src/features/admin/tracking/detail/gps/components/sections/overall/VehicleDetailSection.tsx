import React from 'react'
import {
  VehicleStat,
  ChartVehicleRatio,
  TrafficAndVehicleSection,
  VehicleHistory
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
        <VehicleHistory />
      </section>
      <section className='mt-5'>
        <ChartVehicleRatio />
      </section>
      <section className='mt-5'>
        <TrafficAndVehicleSection />
      </section>
    </div>
  )
}

export default React.memo<Props>(VehicleDetailSection)
