"use client"
import React, { useMemo } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
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
  useIncidentCentralList,
  useIncidentSolutionCameras,
  useIncidentCameraTotals,
  useIncidentSolutionDetail,
} from '@/hooks/queries/incident-detection'
import { useDeptId } from '@/hooks/useDeptId'

interface Props {
  currentTab: string
  setCurrentTab: (value: string) => void
}

const OPTIONS = [
  { label: 'ภาพรวม', value: 'OVERALL' },
  { label: 'รายงานเหตุการณ์', value: 'EVENTS' },
]

/** Detail header — mirrors the traffic-signal detail header (same layout +
 *  buttons). Data sources:
 *  - road code / warranty: `/overview/central/list` (overall table source).
 *  - install point name: `/manage/solution/details/{id}` solution_name (with
 *    central-list as fallback).
 *  - anydesk + coord: `/manage/solution/details/{id}`.
 *  - online indicator: `/cameras/totals` (live).
 *
 *  Falling back to central/list for road/warranty keeps the header working even
 *  for "Analytic :"-prefixed solutions, where the `/cameras*` endpoints return
 *  0 despite the cameras existing (BE bug — see memory). */
const TitleSection: React.FC<Props> = ({ currentTab, setCurrentTab }) => {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()
  const deptId = useDeptId()
  const solutionId = Array.isArray(params.id) ? params.id[0] : params.id

  const { data: central } = useIncidentCentralList(deptId)
  const { data: totals } = useIncidentCameraTotals(deptId, { solution_id: solutionId })
  const { data: solutionDetail } = useIncidentSolutionDetail(solutionId)
  // Same cache as MapSection — only fetches the geometry needed by the map.
  // We only read its centroid as a fallback for the Google Map button.
  const { data: camerasGeo } = useIncidentSolutionCameras(deptId, solutionId)

  // Find this solution inside the bureau → แขวง → solutions tree.
  const solution = useMemo(() => {
    if (!solutionId || !central) return null
    const target = String(solutionId)
    for (const bureau of central) {
      for (const sub of bureau.sub_department) {
        for (const sol of sub.solutions) {
          if (String(sol.solution.id) === target) return sol
        }
      }
    }
    return null
  }, [central, solutionId])

  const roadCode = solution?.road.code_name ?? '-'
  // Prefer /manage's solution_name (authoritative canonical name) — falls back
  // to central/list while /manage is loading or fails.
  const installPoint =
    solutionDetail?.solution_name ?? solution?.solution.solution_name ?? '-'
  const isInWarranty = solution?.is_warranty ?? false
  const onlineCount =
    totals?.camera.online ??
    solution?.camera.online_count ??
    (solution
      ? (solution.camera.total ?? 0) - (solution.camera.offline_count ?? 0)
      : 0)
  const isOnline = onlineCount > 0

  // Anydesk: undefined while loading → button hidden by `disabled` style;
  //          '' loaded-but-unset → muted "-" placeholder;
  //          value → shown verbatim.
  const anydeskId = solutionDetail?.anydesk

  // URL params take precedence (so deep-links keep working), but fall back to
  // central/list's lookup for the same solution. Lets the Project Info modal
  // open with real data even when the user navigates directly to /detail/{id}
  // without project_id / road_id in the URL.
  const projectIdParam =
    searchParams.get('project_id') ?? (solution ? String(solution.project.id) : null)
  const roadIdParam =
    searchParams.get('road_id') ?? (solution ? String(solution.road.id) : null)

  // Coord priority: /manage geometry (canonical) → cameras endpoint centroid →
  // first camera with a coord → null (disable button).
  const coord: [number, number] | null = useMemo(() => {
    const fromSolution = solutionDetail?.geometry_point
    if (fromSolution && Array.isArray(fromSolution) && fromSolution.length === 2) {
      return fromSolution as [number, number]
    }
    if (camerasGeo?.centroid) return camerasGeo.centroid
    const fc = camerasGeo?.cameras?.find((c) => Array.isArray(c.geometry_point))
    return (fc?.geometry_point as [number, number] | undefined) ?? null
  }, [solutionDetail?.geometry_point, camerasGeo])

  return (
    <div className='px-3'>
      <section className='flex items-start gap-3'>
        <TbArrowBigLeftFilled
          className='fs-24 text-(--yellow) cursor-pointer mt-2'
          onClick={() => router.back()}
        />
        <div className='flex-1 min-w-0'>
          <h1 className='text-(--yellow)'>Incident Detection : สายทาง {roadCode}</h1>
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
                    }),
                  )
                }
              />
            </div>
            {/* Same colors as the warranty pill in ProjectInfoModal + the
              * overall tables — keeps "ในค้ำ" visually consistent everywhere. */}
            <span
              className='inline-flex items-center justify-center gap-1.5 py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border'
              style={{
                borderColor: isInWarranty ? '#05F2DB' : '#979797',
                color: isInWarranty ? '#05F2DB' : '#979797',
              }}
            >
              {isInWarranty ? 'ในค้ำ' : 'หมดค้ำ'}
            </span>
            {/* Google Map + Anydesk buttons (Google Map first per Figma) —
              * same visual language as the Traffic Signal / VMS detail headers. */}
            <ConfigProvider
              theme={{ token: { colorPrimary: '#1B3F8B', colorTextLightSolid: '#FFFFFF' } }}
            >
              <Button
                type='primary'
                size='middle'
                shape='round'
                className='w-full! sm:w-auto!'
                disabled={!coord}
                onClick={() => {
                  if (!coord) return
                  window.open(`https://maps.google.com/?q=${coord[1]},${coord[0]}`, '_blank')
                }}
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
                // Opacity instead of `disabled` — disabled turns the blue
                // button into a dark-gray pill that's hard to read.
                style={{
                  opacity: anydeskId ? 1 : 0.5,
                  cursor: anydeskId ? 'pointer' : 'not-allowed',
                }}
                title={anydeskId ? `เปิด AnyDesk : ${anydeskId}` : 'ไม่มีรหัส AnyDesk'}
                onClick={() => {
                  if (!anydeskId) return
                  // `anydesk:` is the desktop-app protocol. Browser shows the
                  // "Open AnyDesk?" confirmation and launches the installed
                  // client — falls back to a browser error if AnyDesk isn't
                  // installed. Don't `window.open` it; that races a blank tab
                  // with the protocol handler in Chrome.
                  window.location.href = `anydesk:${anydeskId}`
                }}
              >
                <p className='fs-12'>Anydesk : {anydeskId || '-'}</p>
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
          activeValue={currentTab}
          setLabelValue={(value) => setCurrentTab(value)}
        />
      </section>
    </div>
  )
}

export default React.memo<Props>(TitleSection)
