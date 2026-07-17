"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import { TbArrowBigLeftFilled } from 'react-icons/tb'

interface Props {
  caseId: string
  /** Derived from the case's own camera→solution link — used when
   *  sessionStorage's maintenance_detail_id is missing (e.g. this case URL
   *  was opened directly, not via the solution detail page's Case No. link). */
  fallbackSolutionId?: number
}

const TitleSection: React.FC<Props> = ({ caseId, fallbackSolutionId }) => {
  const router = useRouter()

  const handleBack = () => {
    // Every entry point into this page (the Case No. link on the solution
    // detail table) stashes the solution id here first — prefer it over
    // router.back(), which just pops raw browser history and can land
    // anywhere the tab happened to visit before this page, not necessarily
    // the solution this case belongs to.
    const detailId = typeof window !== 'undefined' ? sessionStorage.getItem('maintenance_detail_id') : null
    if (detailId) {
      router.push(`/admin/maintenance/detail/${detailId}`)
      return
    }
    if (fallbackSolutionId) {
      router.push(`/admin/maintenance/detail/${fallbackSolutionId}`)
      return
    }
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
