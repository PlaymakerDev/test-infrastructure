"use client"
import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, ConfigProvider } from 'antd'
import {
  TbAppWindow,
  TbArrowBigLeftFilled,
  TbInfoSquareRoundedFilled,
  TbWifi,
  TbWifiOff,
} from 'react-icons/tb'
import SwapButton from '@/components/swap-button/SwapButton'
import { useAppDispatch } from '@/stores/hooks'
import { setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { useDetailContext } from '../context'

interface Props {
  setCurrentTab: (value: string) => void
}

const OPTIONS = [
  { label: 'ภาพรวม', value: 'OVERALL' },
  { label: 'สรุปข้อมูลแยกจราจร', value: 'SUMMARY' },
]

const TitleSection: React.FC<Props> = ({ setCurrentTab }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()
  const { project } = useDetailContext()
  const isOnline = project.connection === 'online'
  const isInWarranty = project.warranty === 'in-warranty'
  // Pull project_id + road_id from URL — the overall list page passes both
  // when navigating to detail. Without them the Project Info modal can't
  // fetch contract data (no fallback inside detail's own endpoints).
  const projectIdParam = searchParams.get('project_id')
  const roadIdParam = searchParams.get('road_id')

  return (
    <div className='px-3'>
      <section className='flex items-start gap-3'>
        <TbArrowBigLeftFilled
          className='fs-24 text-(--yellow) cursor-pointer mt-2'
          onClick={() => router.back()}
        />
        <div className='flex-1 min-w-0'>
          <h1 className='text-(--yellow)'>Traffic Signal : สายทาง {project.roadCode}</h1>
          {/* ── Sub-info row ──
            * Mobile (< sm): stacks vertically (installPoint + pills below)
            * Desktop (sm+): single inline row — installPoint + info icon + pills
            *   all share the same row via `flex-wrap`. */}
          <div className='flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2'>
            <div className='flex items-center gap-2 w-full sm:w-auto'>
              <p className='text-(--yellow) mb-0'>{project.installPoint}</p>
              <TbInfoSquareRoundedFilled
                size={24}
                className='text-white cursor-pointer hover:text-(--yellow) shrink-0'
                title='ดูข้อมูลโครงการ'
                onClick={() =>
                  dispatch(
                    setProjectInfoModalOpen({
                      open: true,
                      project_id: projectIdParam ? Number(projectIdParam) : null,
                      road_id: roadIdParam ? Number(roadIdParam) : null,
                    }),
                  )
                }
              />
            </div>
            <span
              className={`inline-flex items-center justify-center gap-1.5 py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border ${
                isInWarranty
                  ? 'border-emerald-500 text-emerald-500'
                  : 'border-gray-500 text-gray-400'
              }`}
            >
              {isInWarranty ? 'ในค้ำ' : 'หมดค้ำ'}
            </span>
            {/* Anydesk + Google Map buttons — mirror the VMS detail header so
              * both features share visual language. Buttons always render; an
              * unset anydesk simply shows "-". */}
            <ConfigProvider
              theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}
            >
              <Button
                type='primary'
                htmlType='submit'
                size='middle'
                shape='round'
                icon={<TbAppWindow />}
                className='w-full! sm:w-auto!'
              >
                <p className='fs-12'>Anydesk : {project.anydeskId || '-'}</p>
              </Button>
            </ConfigProvider>
            <ConfigProvider
              theme={{ token: { colorPrimary: '#1B3F8B', colorTextLightSolid: '#FFFFFF' } }}
            >
              <Button
                type='primary'
                size='middle'
                shape='round'
                className='w-full! sm:w-auto!'
                onClick={() =>
                  window.open(
                    `https://maps.google.com/?q=${project.coord[1]},${project.coord[0]}`,
                    '_blank',
                  )
                }
              >
                <p>Google Map</p>
              </Button>
            </ConfigProvider>
            <span
              className={`inline-flex items-center justify-center gap-1.5 py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border ${
                isOnline ? 'border-blue-500 text-blue-500' : 'border-red-500 text-red-500'
              }`}
            >
              {isOnline ? <TbWifi /> : <TbWifiOff />}
              {isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
            </span>
          </div>
        </div>
      </section>
      <section className='mt-5 px-10'>
        <SwapButton
          options={OPTIONS}
          defaultActive='OVERALL'
          setLabelValue={(value) => setCurrentTab(value)}
        />
      </section>
    </div>
  )
}

export default React.memo<Props>(TitleSection)
