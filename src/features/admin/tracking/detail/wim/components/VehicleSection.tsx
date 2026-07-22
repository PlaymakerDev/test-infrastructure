import React, { useCallback, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import {
  FormSearchVehicle,
  VehicleStatCard,
  TableVehicleData,
  ModalWeightLog
} from '../components'
import ExportFileModal from '@/components/export/ExportFileModal'
import { useWIMContext } from '../context'
import { usePositionById } from '../hooks'
import type { StationDailyData } from '@/types/tracking/detail-api'

dayjs.extend(buddhistEra)
dayjs.locale('th')

interface Props {

}

// Mirrors the table's max page-size option; when the result set is larger the
// export refetches with the reported total so nothing is cut off.
const EXPORT_PAGE_SIZE = 100

// Same status derivation as TableVehicleData's getStatus — keep in sync.
const getDailyStatus = (remark: string, total: number): string => {
  if (total > 0) return 'เปิดปกติ'
  if (remark === 'ON' && total === 0) return 'ไม่ส่งข้อมูล'
  return 'ระบบขัดข้อง'
}

const STATUS_LABEL: Record<string, string> = {
  normal: 'เปิดปกติ',
  abnormal: 'ระบบขัดข้อง',
  wim_disconnected: 'ไม่ส่งข้อมูล',
}

// Shared column config for both PDF and Excel exports — SAME columns, SAME
// order as the on-screen TableVehicleData (the สถานะ cell is a click-to-modal
// button on screen; the export keeps its label text). `width` = Excel chars,
// `widthPct` = PDF table percent (sums to 100). WIMDailyData rows are a
// superset of StationDailyData, so one row type covers both station types.
const buildVehicleExportColumns = (stationType: string | null | undefined): {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: StationDailyData, index: number) => string | number
}[] => [
  { header: 'ลำดับ', width: 7, widthPct: 6, value: (_r, i) => i + 1 },
  {
    header: 'วันที่',
    width: 16,
    widthPct: 15,
    value: (r) => (r.date_time ? dayjs(r.date_time, 'DD/MM/BBBB').format('DD MMM BBBB') : '-'),
  },
  {
    header: stationType === 'WIM' ? 'Weight in Motion (WIM)' : 'สถานี',
    width: 30,
    widthPct: 25,
    align: 'left',
    value: (r) => r.station_name || '-',
  },
  { header: 'จำนวนรถเข้าชั่ง', width: 14, widthPct: 14, value: (r) => r.total },
  { header: 'จำนวนรถน้ำหนักเกิน', width: 18, widthPct: 14, value: (r) => r.total_over },
  { header: 'จำนวนรถน้ำหนักเกิน 10%', width: 21, widthPct: 14, value: (r) => r.isover_10percent },
  { header: 'สถานะ', width: 12, widthPct: 12, value: (r) => getDailyStatus(r.remark, r.total) },
]

