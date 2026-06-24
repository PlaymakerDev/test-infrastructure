"use client"
import React, { useMemo, useState } from 'react'
import { Col, Row } from 'antd'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import SearchBar, {
  type FilterConfig,
  type FilterStats,
  type ViewMode,
} from '@/components/searchable/SearchBar'
import TableCameraTrafficSignal from './TableCameraTrafficSignal'
import { useDetailContext } from '../../../context'
import { useTrafficSolutionCameras } from '@/hooks/queries/traffic-signal'
import type { TrafficSolutionCamera } from '@/types/traffic-signal/detail-api'
import { useAppDispatch } from '@/stores/hooks'
import { setCCTVModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { getPhaseColor } from '@/features/admin/traffic-signal/overall/data/trafficSignals'
import type { CCTVModalExtraCell } from '@/types/layout'

export interface CameraEntry {
  id: string
  code: string
  ipAddress: string
  phase: number
  detectionMode: 'Counting' | 'Stopline'
  greenTime: number
  volume: number
  connection: 'online' | 'offline'
  /** HLS playlist URL — passed to `HLSLivePlayer`. Empty string ⇒ no stream
   *  available, tile renders a placeholder instead of triggering HLS errors. */
  hlsUrl: string
}

/** Adapter: API camera → in-grid CameraEntry shape (used by tile + table).
 *  Note: backend uses 'StopLine' (S+L capital); we normalise to 'Stopline'
 *  for the in-app type — UI styling still discriminates on the value.
 *
 *  `greenTime` is derived by looking up the camera's monitored phase in the
 *  `phaseTiming` map — the cameras endpoint doesn't carry green_time itself.
 */
const apiCameraToEntry = (
  cam: TrafficSolutionCamera,
  greenSecByPhase: Map<number, number>,
): CameraEntry => ({
  id: cam.camera_id,
  code: cam.camera_name,
  ipAddress: cam.ip_address,
  phase: cam.phases_no,
  detectionMode: cam.camera_type === 'Counting' ? 'Counting' : 'Stopline',
  greenTime: greenSecByPhase.get(cam.phases_no) ?? 0,
  volume: cam.total_count,
  connection: cam.is_online ? 'online' : 'offline',
  hlsUrl: cam.hls_url ?? '',
})

const FILTERS: FilterConfig[] = [
  {
    key: 'all', label: 'ทั้งหมด',
    colorPrimary: '#FCD116', colorTextLightSolid: '#212121',
    badgeActiveClass: 'bg-[#8a7000] text-white',
    badgeIdleClass: 'bg-[#FCD116]/20 text-[#FCD116]',
  },
  {
    key: 'online', label: 'ออนไลน์',
    colorPrimary: '#66AEFF', colorTextLightSolid: '#212121',
    badgeActiveClass: 'bg-[#1B3F8B] text-white',
    badgeIdleClass: 'bg-[#66AEFF]/20 text-[#66AEFF]',
  },
  {
    key: 'offline', label: 'ออฟไลน์',
    colorPrimary: '#E94C4C', colorTextLightSolid: '#ffffff',
    badgeActiveClass: 'bg-red-800 text-white',
    badgeIdleClass: 'bg-red-500/20 text-red-400',
  },
]

/** Single camera tile — HLS player + code + IP + per-mode footer pills.
 *  Clicking the player area opens the central Live Stream modal. */
const CameraTile: React.FC<{ cam: CameraEntry; onOpen: (cam: CameraEntry) => void }> = ({
  cam,
  onOpen,
}) => (
  <div className='flex flex-col gap-1.5'>
    <div
      className='relative rounded-lg overflow-hidden bg-black/40 cursor-pointer'
      onClick={() => onOpen(cam)}
      role='button'
      tabIndex={0}
    >
      <HLSLivePlayer
        figureClassName='aspect-video rounded-lg'
        hlsUrl={cam.hlsUrl}
        cameraId={cam.id}
      />
      <span
        className='absolute top-2 right-2 fs-12 font-semibold px-2 py-0.5 rounded'
        style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}
      >
        P{cam.phase} - {cam.detectionMode}
      </span>
    </div>
    <h4 className='text-blue-400 mb-0 fs-12'>{cam.code}</h4>
    <p className='fs-12 text-gray-400 mb-0'>IP Address : {cam.ipAddress}</p>
    {cam.detectionMode === 'Counting' && (
      <div className='flex gap-2 mt-1'>
        <span className='fs-12 border border-emerald-500 text-emerald-400 px-2 py-0.5 rounded-full'>
          Green Time : {cam.greenTime}s
        </span>
        <span className='fs-12 border border-(--yellow) text-(--yellow) px-2 py-0.5 rounded-full'>
          Volume : {cam.volume.toLocaleString()}
        </span>
      </div>
    )}
  </div>
)

