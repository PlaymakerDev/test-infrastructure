"use client"
import React from 'react'
import { Alert, Button, Spin } from 'antd'
import { TbBulb, TbBolt } from 'react-icons/tb'
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import type { OverlapMarkerItem } from '@/components/map/markers/OverlapMarkers'
import MapLightingDetail from '@/features/admin/traffic-lighting/shared/MapLightingDetail'
import StatusInfoCard from '@/features/admin/traffic-lighting/detail/components/StatusInfoCard'
import LampChartsSection from '../components/LampChartsSection'
import LampEquipmentTable from '../components/LampEquipmentTable'
import { LampProvider } from '../context'
import LampTitleSection from '../components/TitleSection'
import {
  resolveLightingImei,
  resolveLightingSolutionId,
} from '@/features/admin/traffic-lighting/shared/lightingDetailNavigation'
import { useLightingProject } from '@/features/admin/traffic-lighting/shared/useLightingProject'
import {
  buildTrafficLightingProject,
  lightingRowFromSolution,
} from '@/features/admin/traffic-lighting/shared/buildTrafficLightingProject'
import {
  useLightingAmpGraph,
  useLightingDeviceDetails,
  useLightingLampSummary,
  useLightingLamps,
  useLightingLampsCurrentHourly,
  useLightingSolution,
} from '@/hooks/queries/lighting'
import TrafficLightingMinimumFontSize from '../../../shared/TrafficLightingMinimumFontSize'
import LampStatusCard from '../components/LampStatusCard'
import LampMapPopup from '../components/LampMapPopup'
import { MOCK_LAMP_DATA, buildMockLampRows, buildMockLampSummary } from '../data/mockLampData'
import {
  countWithShare,
  currentStats,
  lampCurrentPoints,
  lampRowsFromLamps,
  lampSummaryFromRows,
  latestLampReport,
  type LampRow,
} from '../data/lampRows'

interface Props {
  id: string
  imeiParam?: string
}

