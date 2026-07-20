"use client"
import React, { useMemo, useState } from 'react'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import SearchBar, {
  type FilterConfig,
  type FilterStats,
  type ViewMode,
} from '@/components/searchable/SearchBar'
import TableCameraTrafficVolume from './TableCameraTrafficVolume'
import ExportFileModal from '@/components/export/ExportFileModal'
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

// Shared column config for both PDF and Excel exports — SAME columns, SAME
// order as the on-screen camera table (ลำดับที่ → ชื่อกล้อง → IP Address →
// สถานะ), which is the tabular form of what each grid card shows. The HLS
// stream itself has no exportable value. `width` = Excel chars, `widthPct`
// = PDF table percent (sums to 100).
const CAMERA_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: CameraEntry, index: number) => string | number
}[] = [
  { header: 'ลำดับที่', width: 8, widthPct: 10, value: (_r, i) => i + 1 },
  { header: 'ชื่อกล้อง', width: 40, widthPct: 45, align: 'left', value: (r) => r.code || '-' },
  { header: 'IP Address', width: 18, widthPct: 25, value: (r) => r.ipAddress || '-' },
  // Same wording as the table's StatusPill (Connect / Disconnect).
  { header: 'สถานะ', width: 12, widthPct: 20, value: (r) => (r.connection === 'online' ? 'Connect' : 'Disconnect') },
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
    <h4 className='camera-code'>{cam.code}</h4>
    <p className='camera-location text-(--light-gray-3)!'>IP Address : {cam.ipAddress || '-'}</p>
  </div>
)

const CamerasGridTrafficVolume: React.FC = () => {
  const deptId = useDeptId()
  const { id, location } = useDetailContext()
  const dispatch = useAppDispatch()
  const [activeFilter, setActiveFilter] = useState('all')
  // GRID is the design default — TABLE shows a flat list with name + coord
  // + status when the list icon is clicked.
  const [viewMode, setViewMode] = useState<ViewMode>('GRID')
  const [exportOpen, setExportOpen] = useState(false)

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

  // Human-readable note of the install point + active filter — printed in
  // the PDF header so a reader knows what subset they're looking at.
  const exportFilterNote = useMemo(() => {
    const parts: string[] = []
    const solutionName = location?.solution?.solution_name
    if (solutionName) parts.push(`จุดติดตั้ง ${solutionName}`)
    const filterLabel = FILTERS.find((f) => f.key === activeFilter)?.label
    if (activeFilter !== 'all' && filterLabel) parts.push(`สถานะ ${filterLabel}`)
    return parts.length ? parts.join(' · ') : undefined
  }, [location, activeFilter])

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
        {/* Default 'form' mode: filter pills + view-mode toggle + นำออกเอกสาร
          * button. No `formSearch` passed, so no search input — mirrors the
          * traffic-signal camera grid toolbar (which carries the export button). */}
        <SearchBar
          filters={FILTERS}
          stats={stats}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          defaultViewMode={viewMode}
          onViewModeChange={setViewMode}
          onExport={() => setExportOpen(true)}
        />
      </section>

      {/* ── นำออกเอกสาร — exports the CURRENTLY FILTERED cameras (what the
            grid/table shows), through the shared pdf/excel utils. */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        count={filtered.length}
        onExportPdf={async () => {
          const { exportTablePdf } = await import('@/utils/export/pdf')
          await exportTablePdf({
            filenameBase: 'Traffic_Volume_Camera_List',
            title: 'รายงานรายการกล้องนับปริมาณจราจร (Traffic Volume Camera List)',
            filterNote: exportFilterNote,
            columns: CAMERA_EXPORT_COLUMNS.map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows: filtered,
          })
        }}
        onExportExcel={async () => {
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'Traffic_Volume_Camera_List',
            sheetName: 'Camera List',
            columns: CAMERA_EXPORT_COLUMNS.map(({ header, width, value }) => ({ header, width, value })),
            rows: filtered,
          })
        }}
      />

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
