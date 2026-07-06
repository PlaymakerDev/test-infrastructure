"use client"
import { useRouter } from 'next/navigation'
import React from 'react'
import { TbArrowBigLeftFilled, TbInfoSquareRoundedFilled } from 'react-icons/tb'
import { useProjectDetailContext } from '../context'
import StatusBadge from '../../../overall/components/project/StatusBadge'

const TitleSection: React.FC = () => {
  const router = useRouter()
  const { project } = useProjectDetailContext()

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back()
    else router.push('/admin/settings')
  }

  return (
    <section className='px-3'>
      <div className='flex items-start gap-3'>
        <TbArrowBigLeftFilled
          className='text-3xl text-(--yellow) cursor-pointer mt-1 shrink-0'
          onClick={handleBack}
        />
        <div className='flex-1 min-w-0'>
          <h1 className='text-(--yellow) mb-2'>จัดการข้อมูลโครงการ</h1>
          <div className='flex flex-wrap items-center gap-2'>
            <p className='text-white mb-0 break-words'>{project.name}</p>
            <TbInfoSquareRoundedFilled size={22} className='text-(--default-blue) cursor-pointer shrink-0' />
            <StatusBadge status={project.warrantyStatus} />
          </div>
        </div>
      </div>
    </section>
  )
}

export default React.memo(TitleSection)
