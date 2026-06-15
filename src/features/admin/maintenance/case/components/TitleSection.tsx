"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import { TbArrowBigLeftFilled } from 'react-icons/tb'

interface Props {
  caseId: string
}

const TitleSection: React.FC<Props> = ({ caseId }) => {
  const router = useRouter()

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/admin/maintenance')
    }
  }

  return (
    <div className='pt-3'>
      <section className='flex items-start gap-3 p-4 px-4 sm:px-6 md:px-10' style={{ background: '#363636' }}>
        <TbArrowBigLeftFilled
          className='text-[24px] cursor-pointer mt-1.5 shrink-0'
          style={{ color: '#FCD116' }}
          onClick={handleBack}
        />
        <div className='min-w-0 flex-1'>
          <h1 className='text-[24px] font-bold'>
            <span style={{ color: '#FCD116' }}>Case No.</span>{' '}
            <span style={{ color: '#FFFFFF' }}>{caseId}</span>
          </h1>
        </div>
      </section>
    </div>
  )
}

export default React.memo<Props>(TitleSection)
