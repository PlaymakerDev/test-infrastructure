import { Button } from 'antd'
import React, { useState } from 'react'
import { TbLayoutGrid } from 'react-icons/tb'
import { DetailTabContent, ModalDetailItemStorage } from '../../../components'
import { useControlVMSContext } from '../../../context'

const DetailItemStorage: React.FC = () => {
  const { isAddMode } = useControlVMSContext()
  const [mediaOpen, setMediaOpen] = useState(false)

  return (
    <div className="h-full bg-(--dark-black) rounded-lg p-5">
      <div className='flex flex-wrap justify-between items-center gap-3'>
        <div className='flex items-start gap-2'>
          <TbLayoutGrid className='fs-22 text-(--yellow) shrink-0' />
          <div>
            <h4 className='mb-0 text-(--yellow)'>คลังรูปภาพและวิดีโอ</h4>
            <p className='fs-12 text-gray-400 mb-0'>รวบรวมรูปภาพและวิดีโอที่มีการแสดงผล</p>
          </div>
        </div>
        {!isAddMode && (
          <Button type="primary" size="middle" shape="round" className='w-full! sm:w-auto!' onClick={() => setMediaOpen(true)}>
            <p className='fs-12'>ดูเพิ่มเติม</p>
          </Button>
        )}
      </div>
      <section className='mt-5'>
        <DetailTabContent />
      </section>
      {isAddMode && (
        <div className='mt-3 text-center'>
          <Button type="primary" size="middle" shape="round" className='w-full! sm:w-auto!' onClick={() => setMediaOpen(true)}>
            <p className='fs-12'>ดูเพิ่มเติม</p>
          </Button>
        </div>
      )}
      <ModalDetailItemStorage open={mediaOpen} onClose={() => setMediaOpen(false)} />
    </div>
  )
}

export default React.memo(DetailItemStorage)
