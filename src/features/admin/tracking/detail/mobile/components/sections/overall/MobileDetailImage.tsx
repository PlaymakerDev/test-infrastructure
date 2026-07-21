import { FALLBACK } from '@/constants'
import { MobileMasterDepartmentByTIDData } from '@/types/tracking/detail-api'
import { Image } from 'antd'
import React from 'react'

interface Props {
  departmentData?: MobileMasterDepartmentByTIDData
}

const MobileDetailImage: React.FC<Props> = (props) => {
  const { departmentData } = props

  return (
    <div className="h-full rounded-2xl p-5 bg-(--dark-black)">
      <div className='mb-1.5'>
        <figure className='h-52 overflow-hidden rounded-lg'>
          <Image
            src={departmentData?.image_path1}
            alt={departmentData?.image_name1}
            width={'100%'}
            height={'100%'}
            className='object-center object-cover'
            fallback={FALLBACK}
          />
        </figure>
        <p className='text-(--yellow) mt-2.5'>กั้นการจราจร</p>
      </div>
      <div className='mt-1.5'>
        <figure className='h-52 overflow-hidden rounded-lg'>
          <Image
            src={departmentData?.image_path2}
            alt={departmentData?.image_name2}
            width={'100%'}
            height={'100%'}
            className='object-center object-cover'
            fallback={FALLBACK}
          />
        </figure>
        <p className='text-(--yellow) mt-2.5'>บุคคลผู้ร่วมบูรณาการ</p>
      </div>
    </div>
  )
}

export default React.memo<Props>(MobileDetailImage)
