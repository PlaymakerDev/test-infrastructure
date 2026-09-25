"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import { TbArrowBigLeftFilled, TbWifi, TbWifiOff } from 'react-icons/tb'

interface Props {
  caseId: string
  /** Derived from the case API relationship, with `?solution_id=` as fallback. */
  solutionId?: number
  /** Validated context to restore when returning to the owning detail route. */
  detailQuery?: string
  /** The case was opened from the all-repairs table rather than a detail row. */
  returnToAllRepairs?: boolean
  /** The case was opened from the ประวัติการซ่อม table — back returns there. */
  returnToRepairHistory?: boolean
  /** Device name line under the Case No. (2026-09-11 redesign). */
  subtitle?: string
  /** หมดค้ำ/ในค้ำ + ออนไลน์/ออฟไลน์ pills next to the subtitle. Omit to hide. */
  warranty?: 'ในค้ำ' | 'หมดค้ำ'
  isOnline?: boolean
  /** Action buttons pinned to the right of the header bar (per-role). */
  rightContent?: React.ReactNode
}

const PILL =
  'inline-flex items-center gap-1 px-3 py-0.5 rounded-full whitespace-nowrap'

const TitleSection: React.FC<Props> = ({
  caseId,
  solutionId,
  detailQuery = '',
  returnToAllRepairs = false,
  returnToRepairHistory = false,
  subtitle,
  warranty,
  isOnline,
  rightContent,
}) => {
  const router = useRouter()

  const handleBack = () => {
    if (returnToAllRepairs) {
      router.push('/admin/maintenance?repair&all_repairs')
      return
    }
    if (returnToRepairHistory && solutionId) {
      router.push(`/admin/maintenance/detail/${solutionId}/repair-history${detailQuery ? `?${detailQuery}` : ''}`)
      return
    }
    if (solutionId) {
      router.push(`/admin/maintenance/detail/${solutionId}${detailQuery ? `?${detailQuery}` : ''}`)
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
      {/* flex-wrap + w-full on the action column: on a phone the buttons drop
          to their own line so the Case No. heading keeps the full width
          instead of wrapping into three lines. */}
      <section className='flex flex-wrap items-start gap-3 p-4 px-4 sm:px-6 md:px-10' style={{ background: '#363636' }}>
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
          {(subtitle || warranty !== undefined || isOnline !== undefined) && (
            <div className='mt-1 flex flex-wrap items-center gap-2'>
              {subtitle && (
                <p className='fs-12' style={{ color: '#FFFFFF', margin: 0 }}>{subtitle}</p>
              )}
              {warranty !== undefined && (
                <span
                  className={PILL}
                  style={{
                    border: `1px solid ${warranty === 'ในค้ำ' ? '#05F2DB' : '#E94C4C'}`,
                    color: warranty === 'ในค้ำ' ? '#05F2DB' : '#E94C4C',
                    fontSize: 12,
                  }}
                >
                  {warranty}
                </span>
              )}
              {isOnline !== undefined && (
                <span
                  className={PILL}
                  style={{
                    border: `1px solid ${isOnline ? '#66AEFF' : '#E94C4C'}`,
                    color: isOnline ? '#66AEFF' : '#E94C4C',
                    fontSize: 12,
                  }}
                >
                  {isOnline ? <TbWifi size={13} /> : <TbWifiOff size={13} />}
                  {isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
                </span>
              )}
            </div>
          )}
        </div>
        {rightContent && (
          <div className='flex flex-wrap items-center gap-3 w-full sm:w-auto sm:justify-end sm:shrink-0 mt-1'>{rightContent}</div>
        )}
      </section>
    </div>
  )
}

export default React.memo<Props>(TitleSection)
