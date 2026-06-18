"use client"
import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TitleSection, OverallSection, SummaryTrafficSection } from '../components'
import { DetailProvider } from '../context'
import {
  useTrafficContractInfo,
  useTrafficSolutionDetail,
  useTrafficDetails,
  useTrafficPhaseDetails,
  useTrafficOverview,
  useTrafficCameraCentralList,
} from '@/hooks/queries/traffic-signal'
import { useDeptId } from '@/hooks/useDeptId'
import type {
  TrafficSignalProject,
  SignalPhase,
  OperatingMode,
  PhaseTimingConfig,
} from '@/features/admin/traffic-signal/overall/data/trafficSignals'

interface Props {
  id: string
}

const ScreenDetailTrafficSignal: React.FC<Props> = ({ id }) => {
  const router = useRouter()
  const deptId = useDeptId()
  const [currentTab, setCurrentTab] = useState('OVERALL')

  // All detail endpoints take the same id (the legacy-style solution_id =
  // `project.id` from the list endpoint). TanStack Query dedupes shared keys
  // across components.
  const contractInfo = useTrafficContractInfo(id)
  const solutionDetail = useTrafficSolutionDetail(id)
  const details = useTrafficDetails(id)
  const phaseDetails = useTrafficPhaseDetails(id)
  // Detail endpoints don't expose coords — reuse the overview endpoint with
  // `solution_id` filter to fetch this signal's GeometryPoint. Cache shared
  // with the overall page when the user came from there.
  const overview = useTrafficOverview(deptId, { solution_id: id })
  // Bureau-wide camera tree — used as the eventual source for `anydesk`
  // (BE will add that field). Cached once per dept so it's effectively free
  // after the first hit.
  const cameraCentral = useTrafficCameraCentralList(deptId)

  // Combine multi-endpoint data into the legacy `TrafficSignalProject` shape
  // so existing components (which read fields off context.project) keep
  // working without per-component refactors. Placeholders fill fields the
  // API doesn't expose.
  const project = useMemo<TrafficSignalProject | null>(() => {
    const contract = contractInfo.data
    const solution = solutionDetail.data
    const detailItem = details.data?.[0]
    // Backend may return `null` instead of `[]` for solutions with no
    // configured phases — treat both the same and let downstream components
    // render an empty Phase Timing card.
    const phases = phaseDetails.data ?? []
    // Coords from the overview endpoint (filtered to this solution_id). Falls
    // back to [0, 0] which the map treats as "no data" → empty area.
    const coord = overview.data?.locations[0]?.GeometryPoint ?? [0, 0]
    // Only the main detail is critical. Phases / contract / solution detail
    // are all optional — page renders with placeholders for what's missing.
    if (!detailItem) return null

    const phaseTiming: PhaseTimingConfig[] = phases.map((p) => ({
      phase: p.phase_no,
      greenSec: p.green_time,
      redSec: p.waiting_time,
      isActive: p.is_active,
      timestamp: p.timestamp,
    }))

    // No `is_online` on the detail endpoint — infer from any phase being
    // active. Falls back to false if no phase is currently flagged (or no
    // phase data at all).
    const isOnline = phases.some((p) => p.is_active)

    // Warranty is derived from dates — compare to today. Without contract
    // data we can't know, so default to "expired".
    let warranty: 'in-warranty' | 'expired' = 'expired'
    if (contract?.warranty_end_date) {
      const endDate = new Date(contract.warranty_end_date).getTime()
      warranty = !isNaN(endDate) && endDate >= Date.now() ? 'in-warranty' : 'expired'
    }

    // Road code + solution name live on the overview endpoint (not on the
    // detail endpoints), so reuse the same overview fetch.
    const overviewLoc = overview.data?.locations[0]
    const roadCode = overviewLoc?.road.code_name ?? '-'
    const installPoint = overviewLoc?.solution.solution_name ?? contract?.project_name ?? '-'

    // Find this solution in the bureau-wide camera tree to read `anydesk`
    // (and any future per-solution fields). Falls back to the legacy
    // /manage/solution/details endpoint while BE rolls out the field.
    let centralSolution: { anydesk?: number | string | null } | undefined
    for (const bureau of cameraCentral.data ?? []) {
      for (const subDept of bureau.sub_department) {
        const found = subDept.solutions.find((s) => String(s.solution.id) === id)
        if (found) {
          centralSolution = found
          break
        }
      }
      if (centralSolution) break
    }
    const anydeskRaw = centralSolution?.anydesk ?? solution?.anydesk
    const anydeskId = anydeskRaw ? String(anydeskRaw) : undefined

    return {
      id,
      roadCode,
      projectName: contract?.project_name ?? installPoint,
      installPoint,
      contractNo: contract?.contract_no ?? '-',
      warranty,
      connection: isOnline ? 'online' : 'offline',
      stream: isOnline,
      phase: (detailItem.total_phases === 3 ? 3 : 4) as SignalPhase,
      operatingMode: detailItem.controller_mode as OperatingMode,
      bureau: contract?.department_name ?? '-',
      coord,
      totalCameras: detailItem.total_pcu,
      onlineCameras: isOnline ? detailItem.total_pcu : 0,
      offlineCameras: isOnline ? 0 : detailItem.total_pcu,
      // Detail-page-only fields
      anydeskId,
      efficiency: detailItem.efficiency,
      dailyPCU: detailItem.total_pcu,
      peakHourTraffic: detailItem.max_active_time,
      peakPhase: detailItem.max_active_phase,
      phaseTiming,
    }
  }, [id, contractInfo.data, solutionDetail.data, details.data, phaseDetails.data, overview.data, cameraCentral.data])

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

  // Loading state — only block on the main detail endpoint. Everything else
  // can stream in (phases, contract, solution) without blocking first paint.
  if (details.isLoading) {
    return (
      <div className='main-screen px-10 pt-10 flex items-center justify-center'>
        <div className='flex flex-col items-center gap-3'>
          <div className='w-10 h-10 border-2 border-(--yellow) border-t-transparent rounded-full animate-spin' />
          <p className='text-white/70'>กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  // Error / not-found fallback — shows per-endpoint status so it's obvious
  // *which* API call returned nothing. Helps decide whether the ID is wrong
  // or the backend needs to fix a specific endpoint.
  if (!project) {
    const endpoints = [
      {
        label: 'GET /traffic/details/{id}',
        purpose: 'main detail (PCU, mode, efficiency)',
        critical: true,
        query: details,
      },
      {
        label: 'GET /traffic/details/phase_details/{id}',
        purpose: 'phase timing',
        critical: false,
        query: phaseDetails,
      },
      {
        label: 'GET /manage/solution/details/{id}',
        purpose: 'AnyDesk id',
        critical: false,
        query: solutionDetail,
      },
      {
        label: 'GET /manage/contract/{id}',
        purpose: 'project name, contract no, warranty',
        critical: false,
        query: contractInfo,
      },
    ]

    const statusText = (
      q: { isLoading: boolean; isError: boolean; data: unknown; error: unknown },
    ) => {
      if (q.isLoading) return { text: 'LOADING', color: 'text-yellow-400' }
      if (q.isError) {
        const msg =
          q.error instanceof Error ? q.error.message : String(q.error ?? 'unknown')
        return { text: `ERROR — ${msg}`, color: 'text-red-400' }
      }
      if (q.data === undefined) return { text: 'NOT FETCHED', color: 'text-gray-400' }
      if (Array.isArray(q.data) && q.data.length === 0)
        return { text: 'EMPTY ARRAY', color: 'text-orange-400' }
      if (q.data === null) return { text: 'NULL', color: 'text-orange-400' }
      return { text: 'OK', color: 'text-emerald-400' }
    }

    return (
      <div className='main-screen px-10 pt-10'>
        <h1 className='text-(--yellow)'>ไม่พบข้อมูลสายทาง</h1>
        <p className='text-white/70 mt-2'>
          Solution ID: <span className='text-white'>{id}</span>
        </p>

        <div className='mt-6 rounded-lg border border-white/10 bg-black/30 p-4 max-w-3xl'>
          <p className='text-white/80 font-semibold mb-3'>สถานะ API endpoint</p>
          <ul className='space-y-2'>
            {endpoints.map((e) => {
              const s = statusText(e.query)
              return (
                <li key={e.label} className='flex flex-col gap-0.5 text-xs'>
                  <div className='flex items-center gap-2'>
                    <span className={`font-bold ${s.color}`}>{s.text}</span>
                    {e.critical && (
                      <span className='text-[10px] px-1.5 rounded bg-red-500/20 text-red-300'>
                        critical
                      </span>
                    )}
                    <span className='text-white/90 font-mono'>{e.label}</span>
                  </div>
                  <span className='text-white/40 pl-2'>↳ {e.purpose}</span>
                </li>
              )
            })}
          </ul>
          <p className='text-white/50 text-xs mt-3'>
            ต้องมี endpoint "critical" ทำงานถึง render ได้
          </p>
        </div>

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
