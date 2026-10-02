"use client"
import React, { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import SearchBar, {
  type FilterConfig,
  type FilterStats,
  type ViewMode,
} from '@/components/searchable/SearchBar'
import ExportFileModal from '@/components/export/ExportFileModal'
import { hideProjectNameColumns } from '@/constants/featureFlags'
import { TableLPRData, LPRList, FormSearchLPR } from '../../../components'
import { filterLPRList } from '../../../data/filterLPRList'
import { LPR_EXPORT_COLUMNS, toLPRExportRows } from '../../../data/lprExport'
import { useDeptId } from '@/hooks/useDeptId'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getLPRListAPI, getLPRTotalAPI } from '@/services/routes/NewLPRService'
import { Empty, Skeleton } from 'antd'

dayjs.extend(buddhistEra)

interface Props {
  deptId?: string | string[] | number
}

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
  {
    key: 'warranty',
    label: 'ในค้ำ',
    colorPrimary: '#05F2DB',
    colorTextLightSolid: '#212121',
    badgeActiveClass: 'bg-[#016f64] text-white',
    badgeIdleClass: 'bg-[#05F2DB]/20 text-[#05F2DB]',
  },
  {
    key: 'expired',
    label: 'หมดค้ำ',
    colorPrimary: '#979797',
    colorTextLightSolid: '#212121',
    badgeActiveClass: 'bg-[#4a4a4a] text-white',
    badgeIdleClass: 'bg-[#979797]/20 text-[#979797]',
  },
]

// Same title string for the PDF header and the Excel header block.
const LPR_EXPORT_TITLE = 'รายงานสรุปภาพรวมจุดติดตั้ง LPR (LPR Overview)'

const INIT_STATS: FilterStats = {
  all: 0,
  online: 0,
  offline: 0,
  warranty: 0,
  expired: 0
}

const DataDisplaySection: React.FC<Props> = (props) => {
  const { deptId: deptIdProp } = props
  const deptIdFromUrl = useDeptId()
  const deptId = String(deptIdProp ?? deptIdFromUrl ?? '0')
  const [viewMode, setViewMode] = useState<ViewMode>('TABLE')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [exportOpen, setExportOpen] = useState(false)
  // Search is a server-side road-code lookup (debounced by FormSearchLPR).
  const roadCode = search.trim()

  const {
    data: lprTotal,
    isLoading: isLPRTotalLoading,
    isError: isLPRTotalError
  } = useQuery({
    queryKey: ['lpr-total', deptId],
    queryFn: () => getLPRTotalAPI(deptId, {
      scope: 'all',
    }),
    enabled: !!deptId,
  })

  const {
    data: lprList,
    isLoading: isLPRListLoading,
    isError: isLPRListError
  } = useQuery({
    queryKey: ['lpr-list', deptId, roadCode],
    queryFn: () => getLPRListAPI(deptId, {
      scope: 'all',
      road_code: roadCode || undefined,
    }),
    enabled: !!deptId,
    // Keep the current table on screen while the next search result loads,
    // instead of flashing the skeleton on every debounced keystroke.
    placeholderData: keepPreviousData,
  })

  const renderStats = useMemo(() => {
    if (isLPRTotalLoading) return INIT_STATS
    if (isLPRTotalError) return INIT_STATS
    return {
      all: lprTotal?.data.solution.total || 0,
      online: lprTotal?.data.solution.online || 0,
      offline: lprTotal?.data.solution.offline || 0,
      warranty: lprTotal?.data.warranty.active || 0,
      expired: lprTotal?.data.warranty.expired || 0
    }
  }, [lprTotal, isLPRTotalLoading, isLPRTotalError])

  // Status chip → keep only the matching install points (table re-groups and
  // recounts "N โครงการ" from the filtered tree).
  const filteredList = useMemo(
    () => filterLPRList(lprList?.data, activeFilter),
    [lprList?.data, activeFilter],
  )

  // Export rows in the SAME order the table displays, from the same filtered
  // tree — exports exactly what's on screen.
  const exportRows = useMemo(() => toLPRExportRows(filteredList), [filteredList])

  // Human-readable note of the active filter/search — printed in the PDF/Excel
  // header so a reader knows what subset they're looking at.
  const exportFilterNote = useMemo(() => {
    const parts: string[] = []
    const filterLabel = LPR_FILTERS.find((f) => f.key === activeFilter)?.label
    if (activeFilter !== 'all' && filterLabel) parts.push(`สถานะ ${filterLabel}`)
    if (roadCode) parts.push(`ค้นหารหัสสายทาง "${roadCode}"`)
    return parts.length ? parts.join(' · ') : undefined
  }, [activeFilter, roadCode])

  const renderContent = useMemo(() => {
    switch (viewMode) {
      case 'TABLE':
        return (
          <TableLPRData
            data={filteredList}
            isLoading={isLPRListLoading}
            isError={isLPRListError}
          />
        )
      case 'GRID':
        return (
          <LPRList
            data={filteredList}
            isLoading={isLPRListLoading}
            isError={isLPRListError}
          />
        )
      default:
        return null
    }
  }, [viewMode, filteredList, isLPRListLoading, isLPRListError])

  const renderHandleLoadContent = useMemo(() => {
    if (isLPRListLoading) return <Skeleton loading={isLPRListLoading} active paragraph={{ rows: 4 }} />
    if (isLPRListError) return <Empty description="Error loading data" />
    return renderContent
  }, [isLPRListLoading, isLPRListError, renderContent])

  return (
    <div>
      <section>
        <SearchBar
          filters={LPR_FILTERS}
          stats={renderStats}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          defaultViewMode={viewMode}
          onViewModeChange={setViewMode}
          formSearch={<FormSearchLPR onSearch={(v) => setSearch(v.search)} />}
          onExport={() => setExportOpen(true)}
        />
      </section>

      {/* นำออกเอกสาร — exports the CURRENTLY FILTERED rows (what the table
          shows), through the shared pdf/excel utils like tunnel / cctv overall. */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        count={exportRows.length}
        onExportPdf={async () => {
          const { exportTablePdf } = await import('@/utils/export/pdf')
          await exportTablePdf({
            filenameBase: 'LPR_Overview_Report',
            title: LPR_EXPORT_TITLE,
            filterNote: exportFilterNote,
            columns: hideProjectNameColumns(LPR_EXPORT_COLUMNS).map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows: exportRows,
          })
        }}
        onExportExcel={async () => {
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'LPR_Overview_Report',
            sheetName: 'LPR Overview',
            title: LPR_EXPORT_TITLE,
            filterNote: exportFilterNote,
            columns: hideProjectNameColumns(LPR_EXPORT_COLUMNS).map(({ header, width, value }) => ({ header, width, value })),
            rows: exportRows,
          })
        }}
      />

      <section className='mt-5'>
        {renderHandleLoadContent}
      </section>
    </div>
  )
}

export default React.memo<Props>(DataDisplaySection)
