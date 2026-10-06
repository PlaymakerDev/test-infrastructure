import SearchBar, { FilterConfig, ViewMode } from '@/components/searchable/SearchBar'
import React, { useMemo, useState } from 'react'
import { ContentCCTV, TableCCTVData } from '../../../components'
import { useQuery } from '@tanstack/react-query'
import { useLPRDetailContext } from '../../../context'
import { getLPRRandomOnlineAPI } from '@/services/routes/NewLPRService'
import type { APIResponseLPRRandomOnline } from '@/types/lpr/new-lpr-api'
import { Empty, Skeleton } from 'antd'
import ExportFileModal from '@/components/export/ExportFileModal'
import type { RandomOnlineData } from '@/types/lpr/new-lpr-api'

interface Props {

}

const LPR_CAMERA_EXPORT_TITLE = 'รายงานกล้อง LPR ของจุดติดตั้ง (LPR Cameras)'

// Export columns — SAME headers, SAME order, SAME format expressions as the
// on-screen TableCCTVData (การทำงาน is the table's constant "LPR" badge;
// Stream Status mirrors its Connect/Disconnect pill — a camera with no
// is_online flag shows Disconnect there too). `width` = Excel chars;
// `widthPct` = PDF column % (sums to 100).
const LPR_CAMERA_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: RandomOnlineData, index: number) => string | number
}[] = [
  { header: 'ลำดับ', width: 8, widthPct: 8, align: 'center', value: (_r, i) => i + 1 },
  { header: 'ชื่อกล้อง', width: 50, widthPct: 44, value: (r) => r.camera.name || '-' },
  { header: 'การทำงาน', width: 14, widthPct: 12, align: 'center', value: () => 'LPR' },
  {
    header: 'Stream Status',
    width: 16,
    widthPct: 18,
    align: 'center',
    value: (r) => (r.camera.is_online ? 'Connect' : 'Disconnect'),
  },
  { header: 'IP Address', width: 18, widthPct: 18, value: (r) => r.camera.ip_address || '-' },
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

  const { data, isLoading, isError } = useQuery({
    queryKey: ['lpr-random-cctv', departmentId, roadId, solutionId],
    queryFn: () => getLPRRandomOnlineAPI(departmentId, {
      road_id: Number(roadId),
      solution_id: Number(solutionId),
      scope: 'all'
    }),
    enabled: !!departmentId && !!roadId && !!solutionId,
  })


  const cameras = data?.data

  // Badge numbers come from the rows actually fetched (not the API's `count`,
  // which can exceed what a `limit` returned) so each badge equals the number
  // of cards/rows its filter shows. A camera with no `is_online` flag is
  // counted in "ทั้งหมด" only — unknown is neither online nor offline.
  const stats = useMemo(() => {
    const rows = cameras?.data ?? []
    return {
      all: rows.length,
      online: rows.filter((item) => item.camera.is_online === true).length,
      offline: rows.filter((item) => item.camera.is_online === false).length,
    }
  }, [cameras])

  // Same response shape with `data` narrowed, so both views (grid + table)
  // take it as a drop-in for `cameras`.
  const filteredCameras = useMemo<APIResponseLPRRandomOnline | undefined>(() => {
    if (!cameras) return undefined
    if (activeFilter === 'online') {
      return { ...cameras, data: cameras.data.filter((item) => item.camera.is_online === true) }
    }
    if (activeFilter === 'offline') {
      return { ...cameras, data: cameras.data.filter((item) => item.camera.is_online === false) }
    }
    return cameras
  }, [cameras, activeFilter])

  // Export rows = exactly what the table/grid shows (the status filter applied;
  // the table's own pagination is client-side, so there is no page scope).
  const exportRows = useMemo(() => filteredCameras?.data ?? [], [filteredCameras])

  // Header note: which LPR point this is (the rows carry road + solution) and
  // the active status filter, so a printed report is self-describing.
  const exportFilterNote = useMemo(() => {
    const parts: string[] = []
    const first = cameras?.data?.[0]
    if (first?.road?.code_name) parts.push(`สายทาง ${first.road.code_name}`)
    if (first?.solution?.solution_name) parts.push(first.solution.solution_name)
    const filterLabel = LPR_FILTERS.find((f) => f.key === activeFilter)?.label
    if (activeFilter !== 'all' && filterLabel) parts.push(`สถานะ ${filterLabel}`)
    return parts.length ? parts.join(' · ') : undefined
  }, [cameras, activeFilter])

  const renderContent = useMemo(() => {
    switch (displayType) {
      case 'TABLE':
        return <TableCCTVData data={filteredCameras} isLoading={isLoading} isError={isError} />
      case 'GRID':
        return <ContentCCTV data={filteredCameras} isLoading={isLoading} isError={isError} />
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
