"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import {
  TbGridDots,
  TbWifi,
  TbWifiOff,
  TbInfoSquareRoundedFilled,
} from 'react-icons/tb'
import type { CctvDeptOverviewListItem } from '@/types/cctv'

// ── Pill badge ───────────────────────────────────────────────────────────────

const Pill: React.FC<{ text: string; color: string }> = ({ text, color }) => (
  <span
    className='inline-flex items-center px-3 py-1 rounded-full text-sm whitespace-nowrap'
    style={{ border: `1.5px solid ${color}`, color }}
  >
    {text}
  </span>
)

// ── Single camera card ────────────────────────────────────────────────────────

const CctvCard: React.FC<{ item: CctvDeptOverviewListItem }> = ({ item }) => {
  const router = useRouter()
  const warrantyColor = item.is_warranty ? '#05F2DB' : '#979797'
  const warrantyText = item.is_warranty ? 'ในค้ำ' : 'หมดค้ำ'

  return (
    <div
      className='flex flex-col gap-4 rounded-2xl p-5'
      style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }}
    >
      {/* Title */}
      <h4
        className='text-base font-semibold leading-snug mb-0'
        style={{ color: 'var(--yellow)' }}
      >
        {item.solution.solution_name}
      </h4>

      {/* Badges row */}
      <div className='flex flex-wrap items-center gap-2'>
        <Pill text={item.road.code_name} color='#66AEFF' />
        <Pill text={warrantyText} color={warrantyColor} />
        <TbInfoSquareRoundedFilled
          size={32}
          className='cursor-pointer'
          style={{ color: '#ffffff' }}
          title='ดูรายละเอียดสัญญา'
        />
      </div>

      {/* Info rows */}
      <div className='flex flex-col gap-1.5 text-sm'>
        <div className='flex gap-2'>
          <span className='text-white/50 whitespace-nowrap shrink-0'>ชื่อโครงการ :</span>
          <span
            className='text-white cursor-pointer hover:text-(--yellow) hover:underline'
            onClick={() => router.push(`/admin/cctv/detail/${item.solution.id}`)}
            role='link'
            tabIndex={0}
          >
            {item.solution.solution_name}
          </span>
        </div>
        <div className='flex gap-2'>
          <span className='text-white/50 whitespace-nowrap shrink-0'>เลขที่สัญญา :</span>
          <span className='text-white'>{item.project.contract_no}</span>
        </div>
        <div className='flex gap-2'>
          <span className='text-white/50 whitespace-nowrap shrink-0'>ปีงบประมาณ :</span>
          <span className='font-medium' style={{ color: 'var(--yellow)' }}>{item.project.budget_year}</span>
        </div>
      </div>

      {/* Stats */}
      <div className='flex items-center justify-around pt-2'>

        {/* ทั้งหมด */}
        <div className='flex flex-col items-center gap-2'>
          <span className='fs-24 font-bold tabular-nums leading-none text-white'>
            {item.camera.total}
          </span>
          <div className='flex items-center gap-1 text-sm text-white/50'>
            <TbGridDots size={16} />
            <span>ทั้งหมด</span>
          </div>
        </div>

        {/* ออนไลน์ */}
        <div className='flex flex-col items-center gap-2'>
          <span
            className='fs-24 font-bold tabular-nums leading-none'
            style={{ color: item.camera.online === 0 ? '#66AEFF55' : '#66AEFF' }}
          >
            {item.camera.online}
          </span>
          <div className='flex items-center gap-1 text-sm' style={{ color: '#66AEFF99' }}>
            <TbWifi size={16} />
            <span>ออนไลน์</span>
          </div>
        </div>

        {/* ออฟไลน์ */}
        <div className='flex flex-col items-center gap-2'>
          <span
            className='fs-24 font-bold tabular-nums leading-none'
            style={{ color: item.camera.offline === 0 ? '#E94C4C55' : '#E94C4C' }}
          >
            {item.camera.offline}
          </span>
          <div className='flex items-center gap-1 text-sm' style={{ color: '#E94C4C99' }}>
            <TbWifiOff size={16} />
            <span>ออฟไลน์</span>
          </div>
        </div>

      </div>
    </div>
  )
}

// ── Grid ──────────────────────────────────────────────────────────────────────

interface Props {
  items: CctvDeptOverviewListItem[]
}

const CardGridCctv: React.FC<Props> = ({ items }) => {

  if (items.length === 0) {
    return (
      <div className='py-12 text-center text-white/30 text-sm'>ไม่พบข้อมูล</div>
    )
  }

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
      {items.map((item) => (
        <CctvCard key={item.solution.id} item={item} />
      ))}
    </div>
  )
}

export default React.memo<Props>(CardGridCctv)
