"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import { TbArrowBigLeftFilled } from 'react-icons/tb'

const TitleSection: React.FC = () => {
  const router = useRouter()

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/admin/cctv')
    }
  }

  return (
    <div className='px-10 pt-3 overflow-x-hidden'>
      <section className='flex items-start gap-3'>
        <TbArrowBigLeftFilled
          className='fs-24 text-(--yellow) cursor-pointer mt-1.5 shrink-0'
          onClick={handleBack}
        />
        <div className='min-w-0 flex-1'>
          <h1 className='text-(--yellow) leading-tight wrap-break-word'>
            ค้นหากล้อง CCTV รายสายทาง
          </h1>
          <p className='text-(--yellow) text-sm mt-1'>
            รวบรวมกล้อง CCTV ทุกจุดติดตั้งในสายทาง
          </p>
        </div>
      </section>
    </div>
  )
}

export default React.memo(TitleSection)
