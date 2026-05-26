import React from 'react'
import {
  FormSearchViolation,
  ViolationStatCard,
  TableViolationData
} from '../components'

interface Props {

}

const ViolationSection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div>
      <section>
        <FormSearchViolation />
      </section>
      <section className='mt-5'>
        <ViolationStatCard />
      </section>
      <section className='mt-5'>
        <h3 className='text-(--yellow) mb-4'>ตารางข้อมูลการฝ่าฝืนสัญญาณไฟทางข้าม</h3>
      </section>
      <section className='mt-5'>
        <TableViolationData />
      </section>
    </div>
  )
}

export default React.memo<Props>(ViolationSection)
