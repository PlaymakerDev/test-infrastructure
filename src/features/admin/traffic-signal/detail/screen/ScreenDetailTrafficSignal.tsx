"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import { getTrafficSignalById } from '@/features/admin/traffic-signal/overall/data/trafficSignals'

interface Props {
  id: string
}

const ScreenDetailTrafficSignal: React.FC<Props> = ({ id }) => {
  const router = useRouter()
  const project = getTrafficSignalById(id)

  // ── Guard: id not found → show fallback with a back button ──
  if (!project) {
    return (
      <div className='main-screen px-10 pt-10'>
        <h1 className='text-(--yellow)'>ไม่พบข้อมูลสายทาง</h1>
        <p className='text-white/70 mt-2'>ID: {id}</p>
        <button
          className='mt-4 px-4 py-2 rounded bg-(--yellow) text-black font-semibold'
          onClick={() => router.back()}
          type='button'
        >
          กลับ
        </button>
      </div>
    )
  }

  // ── Placeholder body — sections will be filled in next. ──
  return (
    <div className='main-screen px-10 pt-10'>
      <h1 className='text-(--yellow)'>{project.projectName}</h1>
      <p className='text-white/70 mt-2'>{project.installPoint}</p>
    </div>
  )
}

export default React.memo<Props>(ScreenDetailTrafficSignal)
