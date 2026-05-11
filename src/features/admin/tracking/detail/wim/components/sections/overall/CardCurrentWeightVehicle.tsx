import React from 'react'
import dayjs from 'dayjs'
import { Image } from 'antd'

interface Props { }

const CardCurrentWeightVehicle: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div className="border-2 rounded-lg p-5 border-red-500">
      <section>
        <h1 className="text-red-500">841233 เชียงใหม่</h1>
        <p>รถน้ำหนักเกิน</p>
        <p className="text-red-500">{dayjs().format('DD/MM/YYYY HH:mm:ss')}</p>
      </section>
      <section className='mt-5'>
        <figure className='h-52 overflow-hidden rounded-lg'>
          <Image
            src='https://i.pinimg.com/736x/78/0d/41/780d410dcb9da0f84c05aa5cb80daec3.jpg'
            alt='example-image'
            width={'100%'}
            height={'100%'}
            className='object-center object-cover'
          />
        </figure>
      </section>
      <section className='mt-5'>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
          {/* f1 — xs: border-b | sm: border-b + border-r | lg: border-r only */}
          <figure className='flex flex-col items-center gap-2 py-3 px-2 sm:px-4 lg:px-6 border-(--white)/50 border-b sm:border-r lg:border-b-0'>
            <section className='text-center'>
              <h1 className='text-xs font-semibold text-(--yellow) sm:text-sm'>10</h1>
              <p className='text-xs text-gray-400'>ประเภท</p>
              <p className='text-xs text-gray-400'>กึ่งพ่วง 5 เพลา 18 เส้น</p>
            </section>
          </figure>

          {/* f2 — xs: border-b | sm: border-b (rightmost, no border-r) | lg: border-b-0 + border-r */}
          <figure className='flex flex-col items-center gap-2 py-3 px-2 sm:px-4 lg:px-6 border-(--white)/50 border-b lg:border-b-0 lg:border-r'>
            <section className='text-center'>
              <h1 className='text-xs font-semibold text-(--yellow) sm:text-sm'>10</h1>
              <p className='text-xs text-gray-400'>น้ำหนักมาตราฐาน</p>
              <p className='text-xs text-gray-400'>(ตัน)</p>
            </section>
          </figure>

          {/* f3 — xs: border-b | sm: border-b-0 + border-r | lg: border-r */}
          <figure className='flex flex-col items-center gap-2 py-3 px-2 sm:px-4 lg:px-6 border-(--white)/50 border-b sm:border-b-0 sm:border-r'>
            <section className='text-center'>
              <h1 className='text-xs font-semibold text-white sm:text-sm'>10</h1>
              <p className='text-xs text-gray-400'>น้ำหนักที่ชั่ง</p>
              <p className='text-xs text-gray-400'>(ตัน)</p>
            </section>
          </figure>

          {/* f4 — last item, no border needed at any breakpoint */}
          <figure className='flex flex-col items-center gap-2 py-3 px-2 sm:px-4 lg:px-6'>
            <section className='text-center'>
              <h1 className={`text-xs font-semibold text-red-500 sm:text-sm`}>10</h1>
              <p className='text-xs text-gray-400'>น้ำหนักเกิน</p>
              <p className='text-xs text-gray-400'>(ตัน)</p>
            </section>
          </figure>
        </div>
      </section>
    </div>
  )
}

export default React.memo<Props>(CardCurrentWeightVehicle)