const CamerasGridTrafficSignal: React.FC = () => {
  const { project } = useDetailContext()
  const dispatch = useAppDispatch()
  const [activeFilter, setActiveFilter] = useState('all')
  const [viewMode, setViewMode] = useState<ViewMode>('GRID')

  // Cameras for this signal come from a dedicated endpoint — Counting/StopLine
  // split is derived from `camera_type`.
  const { data: apiCameras } = useTrafficSolutionCameras(project.id)
  // Build a phase → greenSec lookup once per project change. Cameras are
  // tagged with the phase they monitor (`phases_no`), so the matching green
  // duration lives on the project's phase timing config.
  const greenSecByPhase = useMemo(() => {
    const m = new Map<number, number>()
    for (const p of project.phaseTiming ?? []) m.set(p.phase, p.greenSec)
    return m
  }, [project.phaseTiming])
  // phase → is_main_road lookup (drives the Live Stream modal's road-type cell).
  const isMainRoadByPhase = useMemo(() => {
    const m = new Map<number, boolean>()
    for (const p of project.phaseTiming ?? []) {
      if (p.isMainRoad !== undefined) m.set(p.phase, p.isMainRoad)
    }
    return m
  }, [project.phaseTiming])
  const allCameras = useMemo(
    () => (apiCameras ?? []).map((c) => apiCameraToEntry(c, greenSecByPhase)),
    [apiCameras, greenSecByPhase]
  )

  // Open the central CCTVModal (device-type/status/IP come from /cctv/cameras/{id});
  // pass Traffic-Signal-specific cells (phase / mode / PCU / green time / road
  // type) as extra cells so they show as a 2nd row. "Efficiency" was removed —
  // not used. "ประเภทถนน" reads `is_main_road` from /traffic/details/phase_details
  // looked up by the camera's monitored phase; falls back to "-" when the phase
  // isn't in the timing payload (e.g. phase config not yet loaded).
  const openLive = (cam: CameraEntry) => {
    const mainRoad = isMainRoadByPhase.get(cam.phase)
    const roadType =
      mainRoad === undefined ? '-' : mainRoad ? 'ถนนสายหลัก' : 'ถนนสายรอง'
    const extra_cells: CCTVModalExtraCell[] = [
      { iconKey: 'phase', label: 'แยกจราจร', value: `Phase ${cam.phase}`, color: getPhaseColor(cam.phase) },
      { iconKey: 'mode', label: 'การทำงาน', value: cam.detectionMode, color: cam.detectionMode === 'Counting' ? '#FCD116' : '#ffffff', pill: true },
      { iconKey: 'pcu', label: 'ปริมาณ PCU', value: cam.volume.toLocaleString(), color: '#ffffff' },
      { iconKey: 'green', label: 'Green Time', value: `${cam.greenTime}s`, color: '#ffffff' },
      { iconKey: 'road', label: 'ประเภทถนน', value: roadType, color: '#ffffff' },
    ]
    dispatch(setCCTVModalOpen({ open: true, camera_id: cam.id, extra_cells }))
  }

  const stats: FilterStats = useMemo(
    () => ({
      all: allCameras.length,
      online: allCameras.filter((c) => c.connection === 'online').length,
      offline: allCameras.filter((c) => c.connection === 'offline').length,
    }),
    [allCameras]
  )

  const filtered = useMemo(() => {
    const inMode = (mode: CameraEntry['detectionMode']) =>
      allCameras.filter(
        (c) =>
          c.detectionMode === mode &&
          (activeFilter === 'all' || c.connection === activeFilter)
      )
    return { counting: inMode('Counting'), stopline: inMode('Stopline') }
  }, [activeFilter, allCameras])

  return (
    <div>
      <section>
        <SearchBar
          filters={FILTERS}
          stats={stats}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          defaultViewMode={viewMode}
          onViewModeChange={setViewMode}
          onExport={() => alert('TODO: นำออกเอกสาร')}
        />
      </section>

      <section className='mt-5'>
        {viewMode === 'TABLE' ? (
          /* TABLE view — flat list with Phase/Mode/IP/Green Time/Volume/Status.
           * Click a row to open the same Live Stream modal as the GRID view. */
          <TableCameraTrafficSignal
            cameras={[...filtered.counting, ...filtered.stopline]}
            onOpen={openLive}
          />
        ) : (
          /* GRID view — 4 Counting tiles on top + 4 Stopline tiles below. */
          <>
            {filtered.counting.length > 0 && (
              <Row gutter={[16, 16]} className='mb-4'>
                {filtered.counting.map((cam) => (
                  <Col key={cam.id} xs={24} sm={12} md={12} lg={6}>
                    <CameraTile cam={cam} onOpen={openLive} />
                  </Col>
                ))}
              </Row>
            )}
            {filtered.stopline.length > 0 && (
              <Row gutter={[16, 16]}>
                {filtered.stopline.map((cam) => (
                  <Col key={cam.id} xs={24} sm={12} md={12} lg={6}>
                    <CameraTile cam={cam} onOpen={openLive} />
                  </Col>
                ))}
              </Row>
            )}
          </>
        )}
      </section>
    </div>
  )
}

export default React.memo(CamerasGridTrafficSignal)
