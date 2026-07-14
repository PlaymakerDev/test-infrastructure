"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import { TbArrowBigLeftFilled } from 'react-icons/tb'

const TitleSection: React.FC = () => {
  const router = useRouter()

  return (
    <div className='px-8'>
      <p
        className='block mb-3 lg:hidden text-(--yellow) cursor-pointer'
        onClick={() => router.back()}
      >
        &lt; ย้อนกลับ
      </p>
      <section className='flex items-start gap-3'>
        <TbArrowBigLeftFilled
          className='fs-24 text-(--yellow) cursor-pointer mt-2 hidden lg:block'
          onClick={() => router.back()}
        />
        <div className='flex-1 min-w-0'>
          <h1 className='text-(--yellow)'>ค้นหากล้อง CCTV รายสายทาง</h1>
          <div className='flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2'>
            <div className='flex flex-wrap items-center gap-2'>
              <p className='text-(--yellow)'>รวบรวมกล้อง CCTV ทุกจุดติดตั้งในสายทาง</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default React.memo(TitleSection)