/** Lamp detail screen — map + stat cards, then charts + equipment table below. */
const LampDetailScreen: React.FC<Props> = ({ id, imeiParam }) => {
  const requestedImei = resolveLightingImei(id, imeiParam)
  const projectQuery = useLightingProject(id, requestedImei, 'lamp')
  // The point's solution: from this URL's department list, or out of its own
  // "<solution>-<n>" id when that list doesn't hold it — dept 0 without
  // scope=all lists nothing. Then its own record names it and the work
  // master places it, so the page reads the same however it was reached.
  const solutionId = projectQuery.project.solutionId ?? resolveLightingSolutionId(id)
  const needsFallback = !projectQuery.isLoading && !projectQuery.found
  const fallbackQuery = useLightingSolution(needsFallback ? solutionId : null)
  const fallbackPlace = useLightingLampSummary(needsFallback ? solutionId : null)
  const project = React.useMemo(() => {
    if (!needsFallback || !fallbackQuery.data) return projectQuery.project
    const place = fallbackPlace.data
    return buildTrafficLightingProject(id, {
      ...lightingRowFromSolution(fallbackQuery.data),
      ...(place?.lat != null && place?.lng != null ? { coord: [place.lng, place.lat] as [number, number] } : {}),
    }, 'lamp')
  }, [needsFallback, fallbackQuery.data, fallbackPlace.data, projectQuery.project, id])
  const imei = requestedImei || project.imei || ''
  // Where the point stands. The central list carries no position for a LoRa
  // lamp point, and it has no IMEI to look one up by — so the map and Google
  // Map find it in the overview by solution id (`useResolvedCoord` matches
  // either key).
  const locationKey = imei || (solutionId != null ? String(solutionId) : '')
  const deviceQuery = useLightingDeviceDetails(imei)
  const resolvedPhase = deviceQuery.data
    ? (deviceQuery.data.phase === 1 || deviceQuery.data.phase === 3 ? deviceQuery.data.phase : project.phase)
    : project.phase
  // Gate on the device query having settled first, same rationale as
  // OverviewSection's `phaseReady` — otherwise this fires once with no
  // `phase_type` before re-firing once phase resolves.
  const phaseReady = !deviceQuery.isLoading
  const ampQuery = useLightingAmpGraph(imei, resolvedPhase, phaseReady)
  // The lamps themselves — a lamp point has no IMEI, so they come by solution
  // id, each with its status, connection, current and last report (BE
  // 2026-11-05).
  const lampsQuery = useLightingLamps(solutionId)
  const lamps = lampsQuery.data?.lamps
  // The lamps BE lists — the count the donut, the chips and the table use;
  // the department list's equipment count only until they arrive.
  const totalLamps = lampsQuery.data?.total ?? project.equipment.count ?? null
  // กระแสไฟฟ้าเฉลี่ย + Peak Hour Current (Figma): a lamp point's hourly
  // average by solution (BE 2026-11-05); a cabinet's own amp graph by IMEI.
  const lampCurrentQuery = useLightingLampsCurrentHourly(imei ? null : solutionId)
  const current = React.useMemo(
    () => (imei
      ? currentStats((ampQuery.data ?? []).map((point) => ({ hour: point.Period_Name, amp: point.amp })))
      : currentStats(lampCurrentPoints(lampCurrentQuery.data?.hours))),
    [imei, ampQuery.data, lampCurrentQuery.data],
  )
  const currentQuery = imei ? ampQuery : lampCurrentQuery
  // Read the clock once at mount — render stays pure and the derived times
  // don't drift between renders.
  const [now] = React.useState(() => Date.now())
  const apiRows = React.useMemo(() => lampRowsFromLamps(lamps), [lamps])
  const mockRows = React.useMemo(
    () => (MOCK_LAMP_DATA && imei && totalLamps
      ? buildMockLampRows(imei, totalLamps, deviceQuery.data?.line_checks, now)
      : []),
    [imei, totalLamps, deviceQuery.data?.line_checks, now],
  )
  const fromApi = apiRows.length > 0
  const lampRows = fromApi ? apiRows : mockRows
  const lampSummary = fromApi
    ? lampSummaryFromRows(apiRows)
    : mockRows.length > 0 ? buildMockLampSummary(mockRows) : null
  const reportedAt = React.useMemo(() => (fromApi ? latestLampReport(lamps) : null), [fromApi, lamps])
  // A pin per lamp where it stands (Figma) — red when it isn't working, the
  // way the other detail maps paint an offline camera. Its popup renders in
  // the map's own React root, hence the provider.
  const queryClient = useQueryClient()
  const lampPins = React.useMemo<OverlapMarkerItem[]>(
    () => (fromApi ? apiRows : [])
      .filter((row): row is LampRow & { coord: [number, number] } => !!row.coord)
      .map((row) => ({
        id: `lamp-${row.key}`,
        coord: row.coord,
        title: `โคมที่ ${row.order}`,
        offline: row.isWorking === false,
        popup: (
          <QueryClientProvider client={queryClient}>
            <LampMapPopup row={row} solutionId={solutionId} roadCode={project.roadCode} />
          </QueryClientProvider>
        ),
        popupOptions: { offset: 18, closeButton: false },
      })),
    [fromApi, apiRows, queryClient, solutionId, project.roadCode],
  )
  const resolvedProject = deviceQuery.data
    ? {
        ...project,
        imei: imei || project.imei,
        connection: deviceQuery.data.is_online ? 'online' as const : 'offline' as const,
        phase: resolvedPhase,
        circuitStatus: deviceQuery.data.has_broken_wire ? 'abnormal' as const : 'normal' as const,
      }
    : project

  if (projectQuery.isLoading || (needsFallback && fallbackQuery.isLoading)) {
    return (
      <div className='main-screen min-h-64 flex items-center justify-center'>
        <Spin />
      </div>
    )
  }
  // Only when the point's own record didn't stand in either.
  const showProjectError = projectQuery.isError && !(needsFallback && fallbackQuery.data)

  return (
    <LampProvider project={resolvedProject}>
      {/* No `pt-3`: the phase detail page (DetailTitleSection) starts its
          header flush at the top, and the extra 12px here pushed this whole
          page 12px lower than every other detail page. */}
      <div className='main-screen pb-6 traffic-lighting-font-min-14'>
        <TrafficLightingMinimumFontSize />
        {showProjectError && (
          <Alert
            className='mx-3 sm:mx-6 xl:mx-10 mb-4'
            type='error'
            showIcon
            message='ไม่สามารถโหลดข้อมูลโครงการได้'
            action={<Button size='small' onClick={projectQuery.refetch}>ลองใหม่</Button>}
          />
        )}
        {/* The header sits where the phase page's does (px-8 from lg up);
            narrower, it lines up with the sections below. */}
        <LampTitleSection locationKey={locationKey} className='px-3 sm:px-6 lg:px-8' />

        <div className='px-3 sm:px-6 xl:px-10'>
          {/* Top row: map (left) + 3 stat cards (right) */}
          <section className='mt-6 flex flex-col lg:flex-row lg:items-stretch w-full gap-3'>
            <div className='relative w-full lg:flex-1 min-w-0 min-h-[480px] lg:min-h-[600px] rounded-[20px] overflow-hidden bg-[#212121]'>
              <MapLightingDetail
                coord={resolvedProject.coord}
                imei={locationKey}
                isOnline={deviceQuery.data
                  ? deviceQuery.data.is_online
                  : resolvedProject.connection === 'online'
                    ? true
                    : resolvedProject.connection === 'offline'
                      ? false
                      : undefined}
                roadCode={resolvedProject.roadCode}
                installPoint={resolvedProject.installPoint}
                projectName={resolvedProject.projectName}
                points={lampPins}
                pointUnit='โคม'
              />
            </div>

            <div className='flex flex-col gap-3 ml-auto shrink-0 items-end'>
              <div style={{ width: 300, height: 120 }} className='shrink-0'>
                <StatusInfoCard
                  borderColor='#05F2DB'
                  titleColor='#05F2DB'
                  title='โคมไฟทั้งหมด'
                  iconNode={<TbBulb size={28} style={{ color: '#05F2DB' }} className='shrink-0' />}
                  status={totalLamps == null ? '-' : totalLamps.toLocaleString('en-US')}
                  // "โคม", as the donut counts them (the Figma's "คัน" is a
                  // vehicle card's unit left behind).
                  valueUnit={totalLamps == null ? undefined : 'โคม'}
                  // Active = working lamps, the donut's ทำงาน (Figma).
                  active={lampSummary ? countWithShare(lampSummary.working, lampSummary.total) : undefined}
                  valueFontSize={24}
                />
              </div>
              <div style={{ width: 300, height: 120 }} className='shrink-0'>
                <StatusInfoCard
                  borderColor='#FFFFFF'
                  titleColor='#FFFFFF'
                  title='กระแสไฟฟ้าเฉลี่ย'
                  iconNode={<TbBolt size={28} style={{ color: '#FFFFFF' }} className='shrink-0' />}
                  // A lamp draws ~0.3–1 A: 2dp as the Figma. A cabinet keeps
                  // 4dp — idle it averages ~0.0002 A, which 2dp flattened to
                  // "0.00" while its chart plotted 0.0002 (ElectricalSystemCard).
                  status={currentQuery.isLoading || currentQuery.isError || current.average == null
                    ? '-'
                    : current.average.toFixed(imei ? 4 : 2)}
                  valueUnit={current.average == null ? undefined : 'A'}
                  valueUnitLarge
                  // Today's hours, as the chart below.
                  subtitle={`Peak Hour Current : ${current.peakHour ?? '-'}`}
                  valueFontSize={24}
                />
              </div>
              <LampStatusCard summary={lampSummary} reportedAt={reportedAt} loading={lampsQuery.isLoading} />
            </div>
          </section>

          <LampChartsSection
            imei={imei}
            solutionId={solutionId}
            phase={resolvedPhase}
            phaseReady={phaseReady}
            lampCount={totalLamps}
            lineChecks={deviceQuery.data?.line_checks}
          />
          <LampEquipmentTable
            rows={lampRows}
            loading={lampsQuery.isLoading}
            isError={lampsQuery.isError}
          />
        </div>
      </div>
    </LampProvider>
  )
}

export default React.memo(LampDetailScreen)
