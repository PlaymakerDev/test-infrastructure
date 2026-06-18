"use client"
import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { MonitorSection, OverviewSection, SummaryReportSection, TitleSection } from '../components'
import { DetailProvider, useDetailContext } from '../context'
import { getTrafficLightingById } from '@/features/admin/traffic-lighting/overall/data/trafficLightingProjects'

interface Props {
  id: string
}

const DetailContent: React.FC = () => {
  const { currentTab } = useDetailContext()

  const renderContent = useMemo(() => {
    switch (currentTab) {
      case 'OVERVIEW':
        return <OverviewSection />
      case 'IOT_MONITOR':
        return <MonitorSection />
      case 'SUMMARY':
        return <SummaryReportSection />
      default:
        return null
    }
  }, [currentTab])

  return (
    <>
      <TitleSection />
      {renderContent && <section className='mt-8'>{renderContent}</section>}
    </>
  )
}

const TrafficLightingDetailScreen: React.FC<Props> = ({ id }) => {
  const router = useRouter()
  const project = getTrafficLightingById(id)

  if (!project) {
    return (
      <div className='main-screen px-3 sm:px-6 xl:px-10 pt-3 pb-6'>
        <h1 className='text-[#FCD116] font-bold'>ไม่พบข้อมูลสายทาง</h1>
        <p className='text-white/70 mt-2'>ID: {id}</p>
        <button
          className='mt-4 px-4 py-2 rounded bg-[#FCD116] text-[#212121] font-semibold cursor-pointer border-0'
          onClick={() => router.push('/admin/traffic-lighting')}
          type='button'
        >
          กลับ
        </button>
      </div>
    )
  }

  return (
    <DetailProvider project={project}>
      <div className='main-screen px-3 sm:px-6 xl:px-10 pt-3 pb-6'>
        <DetailContent />
      </div>
    </DetailProvider>
  )
}

export default React.memo(TrafficLightingDetailScreen)
