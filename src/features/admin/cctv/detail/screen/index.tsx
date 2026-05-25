"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import { TitleSection, OverallSection } from '../components'
import { getCctvInstallDetailById } from '@/features/admin/cctv/overall/data/cctvData'

interface Props {
  id: string
}

const CctvDetailScreen: React.FC<Props> = ({ id }) => {
  const router = useRouter()
  const detail = getCctvInstallDetailById(id)

  if (!detail) {
    return (
      <div className='main-screen px-10 pt-10'>
        <h1 className='text-(--yellow)'>ไม่พบข้อมูลกล้อง CCTV</h1>
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
      <TitleSection detail={detail} />
      <section className='mt-5 px-10'>
        <OverallSection detail={detail} />
      </section>
    </div>
  )
}

export default React.memo<Props>(CctvDetailScreen)
