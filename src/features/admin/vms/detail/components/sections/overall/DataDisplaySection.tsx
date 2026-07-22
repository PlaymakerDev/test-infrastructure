import React, { useMemo, useState } from 'react'
import { TableCameraData, CameraList } from '../../../components'
import SearchBar, { type FilterConfig, type FilterStats, type ViewMode } from '@/components/searchable/SearchBar'
import ExportFileModal from '@/components/export/ExportFileModal'
import { CAMERA_MOCK_ROWS, type CameraRecord } from './TableCameraData'

interface Props {}

const FILTERS: FilterConfig[] = [
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

const STATS: FilterStats = { all: 4, online: 4, offline: 0 }

// Shared column config for both PDF and Excel exports — SAME columns, SAME
// order as the on-screen table (ลำดับที่ → ชื่อกล้อง/ป้าย → กม.ที่ →
// IP Address → Stream Status → Device Status). `width` = Excel chars,
// `widthPct` = PDF table percent (sums to 100).
const CAMERA_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: CameraRecord, index: number) => string | number
}[] = [
  { header: 'ลำดับที่', width: 8, widthPct: 7, value: (r) => r.no },
  { header: 'ชื่อกล้อง/ป้าย', width: 44, widthPct: 41, align: 'left', value: (r) => r.name || '-' },
  { header: 'กม.ที่', width: 10, widthPct: 10, value: (r) => r.km || '-' },
  { header: 'IP Address', width: 16, widthPct: 16, value: (r) => r.ipAddress || '-' },
  { header: 'Stream Status', width: 14, widthPct: 13, value: (r) => r.streamStatus },
  { header: 'Device Status', width: 14, widthPct: 13, value: (r) => r.deviceStatus },
]

const DataDisplaySection: React.FC<Props> = () => {
  const [displayType, setDisplayType] = useState<ViewMode>('TABLE')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [exportOpen, setExportOpen] = useState(false)

  const renderContent = useMemo(() => {
    switch (displayType) {
      case 'TABLE':
        return <TableCameraData />
      case 'GRID':
        return <CameraList />
      default:
        return null
    }
  }, [displayType])

  return (
    <div>
      <section>
        <SearchBar
          filters={FILTERS}
          stats={STATS}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          defaultViewMode={displayType}
          onViewModeChange={setDisplayType}
          onExport={() => setExportOpen(true)}
        />
      </section>

      {/* ── นำออกเอกสาร — exports the SAME (mock) rows the table renders.
            The status filter buttons don't filter the mock table yet, so no
            filterNote — export always matches what's on screen. */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        count={CAMERA_MOCK_ROWS.length}
        onExportPdf={async () => {
          const { exportTablePdf } = await import('@/utils/export/pdf')
          await exportTablePdf({
            filenameBase: 'VMS_Camera_List',
            title: 'รายงานข้อมูลกล้องและป้าย VMS (VMS Camera List)',
            columns: CAMERA_EXPORT_COLUMNS.map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows: CAMERA_MOCK_ROWS,
          })
        }}
        onExportExcel={async () => {
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'VMS_Camera_List',
            title: 'รายงานข้อมูลกล้องและป้าย VMS (VMS Camera List)',
            sheetName: 'VMS Cameras',
            columns: CAMERA_EXPORT_COLUMNS.map(({ header, width, value }) => ({ header, width, value })),
            rows: CAMERA_MOCK_ROWS,
          })
        }}
      />

      <section className='mt-5'>{renderContent}</section>
    </div>
  )
}

export default React.memo<Props>(DataDisplaySection)
