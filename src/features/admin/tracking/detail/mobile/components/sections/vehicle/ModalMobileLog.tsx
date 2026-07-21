"use client"
import { ConfigProvider, Modal } from 'antd'
import React, { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import type { FilterStats, ViewMode } from '@/components/searchable/SearchBar'
import type { MobileCarList, MobileMasterData } from '@/types/tracking/detail-api'
import ExportFileModal from '@/components/export/ExportFileModal'
import { fmtNumber } from '@/utils/formatNumber'
import { useMobileCar } from '../../../hooks'
import { MOBILE_WEIGHT_FILTERS, MOBILE_IS_OVER_WEIGHT_BY_FILTER, MobileWeightFilter } from '../../../data/mobileWeightFilters'
import { INIT_OPEN_MOBILE_LOG, useMobileContext } from '../../../context'
import FormSearchMobileLog from './FormSearchMobileLog'
import TableMobileDailyWeight from '../overall/TableMobileDailyWeight'
import MobileDailyWeightList from '../overall/MobileDailyWeightList'

dayjs.extend(buddhistEra)
dayjs.locale('th')

const DEFAULT_PAGE_SIZE = 10

// Mirrors the table's max page-size option; when the result set is larger the
// export refetches with the reported total so nothing is cut off.
const EXPORT_PAGE_SIZE = 100

// Shared column config for both PDF and Excel exports — SAME columns, SAME
// order and cell text as the on-screen TableMobileDailyWeight, minus the two
// image columns (ภาพรถบรรทุก/สลิปน้ำหนัก render as pictures on screen —
// skipped in a printed report). `width` = Excel chars, `widthPct` = PDF table
// percent (sums to 100).
const MOBILE_LOG_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: MobileCarList, index: number) => string | number
}[] = [
  { header: 'ลำดับ', width: 7, widthPct: 5, value: (_r, i) => i + 1 },
  {
    header: 'วันที่และเวลา',
    width: 24,
    widthPct: 14,
    value: (r) => (r.create_date ? dayjs(r.create_date, 'DD/MM/BBBB HH:mm:ss').format('DD MMM BBBB HH:mm:ss') : '-'),
  },
  { header: 'ทะเบียนรถ', width: 20, widthPct: 12, value: (r) => r.lp_head || '-' },
  { header: 'ประเภทรถบรรทุก', width: 34, widthPct: 23, align: 'left', value: (r) => r.vehicle_class_desc || '-' },
  { header: 'น้ำหนักที่ชั่งได้', width: 15, widthPct: 10, value: (r) => (r.gross_weight ? fmtNumber(Number(r.gross_weight), 2) : '-') },
  { header: 'น้ำหนักตามกำหนด', width: 17, widthPct: 10, value: (r) => (r.legal_weight ? fmtNumber(Number(r.legal_weight), 2) : '-') },
  { header: 'น้ำหนักเกิน', width: 13, widthPct: 8, value: (r) => (r.gross_weight_over ? fmtNumber(Number(r.gross_weight_over), 2) : '0') },
  { header: 'สถานะน้ำหนักรวม', width: 16, widthPct: 9, value: (r) => (r.is_over_weight === 'Y' ? 'น้ำหนักเกิน' : 'น้ำหนักปกติ') },
  { header: 'สถานะเพลา', width: 13, widthPct: 9, value: (r) => (r.is_over_weight === 'P' ? 'น้ำหนักเกิน' : 'น้ำหนักปกติ') },
]

interface ContentProps {
  record: MobileMasterData | null
}

