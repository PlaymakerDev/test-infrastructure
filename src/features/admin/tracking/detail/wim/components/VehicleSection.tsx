import React from 'react'
import {
  FormSearchVehicle,
  VehicleStatCard,
  TableVehicleData,
  ModalWeightLog
} from '../components'
import { useWIMContext } from '../context'

interface Props {

}

const VehicleSection: React.FC<Props> = () => {
  const { setVehicleSearchParams } = useWIMContext()

  return (
    <div>
      <section>
        <FormSearchVehicle onSearch={setVehicleSearchParams} />
      </section>
      <section className='mt-5'>
        <VehicleStatCard />
      </section>
      <section className='mt-5'>
        <TableVehicleData />
      </section>
      <ModalWeightLog />
    </div>
  )
}

export default React.memo<Props>(VehicleSection)
