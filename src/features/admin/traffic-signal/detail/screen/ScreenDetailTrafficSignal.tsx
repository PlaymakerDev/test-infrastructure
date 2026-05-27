"use client"
import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TitleSection, OverallSection, SummaryTrafficSection } from '../components'
import { DetailProvider } from '../context'
import { getTrafficSignalById } from '@/features/admin/traffic-signal/overall/data/trafficSignals'

interface Props {
  id: string
}

const ScreenDetailTrafficSignal: React.FC<Props> = ({ id }) => {
  const router = useRouter()
  const project = getTrafficSignalById(id)
  const [currentTab, setCurrentTab] = useState('OVERALL')

  const renderContent = useMemo(() => {
    switch (currentTab) {
      case 'OVERALL':
        return <OverallSection />
      case 'SUMMARY':
        return <SummaryTrafficSection />
      default:
        return <OverallSection />
    }
  }, [currentTab])

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

  return (
    <DetailProvider project={project}>
      <div className='main-screen'>
        <TitleSection setCurrentTab={setCurrentTab} />
        <section className='mt-8 px-10'>{renderContent}</section>
      </div>
    </DetailProvider>
  )
}

export default React.memo<Props>(ScreenDetailTrafficSignal)