const VehicleSection: React.FC<Props> = () => {
  const { id, stationType, stationTypeId, vehicleSearchParams, setVehicleSearchParams } = useWIMContext()
  const [exportOpen, setExportOpen] = useState(false)
  // Rows currently visible in the table + its meta total (TableVehicleData
  // paginates internally and reports up) — feeds the export dialog's
  // ทั้งหมด/หน้าปัจจุบัน scope toggle. Stable callback so the table's report
  // effect doesn't re-fire every parent render.
  const [pageData, setPageData] = useState<{ rows: StationDailyData[]; total: number; offset: number }>({ rows: [], total: 0, offset: 0 })
  const handlePageRowsChange = useCallback(
    (rows: StationDailyData[], total: number, page: number, pageSize: number) =>
      setPageData({ rows, total, offset: (page - 1) * pageSize }),
    [],
  )

  // Same query key as OverallSection's fetch — shares the cache entry instead
  // of re-fetching when the user has already visited the ภาพรวม tab.
  const { data: positionByID } = usePositionById(id as string | number | undefined, stationTypeId)

  const exportColumns = useMemo(() => buildVehicleExportColumns(stationType), [stationType])

  // หน้าปัจจุบัน scope: the on-screen table numbers rows continuously across
  // pages ((page-1)*size+i+1) — offset the exported ลำดับ to match it.
  const columnsForScope = (scope?: 'all' | 'page') =>
    scope === 'page'
      ? exportColumns.map((c) =>
          c.header === 'ลำดับ'
            ? { ...c, value: (_r: StationDailyData, i: number) => pageData.offset + i + 1 }
            : c,
        )
      : exportColumns

  // Human-readable note of the active search — printed in the PDF header so a
  // reader knows what subset they're looking at.
  const exportFilterNote = useMemo(() => {
    const parts: string[] = []
    const { start_date, end_date, station_status } = vehicleSearchParams
    if (start_date && end_date) {
      parts.push(`วันที่ ${dayjs(start_date).format('DD/MM/BBBB')} – ${dayjs(end_date).format('DD/MM/BBBB')}`)
    }
    if (station_status) parts.push(`สถานะ ${STATUS_LABEL[station_status] ?? station_status}`)
    return parts.length ? parts.join(' · ') : undefined
  }, [vehicleSearchParams])

  // The table server-paginates internally, so the export fetches the full
  // result set for the CURRENT search params through the same endpoint the
  // table reads (station vs wim daily) at click time.
  const fetchExportRows = async (): Promise<StationDailyData[]> => {
    const { getTrackingStationDailyAPI, getTrackingWIMDailyAPI } = await import(
      '@/services/routes/TrackingDetailService'
    )
    const fetchPage = async (pageSize: number) => {
      const params = { ...vehicleSearchParams, station_id: id as string, page: 1, page_size: pageSize }
      const res = stationType === 'WIM'
        ? await getTrackingWIMDailyAPI(params)
        : await getTrackingStationDailyAPI(params)
      return res.data
    }
    const first = await fetchPage(EXPORT_PAGE_SIZE)
    const total = first.meta?.total ?? 0
    if (total > EXPORT_PAGE_SIZE) return (await fetchPage(total)).data
    return first.data
  }

  return (
    <div>
      <section>
        <FormSearchVehicle positionByID={positionByID?.data} onSearch={setVehicleSearchParams} onExport={() => setExportOpen(true)} />
      </section>
      <section className='mt-5'>
        <VehicleStatCard />
      </section>
      <section className='mt-5'>
        <TableVehicleData onPageRowsChange={handlePageRowsChange} />
      </section>
      <ModalWeightLog />

      {/* นำออกเอกสาร — exports the daily-weighing rows for the CURRENT search
          (same columns/format as TableVehicleData). The scope toggle picks
          ทั้งหมด (full filtered set, fetched at export time) vs หน้าปัจจุบัน
          (the rows the table shows). */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        scope={{ totalCount: pageData.total, pageCount: pageData.rows.length }}
        onExportPdf={async (scope) => {
          const [{ exportTablePdf }, rows] = await Promise.all([
            import('@/utils/export/pdf'),
            scope === 'page' ? Promise.resolve(pageData.rows) : fetchExportRows(),
          ])
          await exportTablePdf({
            filenameBase: 'Tracking_Vehicle_Daily_Report',
            title: 'รายงานข้อมูลรถเข้าชั่งรายวัน',
            filterNote: exportFilterNote,
            columns: columnsForScope(scope).map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows,
          })
        }}
        onExportExcel={async (scope) => {
          const [{ exportExcel }, rows] = await Promise.all([
            import('@/utils/export/excel'),
            scope === 'page' ? Promise.resolve(pageData.rows) : fetchExportRows(),
          ])
          exportExcel({
            filenameBase: 'Tracking_Vehicle_Daily_Report',
            sheetName: 'Vehicle Daily',
            title: 'รายงานข้อมูลรถเข้าชั่งรายวัน',
            filterNote: exportFilterNote,
            columns: columnsForScope(scope).map(({ header, width, value }) => ({ header, width, value })),
            rows,
          })
        }}
      />
    </div>
  )
}

export default React.memo<Props>(VehicleSection)
