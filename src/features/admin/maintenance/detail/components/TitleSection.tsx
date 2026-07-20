"use client"
import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TbArrowBigLeftFilled } from 'react-icons/tb'
import { useAppDispatch } from '@/stores/hooks'
import { setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'

interface Props {
  id: string
  title: string
  subtitle?: string
  onlineCount?: number
  offlineCount?: number
  warranty?: string
  /** Feeds the ⓘ icon → central Project Info modal. Icon is muted/inert without a projectId. */
  projectId?: number
  roadId?: number
  /** [lng, lat] from the feature's own overview endpoint. Null → fall back to a name-based text search. */
  coord?: [number, number] | null
}

const TitleSection: React.FC<Props> = ({ id, title, subtitle, onlineCount = 0, offlineCount = 0, warranty = 'หมดค้ำ', projectId, roadId, coord = null }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()

  const handleBack = () => {
    router.push('/admin/maintenance?repair')
  }

  return (
    <div className='px-3 sm:px-10 pt-3'>
      <section className='flex items-start gap-3'>
        <TbArrowBigLeftFilled
          className='text-[24px] cursor-pointer mt-1.5 shrink-0'
          style={{ color: '#FCD116' }}
          onClick={handleBack}
        />
        <div className='min-w-0 flex-1'>
          <h1 className='text-[18px] sm:text-[24px] font-bold wrap-break-word' style={{ color: '#FCD116' }}>
            {title}
          </h1>
          <div className='flex items-center gap-2 mt-2 flex-wrap'>
            {subtitle && (
              <p className='text-[13px] sm:text-[14px] font-normal' style={{ color: '#FFFFFF' }}>
                {subtitle}
              </p>
            )}
            <span
              className='inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[12px] sm:text-[14px] font-normal whitespace-nowrap'
              style={{ border: `1px solid ${warranty === 'ในค้ำ' ? '#05F2DB' : '#979797'}`, color: warranty === 'ในค้ำ' ? '#05F2DB' : '#979797' }}
            >
              {warranty}
            </span>
            <img
              src='/atlas/images/statistics/icbt.png'
              alt='ดูข้อมูลโครงการ'
              title='ดูข้อมูลโครงการ'
              width={26}
              height={26}
              className='shrink-0 sm:w-7.5 sm:h-7.5'
              onClick={() => projectId !== undefined && dispatch(setProjectInfoModalOpen({
                open: true,
                project_id: projectId,
                road_id: roadId ?? null,
              }))}
              style={{ cursor: projectId !== undefined ? 'pointer' : 'default', opacity: projectId !== undefined ? 1 : 0.5 }}
            />
            <span
              className='inline-flex items-center gap-1.5 text-[12px] sm:text-[14px] font-normal whitespace-nowrap'
              style={{ padding: '2px 10px', borderRadius: 9999, border: '1px solid #66AEFF', color: '#66AEFF', minWidth: 60, textAlign: 'center' }}
            >
              <img src='/atlas/images/Maintenance/icrpblue.png' alt='' width={13} height={13} />
              <span style={{ marginTop: 2 }}>{onlineCount}</span>
            </span>
            <span
              className='inline-flex items-center gap-1.5 text-[12px] sm:text-[14px] font-normal whitespace-nowrap'
              style={{ padding: '2px 10px', borderRadius: 9999, border: '1px solid #E94C4C', color: '#E94C4C', minWidth: 60, textAlign: 'center' }}
            >
              <img src='/atlas/images/Maintenance/icrpred.png' alt='' width={13} height={13} />
              <span style={{ marginTop: 2 }}>{offlineCount}</span>
            </span>
            <button
              className='inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-[12px] sm:text-[14px] font-normal whitespace-nowrap text-white cursor-pointer hover:opacity-80 transition-opacity'
              style={{ background: '#003F87' }}
              type='button'
              onClick={() => {
                if (coord) {
                  window.open(`https://www.google.com/maps?q=${coord[1]},${coord[0]}`, '_blank')
                  return
                }
                const query = [title, subtitle].filter(Boolean).join(' ')
                window.open(`https://www.google.com/maps?q=${encodeURIComponent(query)}`, '_blank')
              }}
            >
              Google Map
            </button>
            <button
              className='inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-[12px] sm:text-[14px] font-normal whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity'
              style={{ background: '#FCD116', color: '#212121' }}
              type='button'
              onClick={() => {
                const query = searchParams.toString()
                router.push(`/admin/maintenance/detail/${id}/repair-history${query ? `?${query}` : ''}`)
              }}
            >
              ประวัติการซ่อม
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default React.memo(TitleSection)
