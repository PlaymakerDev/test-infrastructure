import SearchBar, { FilterConfig, ViewMode } from '@/components/searchable/SearchBar'
import React, { useMemo, useState } from 'react'
import { ContentCCTV, TableCCTVData } from '../../../components'
import { useQuery } from '@tanstack/react-query'
import { useLPRDetailContext } from '../../../context'
import { getLPRSolutionCameraAPI } from '@/services/routes/NewLPRService'
import { useLPRPointOverview } from '@/hooks/queries/lpr'
import type { SolutionCamera } from '@/types/lpr/new-lpr-api'
import { Empty, Skeleton } from 'antd'
import ExportFileModal from '@/components/export/ExportFileModal'

interface Props {

}

const LPR_CAMERA_EXPORT_TITLE = 'รายงานกล้อง LPR ของจุดติดตั้ง (LPR Cameras)'

// Export columns — SAME headers, SAME order, SAME format expressions as the
// on-screen TableCCTVData (กม.ที่ is the camera's `sta` chainage; การทำงาน is
// the table's constant "LPR" badge; Stream Status mirrors its Connect/Disconnect
// pill — a camera with no is_online flag shows Disconnect there too). `width` =
// Excel chars; `widthPct` = PDF column % (sums to 100).
const LPR_CAMERA_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: SolutionCamera, index: number) => string | number
}[] = [
    { header: 'ลำดับ', width: 8, widthPct: 8, align: 'center', value: (_r, i) => i + 1 },
    { header: 'ชื่อกล้อง', width: 50, widthPct: 36, value: (r) => r.camera_name || '-' },
    { header: 'กม.ที่', width: 12, widthPct: 10, align: 'center', value: (r) => r.sta || '-' },
    { header: 'การทำงาน', width: 14, widthPct: 12, align: 'center', value: () => 'LPR' },
    {
      header: 'Stream Status',
      width: 16,
      widthPct: 16,
      align: 'center',
      value: (r) => (r.is_online ? 'Connect' : 'Disconnect'),
    },
    { header: 'IP Address', width: 18, widthPct: 18, value: (r) => r.ip_address || '-' },
  ]

const LPR_FILTERS: FilterConfig[] = [
  {
    key: 'all',
    label: 'ทั้งหมด',
    colorPrimary: '#FCD116',
    colorTextLightSolid: '#212121',
    badgeActiveClass: 'bg-[#8a7000] text-white',
    badgeIdleClass: 'bg-[#FCD116]/20 text-[#FCD116]',
  },
  {
    key: 'online',
    label: 'ออนไลน์',
    colorPrimary: '#66AEFF',
    colorTextLightSolid: '#212121',
    badgeActiveClass: 'bg-[#1B3F8B] text-white',
    badgeIdleClass: 'bg-[#66AEFF]/20 text-[#66AEFF]',
  },
  {
    key: 'offline',
    label: 'ออฟไลน์',
    colorPrimary: '#E94C4C',
    colorTextLightSolid: '#ffffff',
    badgeActiveClass: 'bg-red-800 text-white',
    badgeIdleClass: 'bg-red-500/20 text-red-400',
  },
]

