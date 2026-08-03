"use client"
import React, { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TitleSection, OverallSection, SummaryTrafficSection } from '../components'
import { DetailProvider } from '../context'
import { CCTVModal, ProjectInfoModal } from '@/components/modal'
import {
  useTrafficContractInfo,
  useTrafficSolutionDetail,
  useTrafficDetails,
  useTrafficPhaseDetails,
  useTrafficOverview,
  useTrafficCentralList,
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
  const searchParams = useSearchParams()
  const deptId = useDeptId()
  const [currentTab, setCurrentTab] = useState('OVERALL')

  // `/manage/contract/{id}` is PROJECT-scoped, not solution-scoped. We need
  // the project_id. Prefer the URL param (passed by the overall table), else
  // DERIVE it from the central-list row matched by solution id — so arriving
  // from the dashboard marker popup (no project_id in URL) still loads the
  // contract/warranty AND opens a populated ⓘ modal. Mirrors cctv detail.
  const { data: central } = useTrafficCentralList(deptId)
  const matchedSolution = useMemo(() => {
    if (!central) return null
    // Inner arrays are backend-sourced — guard like every other nested tree
    // (a bureau without sub_department/solutions must not crash the page).
    for (const bureau of central)
      for (const sub of bureau.sub_department ?? [])
        for (const sol of sub.solutions ?? [])
          if (String(sol.solution.id) === String(id)) return sol
    return null
  }, [central, id])
  const projectIdParam = searchParams.get('project_id')
  const roadIdParam = searchParams.get('road_id')
  const resolvedProjectId =
    projectIdParam ?? (matchedSolution ? String(matchedSolution.project.id) : null)
  const resolvedRoadId =
    roadIdParam ?? (matchedSolution ? String(matchedSolution.road.id) : null)
  const contractInfo = useTrafficContractInfo(resolvedProjectId)
  // The rest are solution-scoped — keep the path `id`.
  const solutionDetail = useTrafficSolutionDetail(id)
  const details = useTrafficDetails(id)
  const phaseDetails = useTrafficPhaseDetails(id)
  // `/overview?solution_id=` is the only endpoint exposing `road.code_name`
  // — keep it just for the road code in the title bar. Cache shared with the
  // overall page when the user came from there.
  const overview = useTrafficOverview(deptId, { solution_id: id })

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
    // Coords from `/manage/solution/details/{id}` (canonical), fall back to
    // overview's `GeometryPoint` if solution endpoint hasn't loaded yet.
    // Final fallback is [0, 0] which the map treats as "no data".
    const coord: [number, number] =
      (solutionDetail.data?.geometry_point as [number, number] | null | undefined) ??
      overview.data?.locations[0]?.GeometryPoint ??
      [0, 0]
    // Only the main detail is critical. Phases / contract / solution detail
    // are all optional — page renders with placeholders for what's missing.
    if (!detailItem) return null

    const phaseTiming: PhaseTimingConfig[] = phases.map((p) => ({
      phase: p.phase_no,
      greenSec: p.green_time,
      redSec: p.waiting_time,
      isActive: p.is_active,
      timestamp: p.timestamp,
      isMainRoad: p.is_main_road,
    }))

    // Prefer the overview endpoint's `is_online` (authoritative — matches
    // the overall page map). Fall back to "any phase active" only when the
    // overview hasn't loaded yet, so the badge stays consistent with the
    // overall map's cyan/red marker for the same signal.
    const overviewOnline = overview.data?.locations[0]?.traffic.is_online
    const isOnline =
      overviewOnline ?? phases.some((p) => p.is_active)

    // Warranty: trust BE's `warranty_status` (handles 3 states including
    // "ก่อนค้ำ"). Collapse to the 2-state `warranty` boolean used by tables /
    // cards elsewhere; the 3-state string lives on `warrantyStatus` for the
    // detail pill. Defaults to "expired" until contract loads.
    const warrantyStatus = contract?.warranty_status
    const warranty: 'in-warranty' | 'expired' =
      warrantyStatus === 'ในค้ำ' ? 'in-warranty' : 'expired'

    // `road.code_name` only lives on the overview endpoint.
    const overviewLoc = overview.data?.locations[0]
    const roadCode = overviewLoc?.road.code_name ?? '-'

    // Everything else (solution name, anydesk, coords) is sourced from
    // `/manage/solution/details/{id}` — the canonical record for one signal.
    const installPoint =
      solution?.solution_name ?? overviewLoc?.solution.solution_name ?? contract?.project_name ?? '-'
    // Preserve the empty-string case from BE — TitleSection renders the
    // button in a muted "no number set" style instead of hiding it, so the
    // user knows AnyDesk exists as a configurable field for this solution.
    //   undefined ⇒ data not loaded / endpoint failed → hide
    //   ''        ⇒ loaded but unset → gray button
    //   value     ⇒ normal blue button
    const anydeskRaw = solution?.anydesk
    const anydeskId: string | undefined =
      anydeskRaw == null ? undefined : String(anydeskRaw)

    return {
      id,
      projectId: resolvedProjectId ?? undefined,
      roadId: resolvedRoadId ?? undefined,
      roadCode,
      projectName: contract?.project_name ?? installPoint,
      installPoint,
      contractNo: contract?.contract_no ?? '-',
      warranty,
      warrantyStatus,
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
  }, [id, resolvedProjectId, resolvedRoadId, contractInfo.data, solutionDetail.data, details.data, phaseDetails.data, overview.data])

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
                <li key={e.label} className='flex flex-col gap-0.5 fs-12'>
                  <div className='flex items-center gap-2'>
                    <span className={`font-bold ${s.color}`}>{s.text}</span>
                    {e.critical && (
                      <span className='text-[10px] px-1.5 rounded bg-red-500/20 text-red-300'>
                        critical
                      </span>
                    )}
                    <span className='text-white/90'>{e.label}</span>
                  </div>
                  <span className='text-white/40 pl-2'>↳ {e.purpose}</span>
                </li>
              )
            })}
          </ul>
          <p className='text-white/50 fs-12 mt-3'>
            {`ต้องมี endpoint "critical" ทำงานถึง render ได้`}
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
        <section className='mt-8 px-10 pb-8'>{renderContent}</section>
        {/* Global Project Info modal — fires when ⓘ icon in title bar is
          * clicked. Reads project_id/road_id from URL search params. */}
        <ProjectInfoModal />
        {/* Central Live Stream modal — opened via Redux from camera tiles/table;
          * Traffic-specific phase/PCU cells are passed as extra_cells. */}
        <CCTVModal />
      </div>
    </DetailProvider>
  )
}

export default React.memo<Props>(ScreenDetailTrafficSignal)
