import { Image } from 'antd'
import React from 'react'
import { TbLayoutGrid } from 'react-icons/tb'
import { useVMSContext } from '../../../context'

const DetailVMSSign: React.FC = () => {
  const { bureauSign } = useVMSContext()

  return (
    <div className="h-full bg-(--gray) rounded-lg p-5">
      <div className='flex items-start gap-2 mb-5'>
        <TbLayoutGrid className='fs-22 text-(--yellow) shrink-0' />
        <div>
          <h4 className='mb-0 text-(--yellow)'>รูปแบบการทำงานของป้าย VMS</h4>
          <p className='fs-12 text-gray-400 mb-0'>การทำงานของโปรแกรม</p>
        </div>
      </div>

      {bureauSign?.vms_img ? (
        <figure className='figure-large rounded-lg overflow-hidden'>
          <Image
            src={bureauSign.vms_img}
            alt={bureauSign.name}
            width={"100%"}
            height={"100%"}
            className='object-cover object-center'
          />
        </figure>
      ) : (
        <div className='figure-large rounded-lg bg-(--mid-gray) flex items-center justify-center'>
          <p className='text-gray-500 fs-12'>ไม่มีรูปภาพ</p>
        </div>
      )}
    </div>
  )
}

export default React.memo(DetailVMSSign)
