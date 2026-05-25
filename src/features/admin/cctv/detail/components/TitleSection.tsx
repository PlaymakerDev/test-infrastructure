"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import {
  TbArrowBigLeftFilled,
  TbInfoSquareRoundedFilled,
  TbMapPin,
} from 'react-icons/tb'
import type { CctvInstallDetail } from '@/features/admin/cctv/overall/data/cctvData'

interface Props {
  detail: CctvInstallDetail
}

const Pill: React.FC<{ text: string; color: string; icon?: React.ReactNode }> = ({ text, color, icon }) => (
  <span
    className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs whitespace-nowrap'
    style={{ border: `1px solid ${color}`, color }}
  >
    {icon}
    {text}
  </span>
)

const TitleSection: React.FC<Props> = ({ detail }) => {
  const router = useRouter()

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/admin/cctv')
    }
  }

  const handleOpenGoogleMap = () => {
    if (detail.googleMapUrl) {
      window.open(detail.googleMapUrl, '_blank', 'noopener,noreferrer')
    } else {
      const [lng, lat] = detail.coord
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank', 'noopener,noreferrer')
    }
  }

  const warrantyColor = detail.warrantyStatus === 'in-warranty' ? '#05F2DB' : '#979797'
  const warrantyLabel = detail.warrantyStatus === 'in-warranty' ? 'ในค้ำ' : 'หมดค้ำ'

  return (
    <div className='px-10 pt-3 overflow-x-hidden'>
      <section className='flex items-start gap-3'>
        <TbArrowBigLeftFilled
          className='fs-24 text-(--yellow) cursor-pointer mt-1.5 shrink-0'
          onClick={handleBack}
        />
        <div className='min-w-0 flex-1'>
          {/* ── Main title ── */}
          <h1 className='text-(--yellow) leading-tight wrap-break-word'>
            CCTV : {detail.title}
          </h1>

          {/* ── Subtitle row with pills + buttons ── */}
          <div className='mt-2 flex items-center gap-2 flex-wrap'>
            <p className='text-white text-sm'>{detail.location}</p>
            <TbInfoSquareRoundedFilled
              className='text-white'
              size={18}
            />

            {/* Warranty pill */}
            <Pill text={warrantyLabel} color={warrantyColor} />

            {/* Google Map button */}
            <button
              className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs whitespace-nowrap text-white cursor-pointer hover:opacity-80 transition-opacity'
              style={{ background: '#4F84F0' }}
              type='button'
              onClick={handleOpenGoogleMap}
              title='เปิด Google Maps ที่ตำแหน่งกล้อง'
            >
              <TbMapPin size={14} />
              Google Map
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default React.memo<Props>(TitleSection)
