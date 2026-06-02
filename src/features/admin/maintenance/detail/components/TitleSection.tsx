"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import { TbArrowBigLeftFilled, TbPrinter } from 'react-icons/tb'

interface Props {
  id: string
  title: string
  subtitle: string
}

const TitleSection: React.FC<Props> = ({ id, title, subtitle }) => {
  const router = useRouter()

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/admin/maintenance')
    }
  }

  return (
    <div className='px-10 pt-3'>
      <section className='flex items-start gap-3'>
        <TbArrowBigLeftFilled
          className='text-[24px] cursor-pointer mt-1.5 shrink-0'
          style={{ color: '#FCD116' }}
          onClick={handleBack}
        />
        <div className='min-w-0 flex-1'>
          <h1 className='text-[24px] font-bold' style={{ color: '#FCD116' }}>
            {title}
          </h1>
          {subtitle && (
            <div className='flex items-center gap-2 mt-1 flex-wrap'>
              <p className='text-[14px] font-normal' style={{ color: '#FFFFFF' }}>
                {subtitle}
              </p>
              <span
                className='inline-flex items-center px-3 py-1 rounded-full text-[14px] font-normal whitespace-nowrap'
                style={{ border: '1px solid #979797', color: '#979797' }}
              >
                หมดค้ำ
              </span>
              <img src='/images/statistics/icbt.png' alt='' width={30} height={30} className='shrink-0' />
              <span
                className='inline-flex items-center gap-1.5 text-[14px] font-normal whitespace-nowrap'
                style={{ padding: '2px 12px', borderRadius: 9999, border: '1px solid #66AEFF', color: '#66AEFF', minWidth: 70, textAlign: 'center' }}
              >
                <img src='/images/Maintenance/icrpblue.png' alt='' width={15} height={15} />
                <span style={{ marginTop: 2 }}>49</span>
              </span>
              <span
                className='inline-flex items-center gap-1.5 text-[14px] font-normal whitespace-nowrap'
                style={{ padding: '2px 12px', borderRadius: 9999, border: '1px solid #E94C4C', color: '#E94C4C', minWidth: 70, textAlign: 'center' }}
              >
                <img src='/images/Maintenance/icrpred.png' alt='' width={15} height={15} />
                <span style={{ marginTop: 2 }}>30</span>
              </span>
              <button
                className='inline-flex items-center px-3 py-1 rounded-full text-[14px] font-normal whitespace-nowrap text-white cursor-pointer hover:opacity-80 transition-opacity'
                style={{ background: '#003F87' }}
                type='button'
              >
                Google Map
              </button>
              <button
                className='inline-flex items-center px-3 py-1 rounded-full text-[14px] font-normal whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity'
                style={{ background: '#FCD116', color: '#212121' }}
                type='button'
                onClick={() => router.push(`/admin/maintenance/detail/${id}/repair-history?subtitle=${encodeURIComponent(subtitle)}&warranty=หมดค้ำ`)}
              >
                ประวัติการซ่อม
              </button>
              <button
                className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[14px] font-normal whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity'
                style={{ background: '#66AEFF', color: '#0A0A0A' }}
                type='button'
              >
                <TbPrinter size={14} />
                นำออกเอกสาร
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default React.memo<Props>(TitleSection)
