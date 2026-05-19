import { Button } from 'antd'
import React from 'react'
import { TbLayoutGrid } from 'react-icons/tb'
import { DetailTabContent } from '../../../components'

interface Props {

}

const DetailItemStorage: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div className="h-full bg-(--dark-black) rounded-lg p-5">
      <div className='flex flex-wrap justify-between items-center gap-3'>
        <div className='flex items-start gap-2'>
          <TbLayoutGrid className='fs-22 text-(--yellow) shrink-0' />
          <div>
            <h4 className='mb-0 text-(--yellow)'>คลังรูปภาพและวิดีโอ VMS</h4>
            <p className='fs-12 text-gray-400 mb-0'>รวบรวมรูปภาพและวิดีโอที่มีการแสดงผลในปัจจุบัน</p>
          </div>
        </div>
        <Button type="primary" size="middle" shape="round" className='w-full! sm:w-auto!'>
          <p className='fs-12'>ดูเพิ่มเติม</p>
        </Button>
      </div>
      <section className='mt-5'>
        <DetailTabContent />
      </section>
    </div>
  )
}

export default React.memo<Props>(DetailItemStorage)
