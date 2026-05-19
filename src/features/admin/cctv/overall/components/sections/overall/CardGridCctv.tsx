"use client"
import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  TbGridDots,
  TbWifi,
  TbWifiOff,
  TbInfoSquareRoundedFilled,
} from 'react-icons/tb'
import type { CctvCameraEntry } from '@/features/admin/cctv/overall/data/cctvData'

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

const CctvCard: React.FC<{ camera: CctvCameraEntry }> = ({ camera }) => {
  const router = useRouter()
  const warrantyColor = camera.warranty === 'in-warranty' ? '#05F2DB' : '#979797'
  const warrantyText = camera.warranty === 'in-warranty' ? 'ในค้ำ' : 'หมดค้ำ'
  const roadColor = camera.connection === 'online' ? '#66AEFF' : '#E94C4C'

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
        {camera.projectName}
      </h4>

      {/* Badges row */}
      <div className='flex flex-wrap items-center gap-2'>
        <Pill text={camera.roadCode} color={roadColor} />
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
          <span className='text-white/50 whitespace-nowrap shrink-0'>จุดติดตั้ง :</span>
          <span
            className='text-white cursor-pointer hover:text-(--yellow) hover:underline'
            onClick={() => router.push(`/admin/cctv/detail/${camera.id}`)}
            role='link'
            tabIndex={0}
          >
            {camera.installPoint}
          </span>
        </div>
        <div className='flex gap-2'>
          <span className='text-white/50 whitespace-nowrap shrink-0'>เลขที่สัญญา :</span>
          <span className='text-white'>{camera.contractNo}</span>
        </div>
        <div className='flex gap-2'>
          <span className='text-white/50 whitespace-nowrap shrink-0'>หน่วยงานที่รับผิดชอบ :</span>
          <span className='font-medium' style={{ color: 'var(--yellow)' }}>{camera.bureau}</span>
        </div>
      </div>

      {/* Stats */}
      <div className='flex items-center justify-around pt-2'>

        {/* ทั้งหมด */}
        <div className='flex flex-col items-center gap-2'>
          <span
            className='fs-24 font-bold tabular-nums leading-none text-white'
          >
            {camera.totalCameras}
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
            style={{ color: camera.onlineCount === 0 ? '#66AEFF55' : '#66AEFF' }}
          >
            {camera.onlineCount}
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
            style={{ color: camera.offlineCount === 0 ? '#E94C4C55' : '#E94C4C' }}
          >
            {camera.offlineCount}
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

// ── Grid with bureau group headers ────────────────────────────────────────────

interface Props {
  cameras: CctvCameraEntry[]
}

const CardGridCctv: React.FC<Props> = ({ cameras }) => {
  const groups = useMemo(() => {
    const map = new Map<string, CctvCameraEntry[]>()
    for (const c of cameras) {
      const list = map.get(c.bureau) ?? []
      list.push(c)
      map.set(c.bureau, list)
    }
    return Array.from(map.entries()).map(([bureau, items]) => ({ bureau, items }))
  }, [cameras])

  if (cameras.length === 0) {
    return (
      <div className='py-12 text-center text-white/30 text-sm'>ไม่พบข้อมูล</div>
    )
  }

  return (
    <div className='flex flex-col gap-8'>
      {groups.map(({ bureau, items }) => (
        <div key={bureau} className='flex flex-col gap-4'>

          {/* Bureau header */}
          <div className='flex items-center gap-3'>
            <span className='text-white font-bold'>{bureau}</span>
            <span
              className='inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs'
              style={{ border: '1px solid var(--yellow)', color: 'var(--yellow)' }}
            >
              {items.length} โครงการ
            </span>
          </div>

          {/* Cards grid */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
            {items.map((camera) => (
              <CctvCard key={camera.id} camera={camera} />
            ))}
          </div>

        </div>
      ))}
    </div>
  )
}

export default React.memo<Props>(CardGridCctv)
