"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
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

// Same color map as ProjectInfoModal — keeps the warranty pill consistent
// across the detail header + the modal + the overall tables.
const WARRANTY_COLOR: Record<string, string> = {
  ในค้ำ: '#05F2DB',
  หมดค้ำ: '#979797',
  ก่อนค้ำ: '#FCD116',
}

const TitleSection: React.FC<Props> = ({ setCurrentTab }) => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { project } = useDetailContext()
  const isOnline = project.connection === 'online'
  // BE-driven Thai status (3 values). Fall back to the boolean when contract
  // data hasn't loaded yet, so the pill still renders something sensible.
  const warrantyLabel: string =
    project.warrantyStatus ?? (project.warranty === 'in-warranty' ? 'ในค้ำ' : 'หมดค้ำ')
  const warrantyColor = WARRANTY_COLOR[warrantyLabel] ?? '#979797'
  // project_id + road_id come from the screen's resolver (URL param → else
  // derived from central list by solution id), so the Project Info modal works
  // whether the user arrives from the overall table or the dashboard popup.

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
                      project_id: project.projectId ? Number(project.projectId) : null,
                      road_id: project.roadId ? Number(project.roadId) : null,
                    }),
                  )
                }
              />
            </div>
            {/* Same colors as ProjectInfoModal + overall tables — 3 states
              * (ในค้ำ / หมดค้ำ / ก่อนค้ำ) driven by BE's `warranty_status`. */}
            <span
              className='inline-flex items-center justify-center gap-1.5 py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border'
              style={{ borderColor: warrantyColor, color: warrantyColor }}
            >
              {warrantyLabel}
            </span>
            {/* Google Map + Anydesk buttons (Google Map first per Figma) —
              * mirror the VMS detail header so both features share visual
              * language. Buttons always render; an unset anydesk shows "-". */}
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
            <ConfigProvider
              theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}
            >
              <Button
                type='primary'
                size='middle'
                shape='round'
                icon={<TbAppWindow />}
                className='w-full! sm:w-auto!'
                // `opacity + cursor` instead of antd's `disabled` — disabled
                // turns the blue button into a dark-gray pill that's hard to
                // read on the page background. Opacity-50 keeps the blue + "-"
                // readable while still signalling "not clickable".
                style={{
                  opacity: project.anydeskId ? 1 : 0.5,
                  cursor: project.anydeskId ? 'pointer' : 'not-allowed',
                }}
                title={project.anydeskId ? `เปิด AnyDesk : ${project.anydeskId}` : 'ไม่มีรหัส AnyDesk'}
                onClick={() => {
                  if (!project.anydeskId) return
                  // `anydesk:` protocol opens the installed desktop client.
                  // Use location.href to avoid a Chrome blank-tab race.
                  window.location.href = `anydesk:${project.anydeskId}`
                }}
              >
                <p className='fs-12'>Anydesk : {project.anydeskId || '-'}</p>
              </Button>
            </ConfigProvider>
            {/* Online = #66AEFF (per Figma); offline stays red. */}
            <span
              className='inline-flex items-center justify-center gap-1.5 py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border'
              style={{
                borderColor: isOnline ? '#66AEFF' : '#ef4444',
                color: isOnline ? '#66AEFF' : '#ef4444',
              }}
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
