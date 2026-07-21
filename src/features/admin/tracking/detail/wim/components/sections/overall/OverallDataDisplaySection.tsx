import React, { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import { TableOverallDailyWeight, OverallDailyWeightList } from '@/features/admin/tracking/detail/wim/components'
import { useDailyWeightLogList } from '@/features/admin/tracking/detail/wim/hooks'
import { useWIMContext } from '@/features/admin/tracking/detail/wim/context'
import { WEIGHT_FILTERS, IS_OVER_WEIGHT_BY_FILTER, WeightFilter } from '@/features/admin/tracking/detail/wim/data/weightFilters'
import {
  DAILY_WEIGHT_LOG_EXPORT_COLUMNS,
  fetchDailyWeightLogExportRows,
} from '@/features/admin/tracking/detail/wim/data/dailyWeightLogExport'
import SearchBar, { FilterStats } from '@/components/searchable/SearchBar'
import ExportFileModal from '@/components/export/ExportFileModal'
import { fmtNumber } from '@/utils/formatNumber';

dayjs.extend(buddhistEra)
dayjs.locale('th')

interface Props {

}

const OverallDataDisplaySection: React.FC<Props> = () => {
  const { id: stationId, stationType } = useWIMContext()
  const [displayType, setDisplayType] = useState<'TABLE' | 'GRID'>('TABLE')
  const [weightFilter, setWeightFilter] = useState<WeightFilter>('all')
  const [exportOpen, setExportOpen] = useState(false)

  // Unfiltered (page_size 1) read, purely for meta.summary — the 3 filter badges
  // must always show all/normal/overweight counts together, regardless of which
  // tab is currently selected, so this is independent of `weightFilter`.
  const { meta: statsMeta } = useDailyWeightLogList(stationId as string | number | undefined, stationType, 1, 1)
  const summary = statsMeta?.summary

  const stats: FilterStats = useMemo(() => ({
    all: fmtNumber(Number(summary?.total)),
    normal: summary ? fmtNumber(Number(summary.total) - Number(summary.overweight)) : undefined,
    overweight: fmtNumber(Number(summary?.overweight)),
  }), [summary])

  // Row count for the export dialog — the active filter's badge number (raw,
  // unformatted), from the same meta.summary the badges read.
  const exportCount = useMemo(() => {
    if (!summary) return undefined
    const n = weightFilter === 'overweight'
      ? Number(summary.overweight)
      : weightFilter === 'normal'
        ? Number(summary.total) - Number(summary.overweight)
        : Number(summary.total)
    return Number.isFinite(n) ? n : undefined
  }, [summary, weightFilter])

  // Human-readable note of the active filter — printed in the PDF header so a
  // reader knows what subset they're looking at. This tab is always today's log.
  const exportFilterNote = useMemo(() => {
    const parts: string[] = [`วันที่ ${dayjs().format('DD/MM/BBBB')}`]
    const filterLabel = WEIGHT_FILTERS.find((f) => f.key === weightFilter)?.label
    if (weightFilter !== 'all' && filterLabel) parts.push(`สถานะ ${filterLabel}`)
    return parts.join(' · ')
  }, [weightFilter])

  // The table server-paginates internally, so the export fetches the full
  // result set for the CURRENT filter through the same endpoint the table
  // reads (station vs wim log) at click time.
  const fetchExportRows = () =>
    fetchDailyWeightLogExportRows({
      stationId: stationId as string | number | undefined,
      stationType,
      isOverWeight: IS_OVER_WEIGHT_BY_FILTER[weightFilter],
    })

  const renderContent = useMemo(() => {
    switch (displayType) {
      case 'TABLE':
        return (
          <TableOverallDailyWeight
            isOverWeight={IS_OVER_WEIGHT_BY_FILTER[weightFilter]}
          />
        )
      case 'GRID':
        return (
          <OverallDailyWeightList
            stationId={stationId}
            stationType={stationType}
            isOverWeight={IS_OVER_WEIGHT_BY_FILTER[weightFilter]}
          />
        )
      default:
        return null
    }
  }, [displayType, stationId, stationType, weightFilter])

  return (
    <div>
      <section>
        <h3 className='text-(--yellow) font-normal!'>ตารางข้อมูลรถเข้าชั่งน้ำหนักวันนี้</h3>
      </section>
      <section className='mt-5'>
        <SearchBar
          filters={WEIGHT_FILTERS}
          stats={stats}
          activeFilter={weightFilter}
          onFilterChange={(key) => setWeightFilter(key as WeightFilter)}
          defaultViewMode={displayType}
          onViewModeChange={setDisplayType}
          onExport={() => setExportOpen(true)}
        />
      </section>
      <section className='mt-5'>
        {renderContent}
      </section>

      {/* นำออกเอกสาร — exports today's weight-log rows for the CURRENT filter
          (same columns/format as TableOverallDailyWeight, minus image columns). */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        count={exportCount}
        onExportPdf={async () => {
          const [{ exportTablePdf }, rows] = await Promise.all([
            import('@/utils/export/pdf'),
            fetchExportRows(),
          ])
          await exportTablePdf({
            filenameBase: 'Tracking_Today_Weight_Log',
            title: 'รายงานข้อมูลรถเข้าชั่งน้ำหนักวันนี้ (Today Weight Log)',
            filterNote: exportFilterNote,
            columns: DAILY_WEIGHT_LOG_EXPORT_COLUMNS.map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows,
          })
        }}
        onExportExcel={async () => {
          const [{ exportExcel }, rows] = await Promise.all([
            import('@/utils/export/excel'),
            fetchExportRows(),
          ])
          exportExcel({
            filenameBase: 'Tracking_Today_Weight_Log',
            sheetName: 'Today Weight Log',
            columns: DAILY_WEIGHT_LOG_EXPORT_COLUMNS.map(({ header, width, value }) => ({ header, width, value })),
            rows,
          })
        }}
      />
    </div>
  )
}

export default React.memo<Props>(OverallDataDisplaySection)
