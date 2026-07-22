"use client"
import React, { useMemo, useState } from 'react'
import {
  TableCameraData,
  CameraList
} from '../../../components'
import SearchBar, {
  type FilterConfig,
  type FilterStats,
  type ViewMode,
} from '@/components/searchable/SearchBar'
import { useCrosswalkCameras } from '@/hooks/queries/crosswalk'
import { useDeptId } from '@/hooks/useDeptId'
import { useDetailContext } from '../../../context'
import { deriveFunctions, extractKm } from './TableCameraData'
import { extractIpFromHlsUrl } from '@/utils/extractIpFromHlsUrl'
import { DEVICE_BADGE } from '@/constants/cctv'
import type { CrosswalkCameraItem } from '@/types/crosswalk/detail-api'
import ExportFileModal from '@/components/export/ExportFileModal'

interface Props {

}

const CROSSWALK_FILTERS: FilterConfig[] = [
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

// Shared column config for both PDF and Excel exports — SAME columns, SAME
// order as the on-screen TableCameraData (ลำดับที่ → ชื่อกล้อง → กม.ที่ →
// การทำงาน → IP Address → Stream/Device Status), reusing its extractKm /
// deriveFunctions expressions so the printed cells match the screen. `width`
// = Excel chars, `widthPct` = PDF table percent (sums to 100).
const CAMERA_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: CrosswalkCameraItem, index: number) => string | number
}[] = [
  { header: 'ลำดับ', width: 7, widthPct: 5, value: (_r, i) => i + 1 },
  { header: 'ชื่อกล้อง', width: 40, widthPct: 30, align: 'left', value: (r) => r.camera_name || '-' },
  { header: 'กม.ที่', width: 10, widthPct: 8, value: (r) => extractKm(r.camera_name) },
  {
    header: 'การทำงาน', width: 30, widthPct: 17, align: 'left',
    value: (r) => deriveFunctions(r).map((k) => DEVICE_BADGE[k].label).join(', '),
  },
  { header: 'IP Address', width: 18, widthPct: 14, value: (r) => (r.ip_address ?? extractIpFromHlsUrl(r.hls_url)) || '-' },
  { header: 'Stream Status', width: 14, widthPct: 13, value: (r) => (r.is_online ? 'เชื่อมต่อ' : 'ไม่เชื่อมต่อ') },
  { header: 'Device Status', width: 14, widthPct: 13, value: (r) => (r.is_online ? 'ออนไลน์' : 'ออฟไลน์') },
]

const OverallDataDisplaySection: React.FC<Props> = (props) => {
  const { } = props
  const deptId = useDeptId()
  const { id } = useDetailContext()
  const [displayType, setDisplayType] = useState<ViewMode>('GRID')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [exportOpen, setExportOpen] = useState(false)

  // React Query dedupes with the same call inside TableCameraData/CameraList
  // — one network request, shared cache.
  const { data } = useCrosswalkCameras(deptId, { solution_id: id })

  const stats = useMemo<FilterStats>(() => {
    const cameras = data?.cameras ?? []
    const online = cameras.filter((c) => c.is_online).length
    return {
      all: cameras.length,
      online,
      offline: cameras.length - online,
    }
  }, [data])

  // Export rows = the CURRENTLY FILTERED cameras — same status filter
  // TableCameraData/CameraList apply on this shared (deduped) query.
  const exportRows = useMemo<CrosswalkCameraItem[]>(() => {
    const cameras = data?.cameras ?? []
    return cameras.filter((c) => {
      if (activeFilter === 'online') return c.is_online
      if (activeFilter === 'offline') return !c.is_online
      return true
    })
  }, [data, activeFilter])

  // Human-readable note of the active filter — printed in the PDF header so
  // a reader knows what subset they're looking at.
  const exportFilterNote = useMemo(() => {
    const filterLabel = CROSSWALK_FILTERS.find((f) => f.key === activeFilter)?.label
    return activeFilter !== 'all' && filterLabel ? `สถานะ ${filterLabel}` : undefined
  }, [activeFilter])

  const renderContent = useMemo(() => {
    switch (displayType) {
      case 'TABLE':
        return <TableCameraData activeFilter={activeFilter} />
      case 'GRID':
        return <CameraList activeFilter={activeFilter} />
      default:
        return null
    }
  }, [displayType, activeFilter])

  return (
    <div>
      <section>
        <SearchBar
          filters={CROSSWALK_FILTERS}
          stats={stats}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          defaultViewMode={displayType}
          onViewModeChange={setDisplayType}
          onExport={() => setExportOpen(true)}
        />
      </section>

      {/* นำออกเอกสาร — exports the CURRENTLY FILTERED cameras (what the
          table/grid shows), through the shared pdf/excel utils. */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        count={exportRows.length}
        onExportPdf={async () => {
          const { exportTablePdf } = await import('@/utils/export/pdf')
          await exportTablePdf({
            filenameBase: 'Crosswalk_Camera_Report',
            title: 'รายงานกล้องประจำจุดติดตั้งสัญญาณไฟทางข้าม (Crosswalk Cameras)',
            filterNote: exportFilterNote,
            columns: CAMERA_EXPORT_COLUMNS.map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows: exportRows,
          })
        }}
        onExportExcel={async () => {
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'Crosswalk_Camera_Report',
            sheetName: 'Crosswalk Cameras',
            title: 'รายงานกล้องประจำจุดติดตั้งสัญญาณไฟทางข้าม (Crosswalk Cameras)',
            filterNote: exportFilterNote,
            columns: CAMERA_EXPORT_COLUMNS.map(({ header, width, value }) => ({ header, width, value })),
            rows: exportRows,
          })
        }}
      />

      <section className='mt-5'>
        {renderContent}
      </section>
    </div>
  )
}

export default React.memo<Props>(OverallDataDisplaySection)
