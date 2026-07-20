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
import ExportFileModal from '@/components/export/ExportFileModal'

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

// Shared column config for both PDF and Excel exports — SAME columns, SAME
// order + format expressions as the TABLE view (TableCameraTrafficSignal):
// ลำดับที่ → ชื่อกล้อง → Phase → การทำงาน → IP Address → Green Time → Volume
// → สถานะ (the grid tiles show the same fields). `width` = Excel chars,
// `widthPct` = PDF table percent (sums to 100).
const CAMERA_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: CameraEntry, index: number) => string | number
}[] = [
  { header: 'ลำดับที่', width: 8, widthPct: 6, value: (_r, i) => i + 1 },
  { header: 'ชื่อกล้อง', width: 40, widthPct: 30, align: 'left', value: (r) => r.code || '-' },
  { header: 'Phase', width: 8, widthPct: 7, value: (r) => `P${r.phase}` },
  { header: 'การทำงาน', width: 12, widthPct: 12, value: (r) => r.detectionMode },
  { header: 'IP Address', width: 16, widthPct: 15, value: (r) => r.ipAddress || '-' },
  { header: 'Green Time', width: 12, widthPct: 10, value: (r) => (r.detectionMode === 'Counting' ? `${r.greenTime}s` : '-') },
  { header: 'Volume', width: 12, widthPct: 10, value: (r) => (r.detectionMode === 'Counting' ? r.volume.toLocaleString() : '-') },
  { header: 'สถานะ', width: 12, widthPct: 10, value: (r) => (r.connection === 'online' ? 'Connect' : 'Disconnect') },
]

/** Single camera tile — HLS player + code + IP + per-mode footer pills.
 *  Clicking the player area opens the central Live Stream modal. */
const CameraTile: React.FC<{ cam: CameraEntry; onOpen: (cam: CameraEntry) => void }> = ({
  cam,
  onOpen,
}) => (
  // Card wrapper — same as the other menus' camera tiles (dark bg + border +
  // rounded + padding) so the camera cards look consistent across features.
  <div
    className='flex flex-col gap-1.5 rounded-2xl p-4'
    style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}
  >
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
        className='absolute top-2 right-2 text-[12px] px-2.5 py-1 rounded-full'
        style={{
          background: 'rgba(0,0,0,0.6)',
          // Counting → yellow; Stopline stays white (per Figma).
          color: cam.detectionMode === 'Counting' ? '#FCD116' : '#ffffff',
        }}
      >
        P{cam.phase} - {cam.detectionMode}
      </span>
    </div>
    <p className='text-blue-400 mb-0 fs-12 font-normal leading-snug line-clamp-2'>{cam.code}</p>
    {/* IP + Green Time + Volume on one row (IP left, pills right) — matches Figma.
      * No flex-wrap: IP truncates (min-w-0) so the pills stay on the same line. */}
    <div className='flex items-center justify-between gap-2 mt-1'>
      <p className='text-gray-400 mb-0 fs-12 min-w-0 truncate'>IP Address : {cam.ipAddress}</p>
      {cam.detectionMode === 'Counting' && (
        <div className='flex gap-2 shrink-0'>
          <span className='fs-12 border border-emerald-500 text-emerald-400 px-2 py-0.5 rounded-full'>
            Green Time : {cam.greenTime}s
          </span>
          <span className='fs-12 border border-(--yellow) text-(--yellow) px-2 py-0.5 rounded-full'>
            Volume : {cam.volume.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  </div>
)

const CamerasGridTrafficSignal: React.FC = () => {
  const { project } = useDetailContext()
  const dispatch = useAppDispatch()
  const [activeFilter, setActiveFilter] = useState('all')
  const [viewMode, setViewMode] = useState<ViewMode>('GRID')
  const [exportOpen, setExportOpen] = useState(false)

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
      allCameras
        .filter(
          (c) =>
            c.detectionMode === mode &&
            (activeFilter === 'all' || c.connection === activeFilter)
        )
        // Order by monitored phase (P1→P4) instead of the API's camera-name
        // order, so both the grid and table read P1, P2, P3, P4.
        .sort((a, b) => a.phase - b.phase)
    return { counting: inMode('Counting'), stopline: inMode('Stopline') }
  }, [activeFilter, allCameras])

  // Export rows in the SAME order the TABLE view renders: Counting block
  // first, then Stopline (both already phase-sorted + status-filtered).
  const exportRows = useMemo(
    () => [...filtered.counting, ...filtered.stopline],
    [filtered]
  )

  // Install point + active status filter — printed in the PDF header so a
  // reader knows which signal/subset they're looking at.
  const exportFilterNote = useMemo(() => {
    const parts: string[] = [project.installPoint]
    const filterLabel = FILTERS.find((f) => f.key === activeFilter)?.label
    if (activeFilter !== 'all' && filterLabel) parts.push(`สถานะ ${filterLabel}`)
    return parts.filter(Boolean).join(' · ')
  }, [project.installPoint, activeFilter])

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
          onExport={() => setExportOpen(true)}
        />
      </section>

      {/* ── นำออกเอกสาร — exports the CURRENTLY FILTERED cameras (same rows
            the grid/table shows), through the shared pdf/excel utils. */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        count={exportRows.length}
        onExportPdf={async () => {
          const { exportTablePdf } = await import('@/utils/export/pdf')
          await exportTablePdf({
            filenameBase: 'Traffic_Signal_Cameras_Report',
            title: 'รายงานรายการกล้องแยกสัญญาณไฟจราจร (Traffic Signal Cameras)',
            filterNote: exportFilterNote,
            columns: CAMERA_EXPORT_COLUMNS.map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows: exportRows,
          })
        }}
        onExportExcel={async () => {
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'Traffic_Signal_Cameras_Report',
            sheetName: 'Traffic Signal Cameras',
            columns: CAMERA_EXPORT_COLUMNS.map(({ header, width, value }) => ({ header, width, value })),
            rows: exportRows,
          })
        }}
      />

      <section className='mt-5'>
        {viewMode === 'TABLE' ? (
          /* TABLE view — flat list with Phase/Mode/IP/Green Time/Volume/Status.
           * Click a row to open the same Live Stream modal as the GRID view. */
          <TableCameraTrafficSignal
            cameras={[...filtered.counting, ...filtered.stopline]}
            onOpen={openLive}
          />
        ) : (
          /* GRID view — Counting tiles on top + Stopline tiles below.
           * A block with < 4 cameras fills the row evenly (3 → 3/row, 2 → 2/row);
           * 4+ cameras use 4/row (lg=6). */
          <>
            {filtered.counting.length > 0 && (
              <Row gutter={[16, 16]} className='mb-4'>
                {filtered.counting.map((cam) => (
                  <Col key={cam.id} xs={24} sm={12} md={12} lg={filtered.counting.length < 4 ? 24 / filtered.counting.length : 6}>
                    <CameraTile cam={cam} onOpen={openLive} />
                  </Col>
                ))}
              </Row>
            )}
            {filtered.stopline.length > 0 && (
              <Row gutter={[16, 16]}>
                {filtered.stopline.map((cam) => (
                  <Col key={cam.id} xs={24} sm={12} md={12} lg={filtered.stopline.length < 4 ? 24 / filtered.stopline.length : 6}>
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
