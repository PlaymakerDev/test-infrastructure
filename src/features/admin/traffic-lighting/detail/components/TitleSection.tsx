"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, ConfigProvider } from 'antd'
import {
  TbArrowBigLeftFilled,
  TbInfoCircleFilled,
  TbWifi,
  TbWifiOff,
} from 'react-icons/tb'
import ModalInfoTrafficLighting from '@/features/admin/traffic-lighting/overall/components/ModalInfoTrafficLighting'
import type { TrafficLightingProject } from '@/features/admin/traffic-lighting/overall/data/trafficLightingProjects'
import { useDetailContext } from '../context'
import Pill from './Pill'
import TabSection from './TabSection'

const WARRANTY_COLORS = {
  'in-warranty': '#05F2DB',
  expired: '#979797',
} as const

const CONNECTION_COLORS = {
  online: '#66AEFF',
  offline: '#E94C4C',
} as const

const TitleSection: React.FC = () => {
  const router = useRouter()
  const { project } = useDetailContext()
  const isOnline = project.connection === 'online'
  const isInWarranty = project.warranty === 'in-warranty'
  const [infoProject, setInfoProject] = useState<TrafficLightingProject | null>(null)

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/admin/traffic-lighting')
    }
  }

  return (
    <div>
      <section className='flex items-start gap-3'>
        <TbArrowBigLeftFilled
          className='fs-24 text-[#FCD116] cursor-pointer mt-2 shrink-0'
          onClick={handleBack}
        />
        <div className='flex-1 min-w-0'>
          <h1 className='text-[20px] sm:text-[24px] font-bold text-[#FCD116] m-0'>
            Traffic Lighting : สายทาง {project.roadCode}
          </h1>
          <div className='flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 mt-2'>
            <div className='flex items-center gap-2 w-full sm:w-auto'>
              <p className='text-white mb-0 text-[13px] sm:text-[14px]'>
                {project.installPoint}
              </p>
              <TbInfoCircleFilled
                size={22}
                className='text-white cursor-pointer hover:text-[#FCD116] shrink-0'
                title='ดูข้อมูลโครงการ'
                onClick={() => setInfoProject(project)}
              />
            </div>
            <Pill
              text={isInWarranty ? 'ในค้ำ' : 'หมดค้ำ'}
              color={WARRANTY_COLORS[project.warranty]}
            />
            <ConfigProvider
              theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#212121' } }}
            >
              <Button
                type='primary'
                size='middle'
                shape='round'
                className='w-full! sm:w-auto!'
                onClick={() => {
                  const [lng, lat] = project.coord ?? [0, 0]
                  if (lng !== 0 || lat !== 0) {
                    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank')
                    return
                  }
                  const query = [project.roadCode, project.installPoint].filter(Boolean).join(' ')
                  window.open(`https://www.google.com/maps?q=${encodeURIComponent(query)}`, '_blank')
                }}
              >
                Google Map
              </Button>
            </ConfigProvider>
            <Pill
              text={isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
              color={CONNECTION_COLORS[project.connection]}
              icon={isOnline ? <TbWifi size={14} /> : <TbWifiOff size={14} />}
            />
          </div>
        </div>
      </section>

      <TabSection />

      <ModalInfoTrafficLighting
        project={infoProject}
        onClose={() => setInfoProject(null)}
      />
    </div>
  )
}

export default React.memo(TitleSection)
