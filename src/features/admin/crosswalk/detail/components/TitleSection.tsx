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
  useCrosswalkCentralList,
  useCrosswalkSolutionDetail,
} from '@/hooks/queries/crosswalk'
import { useDeptId } from '@/hooks/useDeptId'
import { useDetailContext } from '../context'

interface Props {
  setCurrentTab: (value: string) => void
}

const OPTIONS = [
  { label: 'ภาพรวม', value: 'OVERALL' },
  { label: 'ข้อมูลการฝ่าฝืนสัญญาณไฟทางข้าม', value: 'VIOLATION' },
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

  // Warranty + connection flags come from the central-list response — cached
  // when the user navigated in from the overall page, so this is free.
  // Crosswalk connection status uses `crosswalk.is_online` (the ทางข้าม
  // device health), NOT the camera's online state.
  const { data: centralData } = useCrosswalkCentralList(deptId)
  const match = (centralData ?? [])
    .flatMap((bureau) => bureau.sub_department ?? [])
    .flatMap((subDept) => subDept.solutions ?? [])
    .find((sol) => String(sol.solution.id) === String(id))
  const status = match
    ? { isOnline: match.crosswalk.is_online, isWarranty: match.is_warranty }
    : null

  // AnyDesk lives on the shared `/manage/solution/details/{id}` endpoint.
  const { data: solDetail } = useCrosswalkSolutionDetail(id)
  const anydeskId: string | undefined =
    solDetail?.anydesk == null ? undefined : String(solDetail.anydesk)

  const isOnline = status?.isOnline ?? false
  const isInWarranty = status?.isWarranty ?? false

  const roadCode = location?.road.code_name ?? '-'
  const installPoint = location?.solution.solution_name ?? '-'
  const coord = location?.GeometryPoint

  return (
    <div className='px-3'>
      <section className='flex items-start gap-3'>
        <TbArrowBigLeftFilled
          className='fs-24 text-(--yellow) cursor-pointer mt-2'
          onClick={() => router.back()}
        />
        <div className='flex-1 min-w-0'>
          <h1 className='text-(--yellow)'>Crosswalk : สายทาง {roadCode}</h1>
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
                      project_id: projectIdParam ? Number(projectIdParam) : null,
                      road_id: roadIdParam ? Number(roadIdParam) : null,
                    })
                  )
                }
              />
            </div>

            {/* Warranty pill */}
            <span
              className={`inline-flex items-center justify-center gap-1.5 py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border ${
                isInWarranty
                  ? 'border-emerald-500 text-emerald-500'
                  : 'border-gray-500 text-gray-400'
              }`}
            >
              {isInWarranty ? 'ในค้ำ' : 'หมดค้ำ'}
            </span>

            {/* AnyDesk button — mirrors traffic-volume: always renders when
              * the field is present (even empty string), with opacity + cursor
              * signalling clickability. */}
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
                    window.location.href = `anydesk:${anydeskId}`
                  }}
                >
                  <p className='fs-12'>Anydesk : {anydeskId || '-'}</p>
                </Button>
              </ConfigProvider>
            )}

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

            {/* Online / Offline pill — uses central-list `crosswalk.is_online`. */}
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