const DataDisplaySection: React.FC<Props> = (props) => {
  const { } = props
  const [displayType, setDisplayType] = useState<ViewMode>('GRID')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [exportOpen, setExportOpen] = useState(false)
  const { departmentId, roadId, solutionId } = useLPRDetailContext()

  // GET /lpr/solutions/{id}/cameras — every camera of this install point.
  const { data, isLoading, isError } = useQuery({
    queryKey: ['lpr-solution-cameras', solutionId],
    queryFn: () => getLPRSolutionCameraAPI(solutionId),
    enabled: !!solutionId,
  })

  // Same cache entry TitleSection / ContentMap already read — gives the road +
  // install-point name for the export header (the cameras payload has neither).
  const overview = useLPRPointOverview(departmentId, roadId, solutionId)

  // BE may send `cameras: null` for a point with none — normalise once.
  const allCameras = useMemo<SolutionCamera[]>(() => data?.data?.cameras ?? [], [data])

  // Badge numbers come from the rows actually fetched, so each badge equals the
  // number of cards/rows its filter shows. A camera with no `is_online` flag is
  // counted in "ทั้งหมด" only — unknown is neither online nor offline.
  const stats = useMemo(
    () => ({
      all: allCameras.length,
      online: allCameras.filter((item) => item.is_online === true).length,
      offline: allCameras.filter((item) => item.is_online === false).length,
    }),
    [allCameras],
  )

  // Rows both views (grid + table) render.
  const filteredCameras = useMemo<SolutionCamera[]>(() => {
    if (activeFilter === 'online') return allCameras.filter((item) => item.is_online === true)
    if (activeFilter === 'offline') return allCameras.filter((item) => item.is_online === false)
    return allCameras
  }, [allCameras, activeFilter])

  // Export rows = exactly what the table/grid shows (the status filter applied;
  // the table's own pagination is client-side, so there is no page scope).
  const exportRows = filteredCameras

  // Header note: which LPR point this is and the active status filter, so a
  // printed report is self-describing.
  const exportFilterNote = useMemo(() => {
    const parts: string[] = []
    const point = overview.data?.locations?.[0]
    if (point?.road?.code_name) parts.push(`สายทาง ${point.road.code_name}`)
    if (point?.solution?.solution_name) parts.push(point.solution.solution_name)
    const filterLabel = LPR_FILTERS.find((f) => f.key === activeFilter)?.label
    if (activeFilter !== 'all' && filterLabel) parts.push(`สถานะ ${filterLabel}`)
    return parts.length ? parts.join(' · ') : undefined
  }, [overview.data, activeFilter])

  const renderContent = useMemo(() => {
    switch (displayType) {
      case 'TABLE':
        return <TableCCTVData cameras={filteredCameras} isLoading={isLoading} isError={isError} />
      case 'GRID':
        return <ContentCCTV cameras={filteredCameras} isLoading={isLoading} isError={isError} />
      default:
        return null
    }
  }, [displayType, filteredCameras, isLoading, isError])

  const renderDataLoading = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 4 }} />
    if (isError) return <Empty description="เกิดข้อผิดพลาดในการโหลดข้อมูล" />
    return renderContent
  }, [isError, isLoading, renderContent])

  const renderSearchBar = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 4 }} />
    if (isError) return <Empty description="เกิดข้อผิดพลาดในการโหลดข้อมูล" />
    return (
      <SearchBar
        filters={LPR_FILTERS}
        stats={stats}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        defaultViewMode={displayType}
        onViewModeChange={setDisplayType}
        // formSearch={<FormSearchVMS onSearch={onSearch} />}
        onExport={() => setExportOpen(true)}
      />
    )
  }, [activeFilter, displayType, isError, isLoading, stats])

  return (
    <div>
      <section>
        {renderSearchBar}
      </section>

      {/* ── นำออกเอกสาร — exports the CURRENTLY FILTERED rows (what the
                  table/card grid shows), mirroring the CCTV overview report. */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        count={exportRows.length}
        onExportPdf={async () => {
          const { exportTablePdf } = await import('@/utils/export/pdf')
          await exportTablePdf({
            filenameBase: 'LPR_Cameras_Report',
            title: LPR_CAMERA_EXPORT_TITLE,
            filterNote: exportFilterNote,
            columns: LPR_CAMERA_EXPORT_COLUMNS.map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows: exportRows,
          })
        }}
        onExportExcel={async () => {
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'LPR_Cameras_Report',
            sheetName: 'LPR Cameras',
            title: LPR_CAMERA_EXPORT_TITLE,
            filterNote: exportFilterNote,
            columns: LPR_CAMERA_EXPORT_COLUMNS.map(({ header, width, value }) => ({ header, width, value })),
            rows: exportRows,
          })
        }}
      />

      <section className='mt-5'>
        {renderDataLoading}
      </section>
    </div>
  )
}

export default React.memo<Props>(DataDisplaySection)
