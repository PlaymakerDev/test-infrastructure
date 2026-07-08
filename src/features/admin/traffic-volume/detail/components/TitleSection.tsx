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
import {
  useTrafficVolumeCentralList,
  useTrafficVolumeSolutionDetail,
} from '@/hooks/queries/traffic-volume'
import { useDeptId } from '@/hooks/useDeptId'
import { useDetailContext } from '../context'

interface Props {
  setCurrentTab: (value: string) => void
}

const OPTIONS = [
  { label: 'ภาพรวม', value: 'OVERALL' },
  { label: 'วิเคราะห์ปริมาณจราจร', value: 'ANALYTIC' },
  { label: 'สถิติรายชั่วโมงแยกตามประเภท', value: 'STAT_HOUR' },
  { label: 'รายงานการนับปริมาณจราจร', value: 'REPORT' },
]

const TitleSection: React.FC<Props> = ({ setCurrentTab }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()
  const deptId = useDeptId()
  const { id, location } = useDetailContext()

  // Pull project_id + road_id from the URL — the overall list page passes
  // both when navigating here so the Project Info modal can fetch contract
  // data without needing a dedicated detail endpoint.
  const projectIdParam = searchParams.get('project_id')
  const roadIdParam = searchParams.get('road_id')

  // Warranty + online flags come from the central-list response — cached
  // when the user navigated in from the overall page, so this is free.
  // No useMemo: React Compiler auto-memoizes when `reactCompiler: true`
  // (next.config.ts). Manual useMemo with nested for-loops + early return
  // blocked the compiler ("could not preserve existing memoization").
  const { data: centralData } = useTrafficVolumeCentralList(deptId)
  const match = (centralData ?? [])
    .flatMap((bureau) => bureau.sub_department)
    .flatMap((subDept) => subDept.solutions)
    .find((sol) => String(sol.solution.id) === String(id))
  const status = match
    ? { isOnline: match.camera.is_online, isWarranty: match.is_warranty }
    : null

  // project_id + road_id for the Project Info modal: prefer the URL params
  // (passed by the overall table), else DERIVE from the matched central-list
  // row — so arriving from the dashboard marker popup (which has no project_id
  // in the URL) still opens a fully-populated ⓘ modal. Mirrors cctv detail.
  const projectId = projectIdParam ? Number(projectIdParam) : match?.project.id ?? null
  const roadId = roadIdParam ? Number(roadIdParam) : match?.road.id ?? null

  // AnyDesk lives on the shared `/manage/solution/details/{id}` endpoint.
  const { data: solDetail } = useTrafficVolumeSolutionDetail(id)
  // Preserve the empty-string case — title shows a muted "no number set"
  // button so users know AnyDesk is a configurable field for this solution.
  const anydeskId: string | undefined =
    solDetail?.anydesk == null ? undefined : String(solDetail.anydesk)

  const isOnline = status?.isOnline ?? false
  const isInWarranty = status?.isWarranty ?? false

  const roadCode = location?.road.code_name ?? '-'
  const installPoint = location?.solution.solution_name ?? '-'
  const coord = location?.geometry_point

  return (
    <div className='px-3'>
      <section className='flex items-start gap-3'>
        <TbArrowBigLeftFilled
          className='fs-24 text-(--yellow) cursor-pointer mt-2'
          onClick={() => router.back()}
        />
        <div className='flex-1 min-w-0'>
          <h1 className='text-(--yellow)'>
            Traffic Volume : สายทาง {roadCode}
          </h1>
          {/* Mobile (< sm): stacks vertically. Desktop (sm+): single inline row. */}
          <div className='flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2'>
            <div className='flex items-center gap-2 w-full sm:w-auto'>
              <p className='text-(--yellow) mb-0'>{installPoint}</p>
              <TbInfoSquareRoundedFilled
                size={24}
                className='text-white cursor-pointer hover:text-(--yellow) shrink-0'
                title='ดูข้อมูลโครงการ'
                onClick={() =>
                  dispatch(
                    setProjectInfoModalOpen({
                      open: true,
                      project_id: projectId,
                      road_id: roadId,
                    })
                  )
                }
              />
            </div>

            {/* Warranty pill — same colors as every other menu (cyan #05F2DB
              * in-warranty / gray #979797 expired), matching the overall tables
              * + ProjectInfoModal. */}
            <span
              className='inline-flex items-center justify-center gap-1.5 py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border'
              style={{
                borderColor: isInWarranty ? '#05F2DB' : '#979797',
                color: isInWarranty ? '#05F2DB' : '#979797',
              }}
            >
              {isInWarranty ? 'ในค้ำ' : 'หมดค้ำ'}
            </span>

            {/* Google Map + Anydesk buttons (Google Map first per Figma).
              * Anydesk uses `opacity + cursor` instead of antd's `disabled`
              * (disabled turns the blue button into a hard-to-read dark pill);
              * opacity-50 keeps the blue + "-" readable while signalling
              * "not clickable". */}
            {coord && (
              <ConfigProvider
                theme={{
                  token: { colorPrimary: '#1B3F8B', colorTextLightSolid: '#FFFFFF' },
                }}
              >
                <Button
                  type='primary'
                  size='middle'
                  shape='round'
                  className='w-full! sm:w-auto!'
                  onClick={() =>
                    window.open(
                      `https://maps.google.com/?q=${coord[1]},${coord[0]}`,
                      '_blank'
                    )
                  }
                >
                  <p>Google Map</p>
                </Button>
              </ConfigProvider>
            )}

            {anydeskId !== undefined && (
              <ConfigProvider
                theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}
              >
                <Button
                  type='primary'
                  size='middle'
                  shape='round'
                  icon={<TbAppWindow />}
                  className='w-full! sm:w-auto!'
                  style={{
                    opacity: anydeskId ? 1 : 0.5,
                    cursor: anydeskId ? 'pointer' : 'not-allowed',
                  }}
                  title={anydeskId ? `เปิด AnyDesk : ${anydeskId}` : 'ไม่มีรหัส AnyDesk'}
                  onClick={() => {
                    if (!anydeskId) return
                    // `anydesk:` protocol opens the installed desktop client.
                    // Use location.href to avoid a Chrome blank-tab race.
                    window.location.href = `anydesk:${anydeskId}`
                  }}
                >
                  <p className='fs-12'>Anydesk : {anydeskId || '-'}</p>
                </Button>
              </ConfigProvider>
            )}

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
