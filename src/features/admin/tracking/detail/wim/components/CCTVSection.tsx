import React, { useMemo, useState } from 'react'
import { FormSearchCCTV, DataDisplaySection, ModalCCTVData } from '../components'
import ExportFileModal from '@/components/export/ExportFileModal'
import { useWIMContext } from '../context'
import { useCctvList } from '../hooks'
import type { CameraFilter } from './sections/cctv/FormSearchCCTV'
import type { CCTVList as CCTVListItem } from '@/types/tracking/overall-api'

interface Props {

}

const DEFAULT_PAGE_SIZE = 10
const STATS_PAGE_SIZE = 100

// Shared column config for both PDF and Excel exports — mirrors the on-screen
// camera cards (CardCCTVData): ชื่อกล้อง (camera_description), "IP Address :
// {station_description}", and the online/offline status the card conveys via
// colour + the filter chips' labels. `width` = Excel chars, `widthPct` = PDF
// table percent (sums to 100).
const CCTV_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: CCTVListItem, index: number) => string | number
}[] = [
    { header: 'ลำดับ', width: 7, widthPct: 8, value: (_r, i) => i + 1 },
    { header: 'ชื่อกล้อง', width: 44, widthPct: 44, align: 'left', value: (r) => r.camera_description || '-' },
    { header: 'IP Address', width: 26, widthPct: 28, value: (r) => r.camera_ip || '-' },
    { header: 'สถานะ', width: 12, widthPct: 20, value: (r) => (r.camera_status === 'Online' ? 'ออนไลน์' : 'ออฟไลน์') },
  ]

const CCTVSection: React.FC<Props> = (props) => {
  const { } = props
  const { id, stationTypeId } = useWIMContext()
  const [activeFilter, setActiveFilter] = useState<CameraFilter>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [exportOpen, setExportOpen] = useState(false)

  const isFiltering = activeFilter !== 'all'

  // No documented camera_status filter param on /cameras/list (APIRequestTrackingCCTVList
  // has none), so a status filter can only be applied client-side. This full-list read
  // (page_size:100, mirrors OverallCCTV's widget) always drives the online/offline/all
  // stat badges, and doubles as the list's data source while filtering — "page N of the
  // online-only list" can't be derived from a single server page.
  const statsQuery = useCctvList({
    station_id: id as string,
    station_type_id: stationTypeId as number,
    page: 1,
    page_size: STATS_PAGE_SIZE,
  })

  // Real server-side pagination — fetched (and only meaningful) when no status filter
  // is active, so onChangePage/onChangePageSize hit the API with real page/page_size.
  const pagedQuery = useCctvList(
    {
      station_id: id as string,
      station_type_id: stationTypeId as number,
      page,
      page_size: pageSize,
    },
    !isFiltering,
  )

  const handleFilterChange = (filter: CameraFilter) => {
    setActiveFilter(filter)
    setPage(1)
  }

  const handlePageChange = (nextPage: number, nextPageSize: number) => {
    setPage(nextPage)
    setPageSize(nextPageSize)
  }

  const allCameras = useMemo(() => statsQuery.data?.data.data ?? [], [statsQuery.data])

  const stats = useMemo(() => ({
    all: allCameras.length,
    online: allCameras.filter((item) => item.camera_status === 'Online').length,
    offline: allCameras.filter((item) => item.camera_status === 'Offline').length,
  }), [allCameras])

  const filteredCameras = useMemo(() => {
    switch (activeFilter) {
      case 'online':
        return allCameras.filter((item) => item.camera_status === 'Online')
      case 'offline':
        return allCameras.filter((item) => item.camera_status === 'Offline')
      default:
        return allCameras
    }
  }, [allCameras, activeFilter])

  const displayData = isFiltering
    ? filteredCameras.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)
    : pagedQuery.data?.data.data ?? []

  const displayTotal = isFiltering
    ? filteredCameras.length
    : pagedQuery.data?.data.meta.total ?? 0

  const isLoading = isFiltering ? statsQuery.isLoading : pagedQuery.isLoading
  const isError = isFiltering ? statsQuery.isError : pagedQuery.isError

  // Human-readable note of the active filter — printed in the PDF header so a
  // reader knows what subset they're looking at.
  const exportFilterNote =
    activeFilter !== 'all' ? `สถานะ ${activeFilter === 'online' ? 'ออนไลน์' : 'ออฟไลน์'}` : undefined

  return (
    <div>
      <section>
        <FormSearchCCTV
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          stats={stats}
          onExport={() => setExportOpen(true)}
        />
      </section>

      {/* นำออกเอกสาร — exports the CURRENTLY FILTERED camera list (the same
          full stats-query dataset that drives the badges and the filtered
          view), through the shared pdf/excel utils like cctv overall. */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        count={filteredCameras.length}
        onExportPdf={async () => {
          const { exportTablePdf } = await import('@/utils/export/pdf')
          await exportTablePdf({
            filenameBase: 'Tracking_CCTV_Report',
            title: 'รายงานกล้อง CCTV ประจำจุดติดตั้ง (Tracking CCTV)',
            filterNote: exportFilterNote,
            columns: CCTV_EXPORT_COLUMNS.map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows: filteredCameras,
          })
        }}
        onExportExcel={async () => {
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'Tracking_CCTV_Report',
            sheetName: 'Tracking CCTV',
            title: 'รายงานกล้อง CCTV ประจำจุดติดตั้ง (Tracking CCTV)',
            filterNote: exportFilterNote,
            columns: CCTV_EXPORT_COLUMNS.map(({ header, width, value }) => ({ header, width, value })),
            rows: filteredCameras,
          })
        }}
      />
      <section className='mt-5'>
        <DataDisplaySection
          data={displayData}
          isLoading={isLoading}
          isError={isError}
          page={page}
          pageSize={pageSize}
          total={displayTotal}
          onPageChange={handlePageChange}
        />
      </section>
      <ModalCCTVData />
    </div>
  )
}

export default React.memo<Props>(CCTVSection)
