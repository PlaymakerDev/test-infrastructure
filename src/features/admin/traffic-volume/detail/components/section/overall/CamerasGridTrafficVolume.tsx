"use client"
import React, { useMemo, useState } from 'react'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import SearchBar, {
  type FilterConfig,
  type FilterStats,
  type ViewMode,
} from '@/components/searchable/SearchBar'
import TableCameraTrafficVolume from './TableCameraTrafficVolume'
import { useAppDispatch } from '@/stores/hooks'
import { setCCTVModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { useTrafficVolumeSolutionCamerasList } from '@/hooks/queries/traffic-volume'
import { useDeptId } from '@/hooks/useDeptId'
import { useDetailContext } from '../../../context'
import type { CountingCameraListItem } from '@/types/traffic-volume/detail-api'

export interface CameraEntry {
  id: string
  code: string
  /** Empty string ⇒ no stream available, tile renders a placeholder. */
  hlsUrl: string
  /** Derived from the row's `status.is_online` flag. */
  connection: 'online' | 'offline'
  /** IP address is now returned inline by the `/cameras/list` endpoint —
   *  no follow-up fetch needed. Falls back to "-" in the UI when empty. */
  ipAddress?: string
}

const apiRowToEntry = (row: CountingCameraListItem): CameraEntry => ({
  id: row.camera.id,
  code: row.camera.camera_name,
  hlsUrl: row.camera.hls_url ?? '',
  connection: row.camera.status?.is_online ? 'online' : 'offline',
  ipAddress: row.camera.ip_address,
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
}> = ({ cam, onOpen }) => (
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
    <h4 className='camera-code' style={{ color: '#66AEFF', fontSize: 14 }}>{cam.code}</h4>
    <p className='camera-location' style={{ color: '#A2A2A2', fontSize: 12 }}>IP Address : {cam.ipAddress || '-'}</p>
  </div>
)

const CamerasGridTrafficVolume: React.FC = () => {
  const deptId = useDeptId()
  const { id } = useDetailContext()
  const dispatch = useAppDispatch()
  const [activeFilter, setActiveFilter] = useState('all')
  // GRID is the design default — TABLE shows a flat list with name + coord
  // + status when the list icon is clicked.
  const [viewMode, setViewMode] = useState<ViewMode>('GRID')

  // Rich per-solution camera list — response carries `ip_address` and
  // `status.is_online` inline, so no per-camera follow-up fetch is needed.
  const { data } = useTrafficVolumeSolutionCamerasList(deptId, id)
  const allCameras = useMemo(
    () => (data?.res_data ?? []).map(apiRowToEntry),
    [data]
  )

  const stats: FilterStats = useMemo(() => {
    let online = 0
    let offline = 0
    for (const c of allCameras) {
      if (c.connection === 'online') online++
      else offline++
    }
    return { all: allCameras.length, online, offline }
  }, [allCameras])

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
          <TableCameraTrafficVolume
            cameras={filtered}
            onOpen={openLive}
          />
        ) : (
          // Responsive auto-fill grid — 4 per row on a standard desktop
          // (~1832px grid width), stepping up to 5-6 on wider monitors. The
          // 360px minimum is tuned so 4 cards fit at this width but 5 don't.
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1rem' }}>
            {filtered.map((cam) => (
              <CameraTile
                key={cam.id}
                cam={cam}
                onOpen={openLive}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default React.memo(CamerasGridTrafficVolume)
