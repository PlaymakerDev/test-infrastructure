import React, { useCallback, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import {
  FormSearchVehicle,
  VehicleStatCard,
  TableVehicleData,
  ModalMobileLog
} from '../components'
import ExportFileModal from '@/components/export/ExportFileModal'
import { useMobileContext } from '../context'
import { useMobileMasterDepartmentByTID } from '../hooks'
import { fmtNumber } from '@/utils/formatNumber'
import type { MobileMasterData } from '@/types/tracking/detail-api'

dayjs.extend(buddhistEra)
dayjs.locale('th')

interface Props {

}

// Mirrors the table's max page-size option; when the result set is larger the
// export refetches with the reported total so nothing is cut off.
const EXPORT_PAGE_SIZE = 100

// Shared column config for both PDF and Excel exports — SAME columns, SAME
// order and cell text as the on-screen TableVehicleData (the สถานะ cell is a
// click-to-modal button on screen; the export keeps its label text; the
// table's "ไม่ระบุ" placeholder is kept too). `width` = Excel chars,
// `widthPct` = PDF table percent (sums to 100).
const MOBILE_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: MobileMasterData, index: number) => string | number
}[] = [
  { header: 'ลำดับ', width: 7, widthPct: 6, value: (_r, i) => i + 1 },
  {
    header: 'วันที่',
    width: 16,
    widthPct: 15,
    value: (r) => (r.CreateDate ? dayjs(r.CreateDate, 'DD/MM/BBBB').format('DD MMM BBBB') : 'ไม่ระบุ'),
  },
  { header: 'เวลาจัดตั้ง', width: 12, widthPct: 12, value: (r) => (r.TimeFrom ? `${r.TimeFrom} น.` : 'ไม่ระบุ') },
  { header: 'เวลาสิ้นสุด', width: 12, widthPct: 12, value: (r) => (r.TimeTo ? `${r.TimeTo} น.` : 'ไม่ระบุ') },
  { header: 'ร่วมบูรณาการ', width: 16, widthPct: 15, value: (r) => r.Collaboration || 'ไม่ระบุ' },
  { header: 'จำนวนรถเข้าชั่ง', width: 14, widthPct: 14, value: (r) => fmtNumber(Number(r.Total)) || 0 },
  { header: 'จำนวนรถน้ำหนักรวมเกิน', width: 20, widthPct: 14, value: (r) => fmtNumber(Number(r.TotalOver)) || 0 },
  {
    header: 'สถานะ',
    width: 10,
    widthPct: 12,
    value: (r) => (r.IsOpen === 1 ? 'เปิดด่าน' : r.IsOpen === 0 ? 'ปิดด่าน' : '-'),
  },
]

const VehicleSection: React.FC<Props> = () => {
  const { id, searchParams, setSearchParams } = useMobileContext()
  const [exportOpen, setExportOpen] = useState(false)
  // Rows currently visible in the table + its meta total (TableVehicleData
  // paginates internally and reports up) — feeds the export dialog's
  // ทั้งหมด/หน้าปัจจุบัน scope toggle. Stable callback so the table's report
  // effect doesn't re-fire every parent render.
  const [pageData, setPageData] = useState<{ rows: MobileMasterData[]; total: number }>({ rows: [], total: 0 })
  const handlePageRowsChange = useCallback(
    (rows: MobileMasterData[], total: number) => setPageData({ rows, total }),
    [],
  )

  // Same query key as OverallSection's fetch — shares the cache entry instead
  // of re-fetching when the user has already visited the ภาพรวม tab.
  const { data: departmentResponse } = useMobileMasterDepartmentByTID(id as string | number | undefined)
  const departmentData = departmentResponse?.data.data

  // Human-readable note of the active search — printed in the PDF header so a
  // reader knows what subset they're looking at.
  const exportFilterNote = useMemo(() => {
    const parts: string[] = []
    const { start_date, end_date, is_open } = searchParams
    if (start_date && end_date) {
      parts.push(`วันที่ ${dayjs(start_date).format('DD/MM/BBBB')} – ${dayjs(end_date).format('DD/MM/BBBB')}`)
    }
    if (is_open != null) parts.push(`สถานะ ${is_open === 1 ? 'เปิดด่าน' : 'ปิดด่าน'}`)
    return parts.length ? parts.join(' · ') : undefined
  }, [searchParams])

  // The table server-paginates internally, so the export fetches the full
  // result set for the CURRENT search params through the same endpoint the
  // table reads at click time.
  const fetchExportRows = async (): Promise<MobileMasterData[]> => {
    const { getTrackingMobileMasterAPI } = await import('@/services/routes/TrackingDetailService')
    const fetchPage = async (pageSize: number) =>
      (await getTrackingMobileMasterAPI({ ...searchParams, page: 1, page_size: pageSize })).data
    const first = await fetchPage(EXPORT_PAGE_SIZE)
    const total = first.meta?.total ?? 0
    if (total > EXPORT_PAGE_SIZE) return (await fetchPage(total)).data
    return first.data
  }

  return (
    <div>
      <section>
        <FormSearchVehicle departmentData={departmentData} onSearch={setSearchParams} onExport={() => setExportOpen(true)} />
      </section>
      <section className='mt-5'>
        <VehicleStatCard />
      </section>
      <section className='mt-5'>
        <TableVehicleData onPageRowsChange={handlePageRowsChange} />
      </section>
      <ModalMobileLog />

      {/* นำออกเอกสาร — exports the checkpoint rows for the CURRENT search
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
            filenameBase: 'Tracking_Mobile_Report',
            title: 'รายงานข้อมูลการจัดตั้งด่านชั่งน้ำหนัก (Mobile)',
            filterNote: exportFilterNote,
            columns: MOBILE_EXPORT_COLUMNS.map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows,
          })
        }}
        onExportExcel={async (scope) => {
          const [{ exportExcel }, rows] = await Promise.all([
            import('@/utils/export/excel'),
            scope === 'page' ? Promise.resolve(pageData.rows) : fetchExportRows(),
          ])
          exportExcel({
            filenameBase: 'Tracking_Mobile_Report',
            sheetName: 'Mobile',
            columns: MOBILE_EXPORT_COLUMNS.map(({ header, width, value }) => ({ header, width, value })),
            rows,
          })
        }}
      />
    </div>
  )
}

export default React.memo<Props>(VehicleSection)
