"use client"
import React, { useMemo, useState } from 'react'
import { Col, Row } from 'antd'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import SearchBar, {
  type FilterConfig,
  type FilterStats,
  type ViewMode,
} from '@/components/searchable/SearchBar'
import ModalLiveStreamTrafficSignal, {
  type TrafficSignalCameraDetail,
} from '../../ModalLiveStreamTrafficSignal'
import TableCameraTrafficSignal from './TableCameraTrafficSignal'
import { useDetailContext } from '../../../context'

export interface CameraEntry {
  id: string
  code: string
  ipAddress: string
  phase: number
  detectionMode: 'Counting' | 'Stopline'
  greenTime: number
  volume: number
  connection: 'online' | 'offline'
}

/** Mock 8 cameras per signal (4 Counting top + 4 Stopline bottom).
 *  In production the backend supplies the per-project list. */
const COUNTING: CameraEntry[] = [
  { id: 'tf001', code: '68SET-CCO4050-TF001-วราจรจุดที่1-กม.5+680-มุ่งหน้าโชติทรัพย์', ipAddress: '10.101.27.5', phase: 1, detectionMode: 'Counting', greenTime: 60, volume: 2174, connection: 'online' },
  { id: 'tf002', code: '68SET-CCO4050-TF002-วราจรจุดที่1-กม.5+680-มุ่งหน้าตลาดอุดมโชค', ipAddress: '10.101.27.6', phase: 2, detectionMode: 'Counting', greenTime: 60, volume: 2045, connection: 'online' },
  { id: 'tf003', code: '68SET-CCO4050-TF003-วราจรจุดที่1-กม.5+680-มุ่งหน้าอาคารธีระเขื่อม', ipAddress: '10.101.27.7', phase: 3, detectionMode: 'Counting', greenTime: 30, volume: 1923, connection: 'online' },
  { id: 'tf004', code: '68SET-CCO4050-TF004-วราจรจุดที่1-กม.5+680-มุ่งหน้าโชติทรัพย์', ipAddress: '10.101.27.8', phase: 4, detectionMode: 'Counting', greenTime: 20, volume: 1023, connection: 'online' },
]

const STOPLINE: CameraEntry[] = [
  { id: 'tf005', code: '68SET-CCO4050-TF005-วราจรจุดที่1-กม.5+680-มุ่งหน้าโชติทรัพย์', ipAddress: '10.101.27.5', phase: 1, detectionMode: 'Stopline', greenTime: 0, volume: 0, connection: 'online' },
  { id: 'tf006', code: '68SET-CCO4050-TF006-วราจรจุดที่1-กม.5+680-มุ่งหน้า7-Eleven', ipAddress: '10.101.27.6', phase: 2, detectionMode: 'Stopline', greenTime: 0, volume: 0, connection: 'online' },
  { id: 'tf007', code: '68SET-CCO4050-TF007-วราจรจุดที่1-กม.5+680-มุ่งหน้าจุดเชื่อมต่อแยก', ipAddress: '10.101.27.7', phase: 3, detectionMode: 'Stopline', greenTime: 0, volume: 0, connection: 'offline' },
  { id: 'tf008', code: '68SET-CCO4050-TF008-วราจรจุดที่1-กม.5+680-มุ่งหน้าโชติทรัพย์', ipAddress: '10.101.27.8', phase: 4, detectionMode: 'Stopline', greenTime: 0, volume: 0, connection: 'online' },
]

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
      <HLSLivePlayer figureClassName='aspect-video rounded-lg' />
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
  const [activeFilter, setActiveFilter] = useState('all')
  const [viewMode, setViewMode] = useState<ViewMode>('GRID')
  const [liveCamera, setLiveCamera] = useState<TrafficSignalCameraDetail | null>(null)

  const allCameras = useMemo(() => [...COUNTING, ...STOPLINE], [])

  // Map an in-grid CameraEntry to the modal's richer shape.
  // Pulls `installPoint` from the project context as the camera's "จุดติดตั้ง".
  const openLive = (cam: CameraEntry) => {
    setLiveCamera({
      id: cam.id,
      code: cam.code,
      ipAddress: cam.ipAddress,
      phase: cam.phase,
      detectionMode: cam.detectionMode,
      greenTime: cam.greenTime,
      volume: cam.volume,
      connection: cam.connection,
      location: project.installPoint,
      lastUpdated: '30 เม.ย. 2569 09:35:29',
      functions: cam.detectionMode === 'Counting' ? ['CCTV', 'Volume', 'Traffic'] : ['CCTV', 'Traffic'],
      efficiency: cam.connection === 'online' ? 100 : 0,
      roadType: 'ถนนสายหลัก',
    })
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
    const filterFn = (cams: CameraEntry[]) =>
      cams.filter((c) => {
        if (activeFilter === 'all') return true
        return c.connection === activeFilter
      })
    return { counting: filterFn(COUNTING), stopline: filterFn(STOPLINE) }
  }, [activeFilter])

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

      <ModalLiveStreamTrafficSignal
        camera={liveCamera}
        onClose={() => setLiveCamera(null)}
      />
    </div>
  )
}

export default React.memo(CamerasGridTrafficSignal)
