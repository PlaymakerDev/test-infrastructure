"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TbArrowBigLeftFilled, TbSearch, TbRoad, TbVideo, TbList } from 'react-icons/tb'
import BaseMap from '@/components/map/BaseMap'
import ThailandMaskLayer from '@/components/map/markers/ThailandMaskLayer'
import CameraDetailTableCctv from './CameraDetailTableCctv'

// ── Pill badge ────────────────────────────────────────────────────────────────

interface PillProps {
  count: number
  label: string
  color: string
}

const Pill: React.FC<PillProps> = ({ count, label, color }) => (
  <span
    className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs whitespace-nowrap'
    style={{ border: `1px solid ${color}`, color }}
  >
    <span className='font-semibold'>{count}</span>
    <span>{label}</span>
  </span>
)

// ── Info card ─────────────────────────────────────────────────────────────────

interface InfoCardProps {
  icon: React.ReactNode
  label: string
  accentColor?: string
  children: React.ReactNode
}

const InfoCard: React.FC<InfoCardProps> = ({ icon, label, accentColor = '#2a2a2a', children }) => (
  <div
    className='flex flex-col gap-3 rounded-2xl p-4'
    style={{ background: '#1a1a1a', border: `1px solid ${accentColor}` }}
  >
    <div className='flex items-center gap-2'>
      <span style={{ color: accentColor === '#2a2a2a' ? '#666' : accentColor }}>{icon}</span>
      <span className='text-sm font-medium text-white/60'>{label}</span>
    </div>
    {children}
  </div>
)

// ── Main component ────────────────────────────────────────────────────────────

const SerchCctv: React.FC = () => {
  const router = useRouter()
  const [searchValue, setSearchValue] = useState('')

  return (
    <div className='main-screen px-10'>

      {/* Title with inline back button */}
      <section>
        <h1 className='flex items-center gap-3 text-(--yellow)'>
          <button
            type='button'
            onClick={() => router.back()}
            className='cursor-pointer shrink-0'
            style={{ background: 'none', border: 'none', padding: 0, lineHeight: 0 }}
          >
            <TbArrowBigLeftFilled size={32} style={{ color: '#FCD116' }} />
          </button>
          ค้นหากล้อง CCTV รายสายทาง
        </h1>
        <p className='text-(--yellow) ml-11'>รวบรวมกล้อง CCTV ทุกจุดติดตั้งในสายทาง</p>
      </section>

      {/* Map section */}
      <section className='relative -mx-10 mt-6 overflow-hidden' style={{ height: 'calc(100vh - 220px)', minHeight: 480 }}>

        {/* Map */}
        <div className='absolute inset-0'>
          <BaseMap initialCenter={[100.5018, 13.7563]} initialZoom={11}>
            <ThailandMaskLayer maskColor='#212121' maskOpacity={1} />
          </BaseMap>
        </div>

        {/* Right overlay — search + info cards */}
        <aside
          className='absolute z-10 top-5 right-5 flex flex-col gap-3 pointer-events-auto'
          style={{ width: 320 }}
        >
          {/* Search input */}
          <div
            className='flex items-center gap-2 px-4 py-3 rounded-2xl'
            style={{ background: '#1a1a1a', border: '1px solid #333' }}
          >
            <TbSearch size={18} style={{ color: '#666', flexShrink: 0 }} />
            <input
              type='text'
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder='ค้นหาสายทาง เช่น ฉซ.3001...'
              className='flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none'
            />
          </div>

          {/* Card 1 — สายทาง */}
          <InfoCard icon={<TbRoad size={18} />} label='สายทาง' accentColor='#FCD116'>
            <div className='flex flex-col gap-0.5'>
              <span className='text-lg font-bold text-white'>ฉซ.3001</span>
              <span className='text-xs' style={{ color: '#aaa' }}>
                อำนวย 3 โครงการ, กล้อง CCTV 21 ตัว
              </span>
            </div>
          </InfoCard>

          {/* Card 2 — สถานะกล้อง */}
          <InfoCard icon={<TbVideo size={18} />} label='สถานะกล้อง'>
            <div className='flex flex-wrap gap-2'>
              <Pill count={21} label='ทั้งหมด' color='#fff' />
              <Pill count={16} label='ออนไลน์' color='#66AEFF' />
              <Pill count={5}  label='ออฟไลน์' color='#E94C4C' />
            </div>
          </InfoCard>

          {/* Card 3 — โครงการทั้งหมด */}
          <InfoCard icon={<TbList size={18} />} label='โครงการทั้งหมด'>
            <div className='flex flex-wrap gap-2'>
              <Pill count={3} label='ทั้งหมด' color='#fff' />
              <Pill count={1} label='ในค้ำ'   color='#05F2DB' />
              <Pill count={2} label='หมดค้ำ'  color='#979797' />
            </div>
          </InfoCard>
        </aside>

      </section>

      {/* Camera detail table */}
      <section className='mt-8'>
        <CameraDetailTableCctv />
      </section>

    </div>
  )
}

export default React.memo(SerchCctv)
