"use client"
import React, { useMemo, useState } from 'react'
import { Col, Row } from 'antd'
import { useQuery } from '@tanstack/react-query'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import SearchBar, {
  type FilterConfig,
  type FilterStats,
  type ViewMode,
} from '@/components/searchable/SearchBar'
import TableCameraTrafficVolume from './TableCameraTrafficVolume'
import { useAppDispatch } from '@/stores/hooks'
import { setCCTVModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { useTrafficVolumeSolutionCameras } from '@/hooks/queries/traffic-volume'
import { useDeptId } from '@/hooks/useDeptId'
import { getCCTVDetailAPI } from '@/services/routes/SharedService'
import { useDetailContext } from '../../../context'
import type { CountingCameraItem } from '@/types/traffic-volume/detail-api'

export interface CameraEntry {
  id: string
  code: string
  /** Empty string ⇒ no stream available, tile renders a placeholder. */
  hlsUrl: string
  /** Derived from `hls_url` presence — the endpoint doesn't expose
   *  is_online directly, so treat "has stream URL" as online. */
  connection: 'online' | 'offline'
  /** [lng, lat] from the cameras endpoint — rendered in the table view. */
  geometryPoint?: [number, number]
  /** Optional — endpoint may not expose it yet; falls back to "-" in UI. */
  ipAddress?: string
}

const apiCameraToEntry = (cam: CountingCameraItem): CameraEntry => ({
  id: cam.id,
  code: cam.camera_name,
  hlsUrl: cam.hls_url ?? '',
  connection: cam.hls_url ? 'online' : 'offline',
  geometryPoint: cam.geometry_point,
  ipAddress: cam.ip_address,
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

const CameraTile: React.FC<{
  cam: CameraEntry
  onOpen: (cam: CameraEntry) => void
}> = ({ cam, onOpen }) => {
  // IP comes from the shared CCTV detail endpoint (same source the modal
  // uses). Reuses the modal's exact `['cctv_detail', id]` query key so
  // clicking the tile to open the modal is an instant cache hit — no
  // refetch.
  const { data: cctv } = useQuery({
    queryKey: ['cctv_detail', cam.id],
    queryFn: () => getCCTVDetailAPI(cam.id),
    enabled: !!cam.id,
  })
  const ip = cctv?.data?.ip_address ?? cam.ipAddress

  return (
    // Outer gray card matches the overall-page CCTV tile so both pages share
    // the same layered card-on-card visual language. Inner frame uses
    // `bg-black/40` (matching traffic-signal) so the HLSLivePlayer's own
    // loading-state background reads cleanly through without double-darkening.
    <div
      className='bg-(--mid-gray) p-3 rounded-lg flex flex-col cursor-pointer'
      onClick={() => onOpen(cam)}
      role='button'
      tabIndex={0}
    >
      <div className='relative rounded-lg overflow-hidden bg-black/40 mb-2'>
        <HLSLivePlayer
          figureClassName='aspect-video rounded-lg'
          hlsUrl={cam.hlsUrl}
          cameraId={cam.id}
        />
      </div>
      <h4 className='text-blue-400 mb-0 fs-12'>{cam.code}</h4>
      <p className='fs-12 text-gray-400 mb-0'>IP Address : {ip ?? '-'}</p>
    </div>
  )
}

const CamerasGridTrafficVolume: React.FC = () => {
  const deptId = useDeptId()
  const { id } = useDetailContext()
  const dispatch = useAppDispatch()
  const [activeFilter, setActiveFilter] = useState('all')
  // GRID is the design default — TABLE shows a flat list with name + coord
  // + status when the list icon is clicked.
  const [viewMode, setViewMode] = useState<ViewMode>('GRID')

  const { data } = useTrafficVolumeSolutionCameras(deptId, id)
  const allCameras = useMemo(
    () => (data?.counting ?? []).map(apiCameraToEntry),
    [data]
  )

  const stats: FilterStats = useMemo(
    () => ({
      all: allCameras.length,
      online: allCameras.filter((c) => c.connection === 'online').length,
      offline: allCameras.filter((c) => c.connection === 'offline').length,
    }),
    [allCameras]
  )

  const filtered = useMemo(
    () =>
      allCameras.filter(
        (c) => activeFilter === 'all' || c.connection === activeFilter
      ),
    [activeFilter, allCameras]
  )

  /** Open the global CCTV modal (`<CCTVModal />` mounted in the detail screen).
   *  Pattern mirrors VMS — the modal fetches its own data from
   *  `getCCTVDetailAPI(camera_id)` so the caller only needs to dispatch
   *  the open event with the camera id. */
  const openLive = (cam: CameraEntry) => {
    dispatch(setCCTVModalOpen({ open: true, camera_id: cam.id }))
  }

  return (
    <div>
      <section>
        {/* `mode='default'` shows filter pills + view-mode toggle (no search
          * input / export button). */}
        <SearchBar
          mode='default'
          filters={FILTERS}
          stats={stats}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          defaultViewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </section>

      <section className='mt-5'>
        {viewMode === 'TABLE' ? (
          <TableCameraTrafficVolume cameras={filtered} onOpen={openLive} />
        ) : (
          <Row gutter={[16, 16]}>
            {filtered.map((cam) => (
              <Col key={cam.id} xs={24} sm={12} md={12} lg={8}>
                <CameraTile cam={cam} onOpen={openLive} />
              </Col>
            ))}
          </Row>
        )}
      </section>
    </div>
  )
}

export default React.memo(CamerasGridTrafficVolume)
