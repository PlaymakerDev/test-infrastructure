import React from 'react'
import {
  FormSearchVehicle,
  VehicleStatCard,
  TableVehicleData,
  ModalMobileLog
} from '../components'
import { useMobileContext } from '../context'

interface Props {

}

const VehicleSection: React.FC<Props> = () => {
  const { setSearchParams } = useMobileContext()

  return (
    <div>
      <section>
        <FormSearchVehicle onSearch={setSearchParams} />
      </section>
      <section className='mt-5'>
        <VehicleStatCard />
      </section>
      <section className='mt-5'>
        <TableVehicleData />
      </section>
      <ModalMobileLog />
    </div>
  )
}

export default React.memo<Props>(VehicleSection)