const Content: React.FC<ContentProps> = (props) => {
  const { record } = props
  const [displayType, setDisplayType] = useState<ViewMode>('TABLE')
  const [weightFilter, setWeightFilter] = useState<MobileWeightFilter>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [exportOpen, setExportOpen] = useState(false)

  const handleFilterChange = (filter: MobileWeightFilter) => {
    setWeightFilter(filter)
    setPage(1)
  }

  const handlePageChange = (nextPage: number, nextPageSize: number) => {
    setPage(nextPage)
    setPageSize(nextPageSize)
  }

  const { data, isLoading, isError } = useMobileCar({
    tid: record?.TID,
    is_over_weight: MOBILE_IS_OVER_WEIGHT_BY_FILTER[weightFilter],
    page,
    page_size: pageSize,
  })

  // Dedicated page_size:1 reads purely for badge totals — MobileCarData's meta has
  // no summary breakdown (unlike wim's weightWIMLogMeta.summary), so each filter's
  // count needs its own request rather than coming free with the main table fetch.
  const allCount = useMobileCar({ tid: record?.TID, page: 1, page_size: 1 })
  const normalCount = useMobileCar({ tid: record?.TID, is_over_weight: MOBILE_IS_OVER_WEIGHT_BY_FILTER.normal, page: 1, page_size: 1 })
  const overweightCount = useMobileCar({ tid: record?.TID, is_over_weight: MOBILE_IS_OVER_WEIGHT_BY_FILTER.overweight, page: 1, page_size: 1 })

  const stats: FilterStats = useMemo(() => ({
    all: allCount.data?.data.data.meta.total,
    normal: normalCount.data?.data.data.meta.total,
    overweight: overweightCount.data?.data.data.meta.total,
  }), [allCount.data, normalCount.data, overweightCount.data])

  // Row count for the export dialog — the CURRENT filter's total, from the same
  // meta the table's pagination reads.
  const exportCount = data?.data.data.meta.total

  // Rows currently visible in the table/grid (both render this same page of
  // data) — the export dialog's หน้าปัจจุบัน scope.
  const pageRows = useMemo<MobileCarList[]>(() => data?.data.data.data ?? [], [data])

  // Human-readable note of the modal's scope — printed in the PDF header so a
  // reader knows which checkpoint/day/filter subset they're looking at.
  const exportFilterNote = useMemo(() => {
    const parts: string[] = []
    if (record?.WayID) parts.push(`ตรวจสอบน้ำหนักเคลื่อนที่ ${record.WayID}`)
    if (record?.CreateDate) parts.push(`วันที่จัดตั้งด่าน ${dayjs(record.CreateDate, 'DD/MM/BBBB').format('DD MMM BBBB')}`)
    const filterLabel = MOBILE_WEIGHT_FILTERS.find((f) => f.key === weightFilter)?.label
    if (weightFilter !== 'all' && filterLabel) parts.push(`สถานะ ${filterLabel}`)
    return parts.length ? parts.join(' · ') : undefined
  }, [record, weightFilter])

  // The table server-paginates internally, so the export fetches the full
  // result set for the CURRENT filter through the same endpoint the table
  // reads at click time.
  const fetchExportRows = async (): Promise<MobileCarList[]> => {
    const { getTrackingMobileCarAPI } = await import('@/services/routes/TrackingDetailService')
    const fetchPage = async (fetchSize: number) =>
      (await getTrackingMobileCarAPI({
        tid: record?.TID,
        is_over_weight: MOBILE_IS_OVER_WEIGHT_BY_FILTER[weightFilter],
        page: 1,
        page_size: fetchSize,
      })).data.data
    const first = await fetchPage(EXPORT_PAGE_SIZE)
    const total = first.meta?.total ?? 0
    if (total > EXPORT_PAGE_SIZE) return (await fetchPage(total)).data
    return first.data
  }

  const renderContent = useMemo(() => {
    switch (displayType) {
      case 'TABLE':
        return (
          <TableMobileDailyWeight
            data={data?.data.data}
            isLoading={isLoading}
            isError={isError}
            page={page}
            pageSize={pageSize}
            total={data?.data.data.meta.total}
            onPageChange={handlePageChange}
          />
        )
      case 'GRID':
        return (
          <MobileDailyWeightList
            data={data?.data.data}
            isLoading={isLoading}
            isError={isError}
            page={page}
            pageSize={pageSize}
            total={data?.data.data.meta.total}
            onPageChange={handlePageChange}
          />
        )
      default:
        return null
    }
  }, [displayType, data, isLoading, isError, page, pageSize])

  return (
    <div>
      <section>
        <h3 className='text-(--yellow)'>รายละเอียดรถเข้าชั่ง</h3>
        <p className='fs-12 text-white/50'>ตรวจสอบน้ำหนักเคลื่อนที่ : {record?.WayID || '-'}</p>
        <p className='fs-12'>
          วันที่จัดตั้งด่าน : {record?.CreateDate ? dayjs(record.CreateDate, 'DD/MM/BBBB').format('DD MMM BBBB') : '-'}
        </p>
      </section>
      <section className='mt-5'>
        <FormSearchMobileLog
          activeFilter={weightFilter}
          onFilterChange={handleFilterChange}
          stats={stats}
          displayType={displayType}
          onDisplayTypeChange={setDisplayType}
          onExport={() => setExportOpen(true)}
        />
      </section>
      <section className='mt-5'>
        {renderContent}
      </section>

      {/* นำออกเอกสาร — exports the checkpoint's weighing rows for the CURRENT
          filter (same columns/format as TableMobileDailyWeight, minus image
          columns). Mounted inside the log modal; antd stacks the nested modal
          itself. */}
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
            filenameBase: 'Tracking_Mobile_Weight_Log',
            title: 'รายงานรายละเอียดรถเข้าชั่ง ด่านชั่งน้ำหนักเคลื่อนที่ (Mobile Weight Log)',
            filterNote: exportFilterNote,
            columns: MOBILE_LOG_EXPORT_COLUMNS.map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows,
          })
        }}
        onExportExcel={async (scope) => {
          const [{ exportExcel }, rows] = await Promise.all([
            import('@/utils/export/excel'),
            scope === 'page' ? Promise.resolve(pageRows) : fetchExportRows(),
          ])
          exportExcel({
            filenameBase: 'Tracking_Mobile_Weight_Log',
            sheetName: 'Mobile Weight Log',
            columns: MOBILE_LOG_EXPORT_COLUMNS.map(({ header, width, value }) => ({ header, width, value })),
            rows,
          })
        }}
      />
    </div>
  )
}

interface Props {

}

const ModalMobileLog: React.FC<Props> = () => {
  const { openMobileLog, setOpenMobileLog } = useMobileContext()
  const { open, record } = openMobileLog

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
        open={open}
        onOk={() => setOpenMobileLog(INIT_OPEN_MOBILE_LOG)}
        onCancel={() => setOpenMobileLog(INIT_OPEN_MOBILE_LOG)}
        footer={null}
        destroyOnHidden
        width={1700}
      >
        <Content record={record} />
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ModalMobileLog)
