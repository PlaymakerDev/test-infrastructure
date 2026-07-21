import { ConfigProvider, Modal } from 'antd'
import React, { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import { INIT_MODAL_WEIGHT_LOG, useWIMContext } from '../../../context'
import { FormSearchWeightLog, TableWeightLog, OverallDailyWeightList } from '../../../components'
import { useDailyWeightLogList } from '../../../hooks'
import type { DailyWeightLogRow } from '../../../hooks'
import { WEIGHT_FILTERS, IS_OVER_WEIGHT_BY_FILTER, WeightFilter } from '../../../data/weightFilters'
import { DAILY_WEIGHT_LOG_EXPORT_COLUMNS, fetchDailyWeightLogExportRows } from '../../../data/dailyWeightLogExport'
import type { FilterStats, ViewMode } from '@/components/searchable/SearchBar'
import ExportFileModal from '@/components/export/ExportFileModal'
import { fmtNumber } from '@/utils/formatNumber'

dayjs.extend(buddhistEra)
dayjs.locale('th')

interface Props {

}

const Content: React.FC<Props> = () => {
  const { openWeightLogModal } = useWIMContext()
  const { stationId, stationType, stationName, date } = openWeightLogModal
  const [displayType, setDisplayType] = useState<ViewMode>('TABLE')
  const [weightFilter, setWeightFilter] = useState<WeightFilter>('all')
  const [exportOpen, setExportOpen] = useState(false)
  // Rows currently visible in the table/grid (both paginate internally and
  // report up via onPageRowsChange) — the export dialog's หน้าปัจจุบัน scope.
  const [pageRows, setPageRows] = useState<DailyWeightLogRow[]>([])

  const stationLabel = stationType === 'STATION' ? 'สถานี' : 'Weight in Motion (WIM)'

  // Unfiltered (page_size 1) read, purely for meta.summary — mirrors OverallDataDisplaySection,
  // scoped to the same single day (`openWeightLogModal.date`) as the table below instead of always "today".
  const { meta: statsMeta } = useDailyWeightLogList(stationId as string | number | undefined, stationType, 1, 1, undefined, date)
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

  // Human-readable note of the modal's scope — printed in the PDF header so a
  // reader knows which station/day/filter subset they're looking at.
  const exportFilterNote = useMemo(() => {
    const parts: string[] = []
    if (stationName) parts.push(`${stationLabel} ${stationName}`)
    if (date) parts.push(`วันที่ ${dayjs(date).format('DD/MM/BBBB')}`)
    const filterLabel = WEIGHT_FILTERS.find((f) => f.key === weightFilter)?.label
    if (weightFilter !== 'all' && filterLabel) parts.push(`สถานะ ${filterLabel}`)
    return parts.length ? parts.join(' · ') : undefined
  }, [stationLabel, stationName, date, weightFilter])

  // The table server-paginates internally, so the export fetches the full
  // result set for the modal's day + CURRENT filter through the same endpoint
  // the table reads (station vs wim log) at click time.
  const fetchExportRows = () =>
    fetchDailyWeightLogExportRows({
      stationId: stationId as string | number | undefined,
      stationType,
      isOverWeight: IS_OVER_WEIGHT_BY_FILTER[weightFilter],
      date,
    })

  const renderContent = useMemo(() => {
    switch (displayType) {
      case 'TABLE':
        return <TableWeightLog isOverWeight={IS_OVER_WEIGHT_BY_FILTER[weightFilter]} onPageRowsChange={setPageRows} />
      case 'GRID':
        return (
          <OverallDailyWeightList
            stationId={stationId}
            stationType={stationType}
            isOverWeight={IS_OVER_WEIGHT_BY_FILTER[weightFilter]}
            date={date}
            onPageRowsChange={setPageRows}
          />
        )
      default:
        return null
    }
  }, [displayType, stationId, stationType, weightFilter, date])

  return (
    <div>
      <section>
        <h3 className='text-(--yellow)'>รายละเอียดรถเข้าชั่ง </h3>
        <p className='fs-12 text-white/50'>{stationLabel} : {stationName ?? '-'}</p>
        <p className='fs-12'>วันที่เข้าชั่ง : {date ? dayjs(date).format('DD MMM BBBB') : '-'}</p>
      </section>
      <section className='mt-5'>
        <FormSearchWeightLog
          activeFilter={weightFilter}
          onFilterChange={setWeightFilter}
          stats={stats}
          displayType={displayType}
          onDisplayTypeChange={setDisplayType}
          onExport={() => setExportOpen(true)}
        />
      </section>
      <section className='mt-5'>
        {renderContent}
      </section>

      {/* นำออกเอกสาร — exports the modal's single-day weight-log rows for the
          CURRENT filter (same columns/format as TableWeightLog). Mounted inside
          the log modal; antd stacks the nested modal itself. */}
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
            filenameBase: 'Tracking_Weight_Log_Detail',
            title: 'รายงานรายละเอียดรถเข้าชั่ง (Weight Log Detail)',
            filterNote: exportFilterNote,
            columns: DAILY_WEIGHT_LOG_EXPORT_COLUMNS.map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows,
          })
        }}
        onExportExcel={async (scope) => {
          const [{ exportExcel }, rows] = await Promise.all([
            import('@/utils/export/excel'),
            scope === 'page' ? Promise.resolve(pageRows) : fetchExportRows(),
          ])
          exportExcel({
            filenameBase: 'Tracking_Weight_Log_Detail',
            sheetName: 'Weight Log Detail',
            columns: DAILY_WEIGHT_LOG_EXPORT_COLUMNS.map(({ header, width, value }) => ({ header, width, value })),
            rows,
          })
        }}
      />
    </div>
  )
}

const ModalWeightLog: React.FC<Props> = (props) => {
  const { } = props
  const { openWeightLogModal, setOpenWeightLogModal } = useWIMContext()

  return (
    <ConfigProvider
      theme={{
        token: {
          colorIcon: '#FFFFFF',
          colorIconHover: '#FFFFFF80',
        },
      }}
    >
      <Modal
        title={false}
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={openWeightLogModal.open}
        onOk={() => setOpenWeightLogModal(INIT_MODAL_WEIGHT_LOG)}
        onCancel={() => setOpenWeightLogModal(INIT_MODAL_WEIGHT_LOG)}
        footer={null}
        destroyOnHidden
        width={1700}
      >
        <Content />
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ModalWeightLog)
