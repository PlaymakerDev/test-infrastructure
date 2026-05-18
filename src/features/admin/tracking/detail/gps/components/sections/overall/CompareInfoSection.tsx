import React from 'react'
import {
  CompareCard,
  FormSearchCompare,
  TableCompareData
} from '@/features/admin/tracking/detail/gps/components/'
import { TbMap } from 'react-icons/tb'

interface Props {

}

const CompareInfoSection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div className='bg-(--dark-black) rounded-lg p-5'>
      <div className='flex items-center gap-2 mb-4'>
        <TbMap className='fs-22 text-(--yellow) shrink-0' />
        <h3 className='text-(--yellow)'>พื้นที่ตรวจพบบ่อย 30 วันย้อนหลัง</h3>
      </div>
      <section>
        <CompareCard />
      </section>
      <section className='mt-5'>
        <FormSearchCompare />
      </section>
      <section className='mt-5'>
        <TableCompareData />
      </section>
    </div>
  )
}

export default React.memo<Props>(CompareInfoSection)
