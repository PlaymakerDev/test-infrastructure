"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import { TitleSection, OverallSection } from '../components'
import { getBridgeProjectById } from '@/features/admin/bridge-lighting/overall/data/bridgeProjects'

interface Props {
  id: string
}

const BridgeLightingDetailScreen: React.FC<Props> = ({ id }) => {
  const router = useRouter()
  const bridge = getBridgeProjectById(id)

  // ── Guard: id not found → show fallback with a back button ──
  if (!bridge) {
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

  return (
    <div className='main-screen'>
      <TitleSection bridge={bridge} />
      <section className='mt-5 px-10'>
        <OverallSection bridge={bridge} />
      </section>
    </div>
  )
}

export default React.memo<Props>(BridgeLightingDetailScreen)
