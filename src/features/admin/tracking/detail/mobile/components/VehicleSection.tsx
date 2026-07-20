import React, { useMemo, useState } from 'react'
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
  const { searchParams, setSearchParams } = useMobileContext()
  const [exportOpen, setExportOpen] = useState(false)

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
        <FormSearchVehicle onSearch={setSearchParams} onExport={() => setExportOpen(true)} />
      </section>
      <section className='mt-5'>
        <VehicleStatCard />
      </section>
      <section className='mt-5'>
        <TableVehicleData />
      </section>
      <ModalMobileLog />

      {/* นำออกเอกสาร — exports the checkpoint rows for the CURRENT search
          (same columns/format as TableVehicleData). */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onExportPdf={async () => {
          const [{ exportTablePdf }, rows] = await Promise.all([
            import('@/utils/export/pdf'),
            fetchExportRows(),
          ])
          await exportTablePdf({
            filenameBase: 'Tracking_Mobile_Report',
            title: 'รายงานข้อมูลการจัดตั้งด่านชั่งน้ำหนัก (Mobile)',
            filterNote: exportFilterNote,
            columns: MOBILE_EXPORT_COLUMNS.map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows,
          })
        }}
        onExportExcel={async () => {
          const [{ exportExcel }, rows] = await Promise.all([
            import('@/utils/export/excel'),
            fetchExportRows(),
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
