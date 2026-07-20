import React, { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import {
  TableMobileDailyWeight,
  MobileDailyWeightList,
  FormSearchDailyWeight
} from '@/features/admin/tracking/detail/mobile/components'
import ExportFileModal from '@/components/export/ExportFileModal'
import { useMobileCar } from '@/features/admin/tracking/detail/mobile/hooks'
import { useMobileContext } from '@/features/admin/tracking/detail/mobile/context'
import { fmtNumber } from '@/utils/formatNumber'
import type { MobileCarList } from '@/types/tracking/detail-api'

dayjs.extend(buddhistEra)
dayjs.locale('th')

interface Props {

}

const DEFAULT_PAGE_SIZE = 10

// Mirrors the table's max page-size option; when the result set is larger the
// export refetches with the reported total so nothing is cut off.
const EXPORT_PAGE_SIZE = 100

// Shared column config for both PDF and Excel exports — SAME columns, SAME
// order and cell text as the on-screen TableMobileDailyWeight. The two image
// columns (ภาพรถบรรทุก / สลิปน้ำหนัก) are skipped — table exports are
// text-only. `width` = Excel chars, `widthPct` = PDF percent (sums to 100).
const DAILY_WEIGHT_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: MobileCarList, index: number) => string | number
}[] = [
  { header: 'ลำดับ', width: 7, widthPct: 5, value: (_r, i) => i + 1 },
  {
    header: 'วันที่และเวลา',
    width: 21,
    widthPct: 15,
    value: (r) =>
      r.create_date ? dayjs(r.create_date, 'DD/MM/BBBB HH:mm:ss').format('DD MMM BBBB HH:mm:ss') : '-',
  },
  { header: 'ทะเบียนรถ', width: 16, widthPct: 11, value: (r) => r.lp_head || '-' },
  { header: 'ประเภทรถบรรทุก', width: 36, widthPct: 22, align: 'left', value: (r) => r.vehicle_class_desc || '-' },
  { header: 'น้ำหนักที่ชั่งได้', width: 13, widthPct: 11, value: (r) => (r.gross_weight ? fmtNumber(Number(r.gross_weight), 2) : '-') },
  { header: 'น้ำหนักตามกำหนด', width: 15, widthPct: 11, value: (r) => (r.legal_weight ? fmtNumber(Number(r.legal_weight), 2) : '-') },
  { header: 'น้ำหนักเกิน', width: 11, widthPct: 9, value: (r) => (r.gross_weight_over ? fmtNumber(Number(r.gross_weight_over), 2) : 0) },
  { header: 'สถานะน้ำหนักรวม', width: 15, widthPct: 8, value: (r) => (r.is_over_weight === 'Y' ? 'น้ำหนักเกิน' : 'น้ำหนักปกติ') },
  { header: 'สถานะเพลา', width: 12, widthPct: 8, value: (r) => (r.is_over_weight === 'P' ? 'น้ำหนักเกิน' : 'น้ำหนักปกติ') },
]

const OverallDataDisplaySection: React.FC<Props> = () => {
  const { id } = useMobileContext()
  const [displayType, setDisplayType] = useState<'TABLE' | 'GRID'>('TABLE')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [exportOpen, setExportOpen] = useState(false)

  const { data, isLoading, isError } = useMobileCar({
    tid: String(id),
    page,
    page_size: pageSize
  })

  // The table/grid server-paginates, so the export fetches the full result set
  // through the same endpoint (same params as the on-screen read) at click time.
  const fetchExportRows = async (): Promise<MobileCarList[]> => {
    const { getTrackingMobileCarAPI } = await import('@/services/routes/TrackingDetailService')
    const fetchPage = async (pageSize: number) =>
      (await getTrackingMobileCarAPI({ tid: String(id), page: 1, page_size: pageSize })).data.data
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
            onPageChange={(nextPage: number, nextPageSize: number) => {
              setPage(nextPage)
              setPageSize(nextPageSize)
            }}
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
            onPageChange={(nextPage: number, nextPageSize: number) => {
              setPage(nextPage)
              setPageSize(nextPageSize)
            }}
          />
        )
      default:
        return null
    }
  }, [displayType, data, isLoading, isError, page, pageSize])

  return (
    <div>
      <section>
        <FormSearchDailyWeight
          displayType={displayType}
          setDisplayType={setDisplayType}
          onExport={() => setExportOpen(true)}
        />
      </section>
      <section className='mt-5'>
        {renderContent}
      </section>

      {/* นำออกเอกสาร — exports the daily-weighing vehicle rows the table/grid
          shows (same columns/format as TableMobileDailyWeight, minus images). */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        count={data?.data.data.meta.total}
        onExportPdf={async () => {
          const [{ exportTablePdf }, rows] = await Promise.all([
            import('@/utils/export/pdf'),
            fetchExportRows(),
          ])
          await exportTablePdf({
            filenameBase: 'Tracking_Mobile_Daily_Weight_Report',
            title: 'รายงานข้อมูลรถเข้าชั่งประจำวัน',
            columns: DAILY_WEIGHT_EXPORT_COLUMNS.map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows,
          })
        }}
        onExportExcel={async () => {
          const [{ exportExcel }, rows] = await Promise.all([
            import('@/utils/export/excel'),
            fetchExportRows(),
          ])
          exportExcel({
            filenameBase: 'Tracking_Mobile_Daily_Weight_Report',
            sheetName: 'Daily Weight',
            columns: DAILY_WEIGHT_EXPORT_COLUMNS.map(({ header, width, value }) => ({ header, width, value })),
            rows,
          })
        }}
      />
    </div>
  )
}

export default React.memo<Props>(OverallDataDisplaySection)
