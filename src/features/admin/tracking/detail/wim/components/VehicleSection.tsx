import React from 'react'
import {
  FormSearchVehicle,
  VehicleStatCard,
  TableVehicleData
} from '../components'

interface Props {

}

const VehicleSection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div>
      <section>
        <FormSearchVehicle />
      </section>
      <section className='mt-5'>
        <VehicleStatCard />
      </section>
      <section className='mt-5'>
        <TableVehicleData />
      </section>
    </div>
  )
}

export default React.memo<Props>(VehicleSection)
