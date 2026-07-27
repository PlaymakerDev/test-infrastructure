import React, { useCallback, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import { TableOverallDailyWeight, OverallDailyWeightList } from '@/features/admin/tracking/detail/wim/components'
import { useDailyWeightLogList } from '@/features/admin/tracking/detail/wim/hooks'
import type { DailyWeightLogRow } from '@/features/admin/tracking/detail/wim/hooks'
import { useWIMContext } from '@/features/admin/tracking/detail/wim/context'
import { WEIGHT_FILTERS, IS_OVER_WEIGHT_BY_FILTER, WeightFilter } from '@/features/admin/tracking/detail/wim/data/weightFilters'
import {
  getDailyWeightLogExportColumns,
  fetchDailyWeightLogExportRows,
} from '@/features/admin/tracking/detail/wim/data/dailyWeightLogExport'
import SearchBar, { FilterStats } from '@/components/searchable/SearchBar'
import ExportFileModal from '@/components/export/ExportFileModal'
import { fmtNumber } from '@/utils/formatNumber';
import { getPageOffset } from '@/utils/pagination'

dayjs.extend(buddhistEra)
dayjs.locale('th')

interface Props {

}

const OverallDataDisplaySection: React.FC<Props> = () => {
  const { id: stationId, stationType } = useWIMContext()
  const [displayType, setDisplayType] = useState<'TABLE' | 'GRID'>('TABLE')
  const [weightFilter, setWeightFilter] = useState<WeightFilter>('all')
  const [exportOpen, setExportOpen] = useState(false)
  // Rows currently visible in the table/grid (both paginate internally and
  // report up via onPageRowsChange) — the export dialog's หน้าปัจจุบัน scope.
  const [pageRows, setPageRows] = useState<DailyWeightLogRow[]>([])
  // (page-1)*pageSize of the table/grid's current page — offsets the exported
  // ลำดับ column so it continues from the on-screen number instead of resetting to 1.
  const [pageOffset, setPageOffset] = useState(0)
  // Stable callback so the table/grid's report effect doesn't re-fire every parent render.
  const handlePageRowsChange = useCallback((rows: DailyWeightLogRow[], page: number, pageSize: number) => {
    setPageRows(rows)
    setPageOffset(getPageOffset(page, pageSize))
  }, [])

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

  const exportColumns = useMemo(
    () => getDailyWeightLogExportColumns({ hideSpeed: stationType === 'STATION' }),
    [stationType]
  )

  // หน้าปัจจุบัน scope: the on-screen table/grid numbers rows continuously
  // across pages ((page-1)*size+i+1) — offset the exported ลำดับ to match it.
  const columnsForScope = (scope?: 'all' | 'page') =>
    scope === 'page'
      ? exportColumns.map((c) =>
          c.key === 'no' ? { ...c, value: (_r: DailyWeightLogRow, i: number) => pageOffset + i + 1 } : c,
        )
      : exportColumns

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
            onPageRowsChange={handlePageRowsChange}
          />
        )
      case 'GRID':
        return (
          <OverallDailyWeightList
            stationId={stationId}
            stationType={stationType}
            isOverWeight={IS_OVER_WEIGHT_BY_FILTER[weightFilter]}
            onPageRowsChange={handlePageRowsChange}
          />
        )
      default:
        return null
    }
  }, [displayType, stationId, stationType, weightFilter, handlePageRowsChange])

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
          (same columns/format as TableOverallDailyWeight, minus image columns).
          The scope toggle picks ทั้งหมด (full filtered set, fetched at export
          time) vs หน้าปัจจุบัน (the rows the table/grid shows). */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        scope={{ totalCount: exportCount ?? 0, pageCount: pageRows.length }}
        onExportPdf={async (scope) => {
          const [{ exportTablePdf }, rows] = await Promise.all([
            import('@/utils/export/pdf'),
            scope === 'page' ? Promise.resolve(pageRows) : fetchExportRows(),
          ])
          await exportTablePdf({
            filenameBase: 'Tracking_Today_Weight_Log',
            title: 'รายงานข้อมูลรถเข้าชั่งน้ำหนักวันนี้ (Today Weight Log)',
            filterNote: exportFilterNote,
            columns: columnsForScope(scope).map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows,
          })
        }}
        onExportExcel={async (scope) => {
          const [{ exportExcel }, rows] = await Promise.all([
            import('@/utils/export/excel'),
            scope === 'page' ? Promise.resolve(pageRows) : fetchExportRows(),
          ])
          exportExcel({
            filenameBase: 'Tracking_Today_Weight_Log',
            sheetName: 'Today Weight Log',
            title: 'รายงานข้อมูลรถเข้าชั่งน้ำหนักวันนี้ (Today Weight Log)',
            filterNote: exportFilterNote,
            columns: columnsForScope(scope).map(({ header, width, value }) => ({ header, width, value })),
            rows,
          })
        }}
      />
    </div>
  )
}

export default React.memo<Props>(OverallDataDisplaySection)
