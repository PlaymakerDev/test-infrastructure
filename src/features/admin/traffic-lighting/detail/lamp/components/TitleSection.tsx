"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import { Button, ConfigProvider } from 'antd'
import { TbArrowBigLeftFilled, TbInfoCircleFilled, TbWifi, TbWifiOff } from 'react-icons/tb'
import ModalInfoTrafficLighting from '@/features/admin/traffic-lighting/overall/components/ModalInfoTrafficLighting'
import type { TrafficLightingProject } from '@/features/admin/traffic-lighting/overall/data/trafficLightingProjects'
import { useLampContext } from '../context'
import { useState } from 'react'

/** Header badge sizing — copied verbatim from the shared `DetailTitleSection`
 *  (components/section/DetailTitleSection.tsx) so this header matches the phase
 *  detail page: 14px text, 2px/14px padding, 28px tall. The local `Pill`
 *  component (`px-3 py-1` → 32px) is still right for table cells, but was 4px
 *  too tall for this row. Action buttons stay AntD 32px — that split is
 *  intentional. */
const BADGE_CLASS =
  'inline-flex items-center justify-center gap-1.5 py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border'

const WARRANTY_COLORS = {
  'in-warranty': '#05F2DB',
  expired: '#979797',
  unknown: '#979797',
} as const

const CONNECTION_COLORS = {
  online: '#66AEFF',
  offline: '#E94C4C',
  unknown: '#979797',
} as const

/** Lamp header — back arrow + title + pills + Google Map. No tabs (lamp is a
 *  single screen, unlike phase which has 3 tabs). */
const LampTitleSection: React.FC = () => {
  const router = useRouter()
  const { project } = useLampContext()
  const isOnline = project.connection === 'online'
  const [infoProject, setInfoProject] = useState<TrafficLightingProject | null>(null)
  const warrantyLabel = project.warranty === 'in-warranty'
    ? 'ในค้ำ'
    : project.warranty === 'expired' ? 'หมดค้ำ' : '-'
  const connectionLabel = project.connection === 'online'
    ? 'ออนไลน์'
    : project.connection === 'offline' ? 'ออฟไลน์' : '-'

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
            Street Light : สายทาง {project.roadCode}
          </h1>
          {/* Row spacing, subtitle size, icon size and pill sizing all mirror
              DetailTitleSection (the phase detail header) so this page reads
              identically: no `mt-2`, plain 16px `<p>`, 24px ⓘ, 28px pills. */}
          <div className='flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2'>
            <div className='flex items-center gap-2 w-full sm:w-auto'>
              <p className='text-white mb-0'>
                {project.installPoint}
              </p>
              <TbInfoCircleFilled
                size={24}
                className='text-white cursor-pointer hover:text-[#FCD116] shrink-0'
                title='ดูข้อมูลโครงการ'
                onClick={() => setInfoProject(project)}
              />
            </div>
            <span
              className={BADGE_CLASS}
              style={{ borderColor: WARRANTY_COLORS[project.warranty], color: WARRANTY_COLORS[project.warranty] }}
            >
              {warrantyLabel}
            </span>
            <ConfigProvider
              theme={{ token: { colorPrimary: '#003F87', colorTextLightSolid: '#FFFFFF' } }}
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
            <span
              className={BADGE_CLASS}
              style={{ borderColor: CONNECTION_COLORS[project.connection], color: CONNECTION_COLORS[project.connection] }}
            >
              {project.connection === 'unknown'
                ? null
                : isOnline ? <TbWifi /> : <TbWifiOff />}
              {connectionLabel}
            </span>
          </div>
        </div>
      </section>

      <ModalInfoTrafficLighting
        project={infoProject}
        onClose={() => setInfoProject(null)}
      />
    </div>
  )
}

export default React.memo(LampTitleSection)
