"use client"
import React, { useState } from 'react'
import { TbSearch, TbRoad, TbVideo, TbList } from 'react-icons/tb'
import CameraDetailTableCctv from './sections/overall/CameraDetailTableCctv'
import MapSection from './sections/overall/MapSection'

// ── Pill badge ────────────────────────────────────────────────────────────────

const Pill: React.FC<{ count: number; label: string; color: string }> = ({ count, label, color }) => (
  <span
    className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs whitespace-nowrap'
    style={{ border: `1px solid ${color}`, color }}
  >
    <span className='font-semibold'>{count}</span>
    <span>{label}</span>
  </span>
)

// ── Info card ─────────────────────────────────────────────────────────────────

const InfoCard: React.FC<{
  icon: React.ReactNode
  label: string
  accentColor?: string
  children: React.ReactNode
}> = ({ icon, label, accentColor = '#2a2a2a', children }) => (
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

const OverallSection: React.FC = () => {
  const [searchValue, setSearchValue] = useState('')

  return (
    <>
      {/* ── Map + search overlay ── */}
      <section
        className='relative -mx-10 mt-6 overflow-hidden'
        style={{ height: 'calc(100vh - 220px)', minHeight: 480 }}
      >
        {/* Mapbox — fills entire section */}
        <div className='absolute inset-0'>
          <MapSection edgeFade={{ left: 30, right: 30, top: 10, bottom: 10 }} />
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

      {/* ── Camera detail table ── */}
      <section className='mt-8'>
        <CameraDetailTableCctv />
      </section>
    </>
  )
}

export default React.memo(OverallSection)
